const mongoose = require('mongoose')
const crypto = require('node:crypto')
const Razorpay = require('razorpay')
const Orders = require('../models/orderModel')
const Products = require('../models/productModel')

const shippingFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'postalCode', 'country']
const PAYMENT_CURRENCY = 'INR'
const ONLINE_PAYMENT_EXPIRY_MS = 20 * 60 * 1000

const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) return null
    return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

async function markPaid(order, paymentId) {
    const updated = await Orders.findOneAndUpdate(
        { _id: order._id, paymentStatus: 'pending', status: 'pending' },
        {
            $set: {
            paymentStatus: 'paid',
            razorpayPaymentId: paymentId,
            status: 'processing',
            orderStatus: 'processing',
            },
            $push: { statusHistory: { status: 'processing' } },
        },
        { new: true, runValidators: true }
    )
    if (updated) return updated
    return Orders.findOne({ _id: order._id, paymentStatus: 'paid', razorpayPaymentId: paymentId })
}

async function refundUnexpectedCapture(order, payment) {
    const razorpay = getRazorpay()
    if (!razorpay) throw new Error('Razorpay is required to refund a captured payment')
    await razorpay.payments.refund(payment.id, { amount: payment.amount })
    await Orders.updateOne(
        { _id: order._id, paymentStatus: { $ne: 'paid' } },
        { $set: { paymentStatus: 'refunded', razorpayPaymentId: payment.id } }
    )
}

async function restoreStock(items) {
    if (!items.length) return
    await Products.bulkWrite(items.map((item) => ({
        updateOne: { filter: { _id: item.product }, update: { $inc: { stock: item.quantity } } },
    })))
}

async function reserveStock(items) {
    const reserved = []
    for (const item of items) {
        const product = await Products.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true }
        )
        if (!product) {
            await restoreStock(reserved)
            return false
        }
        reserved.push(item)
    }
    return true
}

async function expirePendingPayments() {
    const expired = await Orders.find({
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        status: 'pending',
        createdAt: { $lte: new Date(Date.now() - ONLINE_PAYMENT_EXPIRY_MS) },
    }).select('_id items')
    for (const order of expired) {
        const claimed = await Orders.findOneAndUpdate(
            { _id: order._id, paymentStatus: 'pending', status: 'pending' },
            {
                $set: {
                    paymentStatus: 'failed',
                    status: 'cancelled',
                    orderStatus: 'cancelled',
                },
                $push: { statusHistory: { status: 'cancelled' } },
            },
            { new: true }
        )
        if (claimed) await restoreStock(claimed.items)
    }
}

