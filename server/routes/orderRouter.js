const router = require('express').Router()
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')
const orderCtrl = require('../controllers/orderCtrl')
const adminCtrl = require('../controllers/adminCtrl')

router.get('/payments/config', orderCtrl.paymentConfig)
router.post('/payments/razorpay/order', auth, orderCtrl.createRazorpayOrder)
router.post('/payments/razorpay/verify', auth, orderCtrl.verifyRazorpayPayment)

router.route('/orders')
    .get(auth, orderCtrl.getMyOrders)
    .post(auth, orderCtrl.createOrder)
router.get('/orders/:id', auth, orderCtrl.getMyOrder)
router.patch('/orders/:id/cancel', auth, orderCtrl.cancelMyOrder)

router.get('/admin/orders', auth, authAdmin, orderCtrl.getAllOrders)
router.patch('/admin/orders/:id', auth, authAdmin, orderCtrl.updateOrderStatus)
router.get('/admin/dashboard', auth, authAdmin, adminCtrl.getDashboard)
router.get('/admin/users', auth, authAdmin, adminCtrl.getUsers)
router.patch('/admin/users/:id', auth, authAdmin, adminCtrl.updateUser)

module.exports = router
