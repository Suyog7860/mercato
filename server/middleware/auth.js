const jwt = require('jsonwebtoken')
const Users = require('../models/userModel')

const auth = async (req, res, next) => {
    const authHeader = req.header('Authorization')
    if (!authHeader) return res.status(401).json({ msg: 'Authentication required' })

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim()
    if (!token || token.split('.').length !== 3) {
        return res.status(401).json({ msg: 'Invalid authentication token' })
    }

    try {
        req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await Users.findById(req.user.id).select('role isActive')
        if (!user?.isActive) return res.status(401).json({ msg: 'This account is inactive or no longer exists' })
        req.user.role = user.role
        return next()
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Authentication token expired' })
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid authentication token' })
        }
        return next(err)
    }
}

module.exports = auth