async function buildOrder(items, shipping) {
    if (!Array.isArray(items) || items.length === 0) {
        return { error: 'Your cart is empty' }
    }
    if (!shipping || shippingFields.some((field) => typeof shipping[field] !== 'string' || !shipping[field].trim())) {
        return { error: 'Please provide all delivery details' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email.trim())) {
        return { error: 'Please enter a valid email address' }
    }

    const quantities = new Map()
    for (const item of items) {
        const id = String(item?.product ?? '')
        const quantity = Number(item?.quantity)
        if (!mongoose.isValidObjectId(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
            return { error: 'The cart contains an invalid item or quantity' }
        }
        const combined = (quantities.get(id) || 0) + quantity
        if (combined > 99) return { error: 'A product quantity cannot exceed 99' }
        quantities.set(id, combined)
    }

    const products = await Products.find({ _id: { $in: [...quantities.keys()] } })
    if (products.length !== quantities.size) {
        return { error: 'One or more products are no longer available' }
    }

    const orderItems = products.map((product) => ({
        product: product._id,
        title: product.name,
        image: product.images?.[0]?.url || '',
        price: product.discountPrice ?? product.price,
        quantity: quantities.get(String(product._id)),
    }))
    return {
        items: orderItems,
        total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        shipping: Object.fromEntries(shippingFields.map((field) => [field, shipping[field].trim()])),
    }
}

const orderCtrl = {
    expirePendingPayments,

    paymentConfig: (_req, res) => {
        return res.json({
            enabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
            currency: PAYMENT_CURRENCY,
        })
    },

    createOrder: async (req, res) => {
        try {
            await expirePendingPayments()
            const { items, shipping } = req.body || {}
            const checkout = await buildOrder(items, shipping)
            if (checkout.error) return res.status(400).json({ msg: checkout.error })
            if (!(await reserveStock(checkout.items))) return res.status(409).json({ msg: 'One or more items just sold out. Refresh your cart and try again.' })
            let order
            try {
                order = await Orders.create({
                    user: req.user.id,
                    ...checkout,
                    totalAmount: checkout.total,
                    paymentMethod: 'cash_on_delivery',
                    paymentStatus: 'pending',
                })
            } catch (err) {
                await restoreStock(checkout.items)
                throw err
            }
            return res.status(201).json(order)
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },

    createRazorpayOrder: async (req, res) => {
        try {
            await expirePendingPayments()
            const razorpay = getRazorpay()
            if (!razorpay) return res.status(503).json({ msg: 'Online payment is not configured yet' })

            const { items, shipping } = req.body || {}
            const checkout = await buildOrder(items, shipping)
            if (checkout.error) return res.status(400).json({ msg: checkout.error })
            const amount = Math.round(checkout.total * 100)
            if (!Number.isSafeInteger(amount) || amount < 100) {
                return res.status(400).json({ msg: 'Razorpay checkout requires an order total of at least ₹1' })
            }

            const paymentOrder = await razorpay.orders.create({
                amount,
                currency: PAYMENT_CURRENCY,
                expire_by: Math.floor((Date.now() + ONLINE_PAYMENT_EXPIRY_MS) / 1000),
                receipt: `mercato_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
            })
            if (!(await reserveStock(checkout.items))) return res.status(409).json({ msg: 'One or more items just sold out. Refresh your cart and try again.' })
            let order
            try {
                order = await Orders.create({
                    user: req.user.id,
                    ...checkout,
                    totalAmount: checkout.total,
                    paymentMethod: 'razorpay',
                    paymentStatus: 'pending',
                    razorpayOrderId: paymentOrder.id,
                })
            } catch (err) {
                await restoreStock(checkout.items)
                throw err
            }
            return res.status(201).json({
                orderId: String(order._id),
                razorpayOrderId: paymentOrder.id,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                customer: { name: checkout.shipping.name, email: checkout.shipping.email, phone: checkout.shipping.phone },
            })
        } catch (err) {
            console.error('Razorpay order creation failed:', err.name)
            return res.status(502).json({ msg: 'Could not start Razorpay checkout. Please try again.' })
        }
    },

    verifyRazorpayPayment: async (req, res) => {
        try {
            const razorpay = getRazorpay()
            if (!razorpay) return res.status(503).json({ msg: 'Online payment is not configured yet' })

            const {
                orderId,
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: razorpaySignature,
            } = req.body || {}
            if (
                !mongoose.isValidObjectId(orderId) ||
                typeof razorpayOrderId !== 'string' ||
                typeof razorpayPaymentId !== 'string' ||
                typeof razorpaySignature !== 'string' ||
                !/^[a-f\d]{64}$/i.test(razorpaySignature)
            ) {
                return res.status(400).json({ msg: 'Invalid payment verification details' })
            }

            const order = await Orders.findOne({
                _id: orderId,
                user: req.user.id,
                paymentMethod: 'razorpay',
                razorpayOrderId,
            })
            if (!order) return res.status(404).json({ msg: 'Order not found' })
            if (order.status !== 'pending' || order.paymentStatus !== 'pending') {
                return res.status(409).json({ msg: 'This order is no longer awaiting payment' })
            }
            const expected = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest()
            const received = Buffer.from(razorpaySignature, 'hex')
            if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
                return res.status(400).json({ msg: 'Payment signature verification failed' })
            }

            let payment = await razorpay.payments.fetch(razorpayPaymentId)
            if (
                payment.order_id !== razorpayOrderId ||
                payment.amount !== Math.round(order.total * 100) ||
                payment.currency !== PAYMENT_CURRENCY
            ) {
                return res.status(400).json({ msg: 'Payment details do not match this order' })
            }
            if (payment.status === 'authorized') {
                payment = await razorpay.payments.capture(razorpayPaymentId, payment.amount, PAYMENT_CURRENCY)
            }
            if (payment.status !== 'captured') {
                return res.status(402).json({ msg: 'Payment has not been captured. Please retry checkout.' })
            }

            const updated = await markPaid(order, razorpayPaymentId)
            if (!updated) {
                await refundUnexpectedCapture(order, payment)
                return res.status(409).json({ msg: 'The order was no longer active; a refund has been initiated' })
            }
            return res.json({ orderId: String(updated._id) })
        } catch (err) {
            console.error('Razorpay payment verification failed:', err.name)
            return res.status(502).json({ msg: 'Could not verify the payment. Contact support before paying again.' })
        }
    },

    handleRazorpayWebhook: async (req, res) => {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
        if (!webhookSecret) return res.status(503).json({ msg: 'Payment webhook is not configured' })
        if (!Buffer.isBuffer(req.body)) return res.status(400).json({ msg: 'Invalid webhook body' })

        const signature = req.header('x-razorpay-signature') || ''
        if (!/^[a-f\d]{64}$/i.test(signature)) return res.status(400).json({ msg: 'Invalid webhook signature' })
        const expected = crypto.createHmac('sha256', webhookSecret).update(req.body).digest()
        const received = Buffer.from(signature, 'hex')
        if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
            return res.status(400).json({ msg: 'Invalid webhook signature' })
        }

        try {
            const event = JSON.parse(req.body.toString('utf8'))
            if (event.event === 'payment.failed') {
                const payment = event.payload?.payment?.entity
                if (!payment?.order_id) return res.status(400).json({ msg: 'Invalid failed-payment event' })
                const order = await Orders.findOneAndUpdate(
                    { razorpayOrderId: payment.order_id, paymentStatus: 'pending', status: 'pending' },
                    {
                        $set: {
                        paymentStatus: 'failed',
                        status: 'cancelled',
                        orderStatus: 'cancelled',
                        },
                        $push: { statusHistory: { status: 'cancelled' } },
                    },
                    { new: true }
                )
                if (order) await restoreStock(order.items)
                return res.json({ received: true })
            }
            if (event.event !== 'payment.captured') return res.json({ received: true })
            const payment = event.payload?.payment?.entity
            if (!payment?.order_id || payment.status !== 'captured') {
                return res.status(400).json({ msg: 'Invalid captured-payment event' })
            }
            const order = await Orders.findOne({ razorpayOrderId: payment.order_id })
            if (!order) return res.status(404).json({ msg: 'Order not found for payment' })
            if (payment.amount !== Math.round(order.total * 100) || payment.currency !== PAYMENT_CURRENCY) {
                return res.status(400).json({ msg: 'Captured payment does not match order total' })
            }
            const updated = await markPaid(order, payment.id)
            if (!updated) {
                await refundUnexpectedCapture(order, payment)
                return res.json({ received: true })
            }
            return res.json({ received: true })
        } catch (err) {
            console.error('Razorpay webhook processing failed:', err.name)
            return res.status(500).json({ msg: 'Could not process payment webhook' })
        }
    },

    getMyOrders: async (req, res) => {
        try {
            const orders = await Orders.find({ user: req.user.id }).sort('-createdAt')
            return res.json(orders)
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },

    getMyOrder: async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid order ID' })
            const order = await Orders.findOne({ _id: req.params.id, user: req.user.id })
            if (!order) return res.status(404).json({ msg: 'Order not found' })
            return res.json(order)
        } catch (err) {
            return res.status(500).json({ msg: 'Could not load order details' })
        }
    },

    cancelMyOrder: async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid order ID' })
            const order = await Orders.findOneAndUpdate(
                { _id: req.params.id, user: req.user.id, status: 'pending', paymentStatus: { $ne: 'paid' } },
                {
                    $set: {
                    status: 'cancelled',
                    orderStatus: 'cancelled',
                    },
                    $push: { statusHistory: { status: 'cancelled' } },
                },
                { new: true }
            )
            if (!order) return res.status(409).json({ msg: 'Only unpaid pending orders can be cancelled' })
            await restoreStock(order.items)
            return res.json(order)
        } catch (err) {
            return res.status(500).json({ msg: 'Could not cancel this order' })
        }
    },

    getAllOrders: async (req, res) => {
        try {
            const orders = await Orders.find().sort('-createdAt').limit(100)
            return res.json(orders)
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid order ID' })
            const transitions = {
                pending: ['processing', 'cancelled'],
                processing: ['shipped', 'cancelled'],
                shipped: ['delivered'],
                delivered: [],
                cancelled: [],
            }
            const { status } = req.body || {}
            if (!Object.values(transitions).flat().includes(status)) return res.status(400).json({ msg: 'Choose a valid order status' })
            const existing = await Orders.findById(req.params.id)
            if (!existing) return res.status(404).json({ msg: 'Order not found' })
            if (existing.status === status) return res.json(existing)
            if (!transitions[existing.status]?.includes(status)) {
                return res.status(409).json({ msg: `An order cannot move from ${existing.status} to ${status}` })
            }
            if (existing.paymentMethod === 'razorpay' && existing.paymentStatus !== 'paid' && status !== 'cancelled') {
                return res.status(409).json({ msg: 'An online order cannot be fulfilled before payment is confirmed' })
            }
            if (existing.paymentMethod === 'razorpay' && existing.paymentStatus === 'paid' && status === 'cancelled') {
                return res.status(409).json({ msg: 'Paid online orders must be refunded through Razorpay before cancellation' })
            }
            const order = await Orders.findOneAndUpdate(
                {
                    _id: req.params.id,
                    status: existing.status,
                    paymentStatus: existing.paymentStatus,
                },
                { $set: { status, orderStatus: status }, $push: { statusHistory: { status } } },
                { new: true, runValidators: true }
            )
            if (!order) {
                return res.status(409).json({ msg: 'Order status changed before this update could be applied' })
            }
            if (status === 'cancelled' && order.paymentStatus !== 'paid') await restoreStock(order.items)
            return res.json(order)
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
}

module.exports = orderCtrl
