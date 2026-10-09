const Users = require('../models/userModel.js')

const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')
const Products = require('../models/productModel')


// this is for testing
// const userCtrl = {
//     register: (req,res) =>{
//         res.json({
//             msg:"testing of user test controller"
//         })
//     }
// }

const userCtrl = {
    register: async (req,res) =>{
        try{
            const name = req.body?.name?.trim()
            const email = req.body?.email?.trim().toLowerCase()
            const password = req.body?.password
            if (!name || !email || typeof password !== 'string')
                return res.status(400).json({msg:"Name, email, and password are required"})
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                return res.status(400).json({msg:"Please enter a valid email address"})
            const user = await Users.findOne({email})

            if(user) return res.status(400).json({msg:"This Email Already Registered"})

                if(password.length < 6)
                    return res.status(400).json({msg:"Password is at least 6 character"})

                // password encryption
                const passwordHash = await bcrypt.hash(password,10)

                const newUser = new Users({
                    name,email,password:passwordHash
                })

                // save in mongodb
                await newUser.save()

                // create jwt to authentication
                const accesstoken = createAccessToken({id:newUser._id})
                const refreshtoken = createRefreshToken({id:newUser._id})

                res.cookie('refreshtoken', refreshtoken,{
                    httpOnly:true,
                        path:'/user/refreshtoken',
                        sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                        secure:process.env.NODE_ENV === 'production',
                        maxAge:24 * 60 * 60 * 1000
                    })

                    return res.status(201).json({accesstoken})
        }
        catch(err){
            if (err.code === 11000) return res.status(400).json({msg:"This Email Already Registered"})
            return res.status(500).json({msg:err.message})
        }
    },
    refreshtoken:async(req,res)=>{
        try{
            const rf_token = req.cookies.refreshtoken;
            if(!rf_token) return res.status(401).json({msg:"Please login to continue"})
            let payload
            try {
                payload = jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET)
            } catch {
                return res.status(401).json({msg:"Please login to continue"})
            }
            const user = await Users.findById(payload.id).select('isActive')
            if (!user?.isActive) return res.status(401).json({msg:"This account is inactive or no longer exists"})
            return res.json({accesstoken: createAccessToken({id:user._id})})
        }
        catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    login:async(req,res)=>{
        try{
            const email = req.body?.email?.trim().toLowerCase()
            const password = req.body?.password
            if (!email || typeof password !== 'string')
                return res.status(400).json({msg:"Email and password are required"})
            const user = await Users.findOne({email})
            if(!user)return res.status(400).json({msg:"User Does not exist"})
            const isMatched = await bcrypt.compare(password,user.password)
            if(!isMatched) return res.status(400).json({msg:"Incorrect Password"})
                if (!user.isActive) return res.status(403).json({msg:"This account is currently disabled"})
                const accesstoken = createAccessToken({id:user._id})
                const refreshtoken = createRefreshToken({id:user._id})
                res.cookie('refreshtoken',refreshtoken,{
                    httpOnly:true,
                        path:'/user/refreshtoken',
                        sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                        secure:process.env.NODE_ENV === 'production',
                        maxAge:24 * 60 * 60 * 1000
                    })
                    return res.json({accesstoken})
        }catch(err){
            if (err.code === 11000) return res.status(400).json({msg:"This Email Already Registered"})
            return res.status(500).json({msg:err.message})
        }
    },
    logout:async(req,res)=>{
        try{
            res.clearCookie('refreshtoken',{
                path:'/user/refreshtoken',
                sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure:process.env.NODE_ENV === 'production'
            })
            return res.json({msg:"Logout Successfully"})
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    getUser:async(req,res)=>{
        try{
            const user = await Users.findById(req.user.id).select('-password -cart')
            if(!user) return res.status(404).json({msg:"User not found"})
            res.json(user)
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    updateUser:async(req,res)=>{
        try{
            const user = await Users.findById(req.user.id)
            if(!user) return res.status(404).json({msg:"User not found"})
            const { name, email, phone, addresses, notificationPreferences, currentPassword, newPassword } = req.body || {}
            if (name !== undefined) {
                if (typeof name !== 'string' || !name.trim()) return res.status(400).json({msg:"Name cannot be empty"})
                user.name = name.trim()
            }
            if (email !== undefined) {
                const normalized = typeof email === 'string' ? email.trim().toLowerCase() : ''
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return res.status(400).json({msg:"Please enter a valid email address"})
                user.email = normalized
            }
            if (phone !== undefined) {
                if (typeof phone !== 'string' || phone.trim().length > 32) return res.status(400).json({msg:"Please enter a valid phone number"})
                user.phone = phone.trim()
            }
            if (addresses !== undefined) {
                if (!Array.isArray(addresses) || addresses.length > 10) return res.status(400).json({msg:"Provide up to 10 valid addresses"})
                const validAddress = addresses.every((address) =>
                    address && ['name', 'phone', 'address', 'city', 'state', 'postalCode', 'country'].every((field) =>
                        typeof address[field] === 'string' && address[field].trim()
                    )
                )
                if (!validAddress) return res.status(400).json({msg:"Each address must include recipient and delivery details"})
                const defaultCount = addresses.filter((address) => address.isDefault).length
                if (defaultCount > 1) return res.status(400).json({msg:"Choose only one default address"})
                user.addresses = addresses
            }
            if (notificationPreferences !== undefined) {
                if (!notificationPreferences || typeof notificationPreferences !== 'object' ||
                    (notificationPreferences.orderUpdates !== undefined && typeof notificationPreferences.orderUpdates !== 'boolean') ||
                    (notificationPreferences.promotions !== undefined && typeof notificationPreferences.promotions !== 'boolean')) {
                    return res.status(400).json({msg:"Invalid notification preferences"})
                }
                user.notificationPreferences = {
                    orderUpdates: notificationPreferences.orderUpdates ?? user.notificationPreferences.orderUpdates,
                    promotions: notificationPreferences.promotions ?? user.notificationPreferences.promotions,
                }
            }
            if (newPassword !== undefined) {
                if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
                    return res.status(400).json({msg:"Enter your current password and a new password of at least 8 characters"})
                }
                if (!await bcrypt.compare(currentPassword, user.password)) {
                    return res.status(400).json({msg:"Current password is incorrect"})
                }
                user.password = await bcrypt.hash(newPassword, 10)
            }
            await user.save()
            return res.json({ user: await Users.findById(user._id).select('-password -cart') })
        } catch(err) {
            if (err.code === 11000) return res.status(409).json({msg:"That email address is already registered"})
            return res.status(500).json({msg:err.message})
        }
    },
    getWishlist:async(req,res)=>{
        try{
            const user = await Users.findById(req.user.id).select('wishlist')
            if(!user) return res.status(404).json({msg:"User not found"})
            const products = await Products.find({ _id: { $in: user.wishlist } })
            return res.json(products)
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    addWishlist:async(req,res)=>{
        try{
            if (!require('mongoose').isValidObjectId(req.params.productId)) return res.status(400).json({msg:"Invalid product ID"})
            const product = await Products.exists({ _id: req.params.productId })
            if (!product) return res.status(404).json({msg:"Product not found"})
            const user = await Users.findByIdAndUpdate(
                req.user.id,
                { $addToSet: { wishlist: req.params.productId } },
                { new: true }
            ).select('wishlist')
            if (!user) return res.status(404).json({msg:"User not found"})
            return res.json({wishlist: user.wishlist})
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    removeWishlist:async(req,res)=>{
        try{
            if (!require('mongoose').isValidObjectId(req.params.productId)) return res.status(400).json({msg:"Invalid product ID"})
            const user = await Users.findByIdAndUpdate(
                req.user.id,
                { $pull: { wishlist: req.params.productId } },
                { new: true }
            ).select('wishlist')
            if (!user) return res.status(404).json({msg:"User not found"})
            return res.json({wishlist: user.wishlist})
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    }
}
 
const createAccessToken = (payload) => {
    return jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
}

const createRefreshToken = (payload) => {
    return jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{expiresIn:'1d'})
}

module.exports = userCtrl