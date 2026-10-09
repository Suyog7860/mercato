const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
        title: { type: String, required: true },
        image: { type: String, default: '' },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, max: 99 },
    },
    { _id: false }
)

const shippingSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, default: '' },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    { _id: false }
)

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
        items: { type: [orderItemSchema], required: true },
        shipping: { type: shippingSchema, required: true },
        total: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, min: 0 },
        paymentMethod: {
            type: String,
            enum: ['cash_on_delivery', 'razorpay'],
            default: 'cash_on_delivery',
        },
        razorpayOrderId: { type: String, default: null },
        razorpayPaymentId: { type: String, default: null },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        orderStatus: { type: String, default: 'pending' },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        statusHistory: {
            type: [{ status: { type: String, required: true }, at: { type: Date, required: true, default: Date.now } }],
            default: [],
        },
    },
    { timestamps: true }
)

orderSchema.pre('validate', function () {
    if (this.totalAmount === undefined) this.totalAmount = this.total
    if (this.orderStatus === undefined || this.orderStatus === 'pending') this.orderStatus = this.status
    if (!this.statusHistory.length) this.statusHistory.push({ status: this.status })
})

module.exports = mongoose.model('Orders', orderSchema)
