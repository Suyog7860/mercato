const mongoose = require('mongoose')
const Orders = require('../models/orderModel')
const Products = require('../models/productModel')
const Users = require('../models/userModel')

const adminCtrl = {
    getDashboard: async (_req, res) => {
        try {
            const [totalUsers, totalProducts, totalOrders, pendingOrders, deliveredOrders, revenue] = await Promise.all([
                Users.countDocuments(),
                Products.countDocuments(),
                Orders.countDocuments(),
                Orders.countDocuments({ status: 'pending' }),
                Orders.countDocuments({ status: 'delivered' }),
                Orders.aggregate([
                    { $match: { $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cash_on_delivery', status: 'delivered' }] } },
                    { $group: { _id: null, amount: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } },
                ]),
            ])
            return res.json({
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: revenue[0]?.amount || 0,
                pendingOrders,
                deliveredOrders,
            })
        } catch (err) {
            return res.status(500).json({ msg: 'Could not load store dashboard' })
        }
    },

    getUsers: async (req, res) => {
        try {
            const page = Number(req.query.page || 1)
            const limit = Math.min(Number(req.query.limit || 50), 100)
            if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
                return res.status(400).json({ msg: 'Page and limit must be positive whole numbers' })
            }
            const filter = {}
            if (typeof req.query.search === 'string' && req.query.search.trim()) {
                const safe = req.query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                filter.$or = ['name', 'email'].map((field) => ({ [field]: { $regex: safe, $options: 'i' } }))
            }
            const [users, totalUsers] = await Promise.all([
                Users.find(filter).select('name email role isActive createdAt phone').sort('-createdAt').skip((page - 1) * limit).limit(limit),
                Users.countDocuments(filter),
            ])
            return res.json({ users, page, totalPages: Math.ceil(totalUsers / limit), totalUsers })
        } catch (err) {
            return res.status(500).json({ msg: 'Could not load customer accounts' })
        }
    },

    updateUser: async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: 'Invalid user ID' })
            const { role, isActive } = req.body || {}
            if (role === undefined && isActive === undefined) return res.status(400).json({ msg: 'Provide a role or account status to update' })
            if (role !== undefined && ![0, 1].includes(role)) return res.status(400).json({ msg: 'Role must be customer (0) or admin (1)' })
            if (isActive !== undefined && typeof isActive !== 'boolean') return res.status(400).json({ msg: 'Account status must be active or inactive' })
            if (String(req.user.id) === req.params.id && (role === 0 || isActive === false)) {
                return res.status(409).json({ msg: 'You cannot remove your own admin access or deactivate your account' })
            }

            const target = await Users.findById(req.params.id).select('role isActive')
            if (!target) return res.status(404).json({ msg: 'Customer not found' })
            if (target.role === 1 && (role === 0 || isActive === false)) {
                const otherAdmins = await Users.countDocuments({
                    _id: { $ne: target._id },
                    role: 1,
                    isActive: true,
                })
                if (!otherAdmins) return res.status(409).json({ msg: 'At least one active administrator must remain' })
            }
            const update = {}
            if (role !== undefined) update.role = role
            if (isActive !== undefined) update.isActive = isActive
            const user = await Users.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
                .select('name email role isActive createdAt phone')
            return res.json(user)
        } catch (err) {
            return res.status(500).json({ msg: 'Could not update customer account' })
        }
    },
}

module.exports = adminCtrl
