const dns = require('node:dns')
const mongoose = require('mongoose')
require('dotenv').config()

dns.setServers(['8.8.8.8', '1.1.1.1'])

const Products = require('../models/productModel')
const Categories = require('../models/categoryModel')
const catalogImageIds = require('../catalogImageIds')

const brandsByCategory = {
    Watches: ['Aster & Row', 'Northstar', 'Meridian', 'Forma Time', 'Fieldwork'],
    Goggles: ['Solace Studio', 'Dayform', 'Arc & Vale', 'Vista Works', 'Sunward'],
    Hats: ['Sunday Supply', 'Fieldwork', 'Common Thread', 'Northline', 'Harbor Goods'],
    Shoes: ['Stride Atelier', 'Common Ground', 'Northline', 'Forma Studio', 'Fieldwork'],
    Shirts: ['Common Thread', 'Forma Studio', 'Northline', 'Harbor Goods', 'Sunday Supply'],
    Pants: ['Fieldwork', 'Common Thread', 'Northline', 'Forma Studio', 'Harbor Goods'],
}

const styles = {
    Watches: [
        'Meridian Field', 'Heritage Chronograph', 'Coastline Automatic', 'Everyday Minimal',
        'Atlas Diver', 'Studio Square', 'Ridge Moonphase', 'Nomad GMT', 'Harbor Date',
        'Classic Roman', 'Summit Solar', 'Metro Mesh', 'Heritage Petite', 'Sundial Ceramic',
        'Avenue Tank', 'Explorer 24', 'Seafarer Steel', 'Luna Mother-of-Pearl',
        'Trail Digital', 'Grand Tourer',
    ],
    Goggles: [
        'Alpine Round', 'Coastal Aviator', 'Studio Cat-Eye', 'Trail Polarized',
        'Modern Wayfarer', 'Riviera Oval', 'Summit Shield', 'Sunday Clubmaster',
        'Desert Square', 'Vista Butterfly', 'Harbor Rectangle', 'Arc Sport',
        'Daybreak Gradient', 'Field Round', 'Solstice Oversized', 'Metro Metal',
        'Highline Wrap', 'Sundown Acetate', 'Northshore Polarized', 'Monaco Slim',
    ],
    Hats: [
        'Weekend Cotton Cap', 'Harbor Canvas Bucket', 'Ridge Wool Beanie', 'Coastal Twill Cap',
        'Field Notes Five-Panel', 'Sunday Knit Cuff', 'Trail Ripstop Hat', 'Archive Cord Cap',
        'Sunroom Straw Fedora', 'Everyday Rib Beanie', 'Summit Merino Watch Cap',
        'City Canvas Bucket', 'Riverside Dad Cap', 'Studio Baker Boy', 'Parkside Nylon Cap',
        'Heritage Wool Beret', 'Boardwalk Straw Hat', 'Alpine Fleece Cap',
        'Old Town Flat Cap', 'Daylight Linen Visor',
    ],
    Shoes: [
        'Court Classic Leather', 'Pace Runner 02', 'Weekend Canvas Low', 'Summit Trail Hiker',
        'Studio Suede Loafer', 'Everyday Knit Trainer', 'Harbor Deck Shoe', 'Metro Retro Runner',
        'Ridge Mid-Top', 'Sunday Slide', 'Fieldwork Derby', 'Coastline Court',
        'Terra Trail Runner', 'Modern Mary Jane', 'Daybreak High-Top', 'Avenue Ballet Flat',
        'Heritage Tennis Shoe', 'Cloudstep Walking Trainer', 'Northline Chelsea Boot', 'Forma Espadrille',
    ],
    Shirts: [
        'Oxford Everyday Shirt', 'Relaxed Linen Popover', 'Studio Stripe Tee', 'Weekend Chambray',
        'Harbor Camp Collar', 'Classic Pima Crew', 'Fieldwork Overshirt', 'Sunday Rib Henley',
        'Soft Brushed Flannel', 'Riviera Cotton Blouse', 'Meridian Tailored Shirt',
        'Daylight Linen Shirt', 'Heritage Rugby Top', 'Metro Boxy Tee', 'Coastal Gauze Tunic',
        'Northline Knit Polo', 'Archive Denim Shirt', 'Forma Silk-Blend Blouse',
        'Trail Performance Top', 'Common Thread Longline',
    ],
    Pants: [
        'Straight-Leg Chino', 'Relaxed Linen Trouser', 'Studio Wide-Leg Pant', 'Trail Utility Cargo',
        'Everyday Tapered Jean', 'Harbor Pleated Trouser', 'Weekend Drawstring Pant',
        'Classic Slim Chino', 'Fieldwork Carpenter Pant', 'Soft-Touch Jogger',
        'Riviera Palazzo Pant', 'Northline Barrel Jean', 'Metro Tailored Trouser',
        'Coastal Pull-On Pant', 'Archive Corduroy Trouser', 'Forma Cropped Flare',
        'Heritage Five-Pocket Jean', 'Daylight Linen Culotte', 'Ridge Performance Jogger',
        'Common Ground Straight Jean',
    ],
}

