const mongoose = require('mongoose')
const Products = require('../models/productModel')
const { CATEGORIES, GENDERS } = require('../models/productModel')
const Orders = require('../models/orderModel')
const Users = require('../models/userModel')

const MAX_LIMIT = 100
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function parseBoundedNumber(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
    if (value === undefined || value === '') return undefined
    const number = Number(value)
    if (!Number.isFinite(number) || number < min || number > max) return null
    return number
}

function validateProduct(body, { creating = false } = {}) {
    const name = (body.name ?? body.title)?.trim()
    const category = body.category?.trim()
    const gender = body.gender
    const brand = body.brand?.trim()
    const description = body.description?.trim()
    const price = parseBoundedNumber(body.price)
    const hasDiscount = body.discountPrice !== undefined && body.discountPrice !== null && body.discountPrice !== ''
    const discountPrice = hasDiscount ? parseBoundedNumber(body.discountPrice) : null
    const stock = parseBoundedNumber(body.stock ?? 0, { max: 1000000 })
    const productId = (body.product_id ?? body.slug ?? name)?.trim()
    const slug = (body.slug ?? productId)?.trim()
    const images = Array.isArray(body.images)
        ? body.images.map((image) => typeof image === 'string' ? { url: image } : image).filter((image) => image?.url)
        : body.images?.url ? [body.images] : []

    if (
        !name || !category || !gender || !brand || !description ||
        !CATEGORIES.includes(category) || !GENDERS.includes(gender) ||
        price === null || price === undefined || (hasDiscount && discountPrice === null) ||
        stock === null || !Number.isInteger(stock) ||
        (discountPrice !== null && discountPrice > price) ||
        images.length !== 1 || images.some((image) => typeof image.url !== 'string' || !/^https?:\/\//i.test(image.url))
    ) {
        return { error: 'Provide valid product details and exactly one image.' }
    }
    if (creating && !productId) return { error: 'Product ID is required' }

    return {
        product: {
            ...(creating ? { product_id: productId, slug } : {}),
            name,
            description,
            content: body.content?.trim() || description,
            category,
            gender,
            brand,
            price,
            discountPrice,
            stock,
            images,
            featured: body.featured === true || body.featured === 'true',
        },
    }
}

const productCtrl = {
    getProducts: async (req, res) => {
        try {
            const page = req.query.page === undefined ? 1 : parseBoundedNumber(req.query.page, { min: 1, max: 1000000 })
            const limit = req.query.limit === undefined ? 20 : parseBoundedNumber(req.query.limit, { min: 1, max: MAX_LIMIT })
            if (page === null || limit === null) return res.status(400).json({ msg: 'Page or limit is outside the supported range' })
            if (!Number.isInteger(page) || !Number.isInteger(limit)) {
                return res.status(400).json({ msg: 'Page and limit must be positive whole numbers' })
            }
            const filter = {}
            if (req.query.gender) {
                if (!GENDERS.includes(req.query.gender)) return res.status(400).json({ msg: 'Choose Men or Women for gender' })
                filter.gender = req.query.gender
            }
            if (req.query.category) {
                if (!CATEGORIES.includes(req.query.category)) return res.status(400).json({ msg: 'Choose one of the six supported categories' })
                filter.category = req.query.category
            }
            const priceConditions = []
            for (const key of ['minPrice', 'maxPrice']) {
                const value = parseBoundedNumber(req.query[key])
                if (value === null) return res.status(400).json({ msg: `${key} must be a non-negative number` })
                if (value !== undefined) {
                    priceConditions.push({
                        $expr: {
                            [key === 'minPrice' ? '$gte' : '$lte']: [
                                { $ifNull: ['$discountPrice', '$price'] },
                                value,
                            ],
                        },
                    })
                }
            }
            if (priceConditions.length) filter.$and = priceConditions
            const rating = parseBoundedNumber(req.query.rating, { max: 5 })
            if (rating === null) return res.status(400).json({ msg: 'Rating filter must be from 0 to 5' })
            if (rating !== undefined) filter.rating = { $gte: rating }
            if (req.query.stock === 'in') filter.stock = { $gt: 0 }
            else if (req.query.stock === 'out') filter.stock = 0
            else if (req.query.stock && req.query.stock !== 'all') return res.status(400).json({ msg: 'Stock filter must be in or out' })

            if (typeof req.query.search === 'string' && req.query.search.trim()) {
                const terms = req.query.search.trim().slice(0, 100).split(/\s+/).map(escapeRegex)
                filter.$and = [...(filter.$and || []), ...terms.map((term) => ({
                    $or: ['name', 'brand', 'category', 'gender', 'description'].map((field) => ({
                        [field]: { $regex: term, $options: 'i' },
                    })),
                }))]
            }

            const sortOptions = {
                featured: { featured: -1, createdAt: -1 },
                newest: { createdAt: -1 },
                price_asc: { price: 1, createdAt: -1 },
                price_desc: { price: -1, createdAt: -1 },
                rating: { rating: -1, reviewsCount: -1, createdAt: -1 },
                popular: { sold: -1, createdAt: -1 },
            }
            const sort = sortOptions[req.query.sort || 'featured']
            if (!sort) return res.status(400).json({ msg: 'Unsupported product sort option' })

            const productQuery = req.query.sort === 'price_asc' || req.query.sort === 'price_desc'
                ? Products.aggregate([
                    { $match: filter },
                    { $addFields: { __effectivePrice: { $ifNull: ['$discountPrice', '$price'] } } },
                    { $sort: { __effectivePrice: req.query.sort === 'price_asc' ? 1 : -1, createdAt: -1 } },
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    { $project: { __effectivePrice: 0 } },
                ])
                : Products.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
            const [products, totalProducts] = await Promise.all([
                productQuery,
                Products.countDocuments(filter),
            ])
            return res.json({
                products,
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalProducts,
            })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },

    getProduct: async (req, res) => {
        try {
            const lookup = mongoose.isValidObjectId(req.params.id)
                ? { _id: req.params.id }
                : { slug: req.params.id }
            const product = await Products.findOne(lookup)
            if (!product) return res.status(404).json({ msg: 'Product not found' })
            return res.json(product)
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },

    addReview: async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid product ID' })
            const rating = Number(req.body?.rating)
            const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : ''
            if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 1500) {
                return res.status(400).json({ msg: 'Provide a rating from 1 to 5 and a comment under 1,500 characters' })
            }
            const verifiedPurchase = await Orders.exists({
                user: req.user.id,
                status: 'delivered',
                $or: [
                    { paymentMethod: 'cash_on_delivery' },
                    { paymentMethod: 'razorpay', paymentStatus: 'paid' },
                ],
                'items.product': req.params.id,
            })
            if (!verifiedPurchase) return res.status(403).json({ msg: 'Reviews are available after a verified purchase is delivered' })

            const [product, user] = await Promise.all([
                Products.findById(req.params.id),
                Users.findById(req.user.id).select('name'),
            ])
            if (!product) return res.status(404).json({ msg: 'Product not found' })
            if (!user) return res.status(401).json({ msg: 'Your account could not be found' })
            const existing = product.reviews.find((review) => String(review.user) === String(user._id))
            if (existing) {
                existing.rating = rating
                existing.comment = comment
                existing.name = user.name
                existing.verifiedPurchase = true
            } else {
                product.reviews.push({ user: user._id, name: user.name, rating, comment, verifiedPurchase: true })
            }
            product.reviewsCount = product.reviews.length
            product.rating = Number((product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviewsCount).toFixed(1))
            await product.save()
            return res.json(product)
        } catch (err) {
            return res.status(500).json({ msg: 'Could not save your review' })
        }
    },

    createProducts: async (req, res) => {
        try {
            const result = validateProduct(req.body || {}, { creating: true })
            if (result.error) return res.status(400).json({ msg: result.error })
            if (await Products.exists({ 'images.url': result.product.images[0].url })) {
                return res.status(409).json({ msg: 'That product image is already used by another product' })
            }
            const product = await Products.create(result.product)
            return res.status(201).json(product)
        } catch (err) {
            if (err.code === 11000) return res.status(400).json({ msg: 'Product ID or slug already exists' })
            return res.status(500).json({ msg: err.message })
        }
    },

    deleteProducts: async (req, res) => {
        try {
            const product = await Products.findByIdAndDelete(req.params.id)
            if (!product) return res.status(404).json({ msg: 'Product not found' })
            return res.json({ msg: 'Deleted a product' })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },

    updateProducts: async (req, res) => {
        try {
            const result = validateProduct(req.body || {}, { creating: true })
            if (result.error) return res.status(400).json({ msg: result.error })
            if (await Products.exists({
                _id: { $ne: req.params.id },
                'images.url': result.product.images[0].url,
            })) {
                return res.status(409).json({ msg: 'That product image is already used by another product' })
            }
            delete result.product.product_id
            delete result.product.slug
            const product = await Products.findByIdAndUpdate(
                req.params.id,
                result.product,
                { new: true, runValidators: true }
            )
            if (!product) return res.status(404).json({ msg: 'Product not found' })
            return res.json(product)
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
}

module.exports = productCtrl
