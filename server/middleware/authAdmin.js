const authAdmin = (req, res, next) => {
    if (req.user.role !== 1) return res.status(403).json({ msg: 'Admin resources access denied' })
    return next()
}

module.exports = authAdmin