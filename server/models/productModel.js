const mongoose = require('mongoose')

const CATEGORIES = ['Watches', 'Goggles', 'Hats', 'Shoes', 'Shirts', 'Pants']
const GENDERS = ['Men', 'Women']

const imageSchema = new mongoose.Schema(
    {
        url: { type: String, required: true, trim: true },
        public_id: { type: String, default: '' },
    },
    { _id: false }
)

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
        name: { type: String, required: true, trim: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true, maxlength: 1500, default: '' },
        verifiedPurchase: { type: Boolean, default: false },
    },
    { timestamps: true }
)

const productSchema = new mongoose.Schema(
    {
        product_id: { type: String, unique: true, trim: true, required: true },
        name: { type: String, trim: true, required: true },
        slug: { type: String, trim: true, unique: true, required: true },
        description: { type: String, required: true, trim: true },
        content: { type: String, trim: true, default: '' },
        category: { type: String, enum: CATEGORIES, required: true, index: true },
        gender: { type: String, enum: GENDERS, required: true, index: true },
        brand: { type: String, required: true, trim: true, index: true },
        price: { type: Number, required: true, min: 0 },
        discountPrice: { type: Number, min: 0, default: null },
        stock: { type: Number, required: true, min: 0, default: 0, index: true },
        images: {
            type: [imageSchema],
            required: true,
            validate: {
                validator: (images) => Array.isArray(images) && images.length === 1,
                message: 'Exactly one product image is required',
            },
        },
        rating: { type: Number, min: 0, max: 5, default: 0, index: true },
        reviews: { type: [reviewSchema], default: [] },
        reviewsCount: { type: Number, min: 0, default: 0 },
        featured: { type: Boolean, default: false, index: true },
        sold: { type: Number, min: 0, default: 0 },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

productSchema.index({ name: 'text', brand: 'text', category: 'text', gender: 'text', description: 'text' })
productSchema.index({ gender: 1, category: 1, createdAt: -1 })
productSchema.index({ featured: -1, createdAt: -1 })

productSchema.virtual('title').get(function () {
    return this.name
})

productSchema.virtual('discountedPrice').get(function () {
    return this.discountPrice ?? null
})

productSchema.virtual('checkd').get(function () {
    return this.featured
})

module.exports = mongoose.model('Products', productSchema)
module.exports.CATEGORIES = CATEGORIES
module.exports.GENDERS = GENDERS