const materials = {
    Watches: ['brushed stainless steel', 'recycled steel', 'polished alloy', 'lightweight titanium', 'ceramic-finish steel'],
    Goggles: ['polarized acetate', 'lightweight recycled nylon', 'hand-finished acetate', 'UV400 lenses', 'stainless-steel wire frames'],
    Hats: ['organic cotton twill', 'recycled ripstop', 'soft merino wool', 'linen-cotton canvas', 'recycled cashmere blend'],
    Shoes: ['premium leather', 'responsibly sourced suede', 'breathable recycled knit', 'organic cotton canvas', 'recycled mesh and rubber'],
    Shirts: ['organic cotton poplin', 'washed linen blend', 'Pima cotton jersey', 'soft brushed cotton', 'recycled cotton chambray'],
    Pants: ['stretch cotton twill', 'European linen blend', 'recycled denim', 'lightweight technical nylon', 'organic cotton canvas'],
}

const colors = ['stone', 'midnight', 'olive', 'warm sand', 'deep navy', 'soft taupe', 'forest', 'chalk']
const genders = ['Men', 'Women']
const categories = Products.CATEGORIES

function slugify(value) {
    return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function makeProducts() {
    const products = []
    const imageIndexByCategory = Object.fromEntries(categories.map((category) => [category, 0]))
    for (const gender of genders) {
        for (const category of categories) {
            for (let index = 0; index < 20; index += 1) {
                const name = styles[category][index]
                const brand = brandsByCategory[category][(index + (gender === 'Women' ? 2 : 0)) % brandsByCategory[category].length]
                const material = category === 'Pants' && name === 'Relaxed Linen Trouser'
                    ? 'European linen blend'
                    : materials[category][(index + (gender === 'Women' ? 1 : 0)) % materials[category].length]
                const color = colors[(index * 3 + (gender === 'Women' ? 2 : 0)) % colors.length]
                const price = 899 + ((index * 419 + categories.indexOf(category) * 683 + (gender === 'Women' ? 257 : 0)) % 9100)
                const hasDiscount = index % 4 !== 0
                const discountPrice = hasDiscount ? Math.round(price * (0.78 + (index % 3) * 0.04)) : null
                const slug = `${slugify(gender)}-${slugify(category)}-${slugify(name)}`
                const imageIndex = imageIndexByCategory[category]
                const imageId = slug === 'women-pants-relaxed-linen-trouser'
                    ? 31400265
                    : catalogImageIds[category][imageIndex]
                if (imageId === undefined) throw new Error(`Missing catalog image for ${category} product ${index + 1}`)
                imageIndexByCategory[category] += 1
                const imageUrl = `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&w=1000&h=1200&fit=crop`

                products.push({
                    product_id: slug,
                    slug,
                    name: `${name} ${gender === 'Women' ? 'Edition' : 'Collection'}`,
                    category,
                    gender,
                    brand,
                    price,
                    discountPrice,
                    stock: 6 + ((index * 7 + categories.indexOf(category) * 3) % 48),
                    description: `A ${category.toLowerCase()} essential from ${brand}, made in ${material} in ${color}. Thoughtful proportions and considered details make this an easy favourite for ${gender.toLowerCase()} and beyond.`,
                    content: `Designed for daily wear, the ${name.toLowerCase()} pairs a ${color} finish with dependable ${material}. Carefully selected materials, versatile styling, and comfortable all-day wear make it a thoughtful addition to your everyday rotation.`,
                    images: [{ url: imageUrl }],
                    rating: Number((3.8 + ((index * 7 + categories.indexOf(category)) % 13) / 10).toFixed(1)),
                    reviewsCount: 14 + ((index * 31 + categories.indexOf(category) * 17) % 490),
                    featured: index < 3 || index % 7 === 0,
                    sold: 12 + ((index * 11 + categories.indexOf(category) * 19) % 350),
                })
            }
        }
    }
    const imageUrls = products.map((product) => product.images[0]?.url)
    if (new Set(imageUrls).size !== products.length) throw new Error('Catalog image URLs must be unique')
    return products
}

async function seed() {
    if (process.env.CONFIRM_REPLACE_PRODUCTS !== 'YES') {
        throw new Error('This replaces every product and category. Set CONFIRM_REPLACE_PRODUCTS=YES to confirm.')
    }
    if (!process.env.MONGODB_URL) throw new Error('MONGODB_URL is not configured')
    await mongoose.connect(process.env.MONGODB_URL)
    await Products.deleteMany({})
    await Categories.deleteMany({})
    await Categories.insertMany(categories.map((name) => ({ name })))
    const inserted = await Products.insertMany(makeProducts(), { ordered: true })
    console.log(`Seeded ${inserted.length} products in ${categories.length} categories across ${genders.length} collections.`)
}

if (require.main === module) {
    seed()
        .catch((error) => {
            console.error(`Catalog seed failed: ${error.message}`)
            process.exitCode = 1
        })
        .finally(async () => {
            if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
        })
}

module.exports = { makeProducts, seed }
