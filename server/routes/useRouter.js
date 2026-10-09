const userCtrl = require('../controllers/userCtrl')
const auth = require('../middleware/auth')
const router = require('express').Router()
const { rateLimit } = require('express-rate-limit')

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { msg: 'Too many sign-in attempts. Please try again later.' },
})

// this is or testing
// router.post('/register',(req,res)=>{
//     res.json({msg:"Routing Testing"})
// })

router.post('/register',authLimiter,userCtrl.register)
router.post('/login',authLimiter,userCtrl.login)
router.get('/logout',userCtrl.logout)
router.post('/refreshtoken',userCtrl.refreshtoken)
router.get('/infor',auth,userCtrl.getUser)
router.put('/infor',auth,userCtrl.updateUser)
router.get('/wishlist',auth,userCtrl.getWishlist)
router.post('/wishlist/:productId',auth,userCtrl.addWishlist)
router.delete('/wishlist/:productId',auth,userCtrl.removeWishlist)

module.exports = router