const router = require('express').Router()
const productCtrl = require('../controllers/productCtrl')
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')

router.route('/products')
    .get(productCtrl.getProducts)
    .post(auth, authAdmin, productCtrl.createProducts)

router.route('/products/:id')
    .get(productCtrl.getProduct)
    .delete(auth, authAdmin, productCtrl.deleteProducts)
    .put(auth, authAdmin, productCtrl.updateProducts)

router.post('/products/:id/reviews', auth, productCtrl.addReview)

module.exports = router