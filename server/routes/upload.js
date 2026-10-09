const router = require('express').Router()
const cloudinary = require('cloudinary').v2
const fs = require('fs')
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const removeTmp = (path) => {
    fs.unlink(path, err => { if (err) console.log(err) })
}

router.post('/upload', auth, authAdmin, async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0)
            return res.status(400).json({ msg: "No files were uploaded" })

        const file = req.files.file
        if (!file) return res.status(400).json({ msg: "Use the key name 'file'" })

        if (file.size > 5 * 1024 * 1024) {
            removeTmp(file.tempFilePath)
            return res.status(400).json({ msg: "Size too large" })
        }
        if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
            removeTmp(file.tempFilePath)
            return res.status(400).json({ msg: "File format is incorrect" })
        }

        const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: "test" })
        removeTmp(file.tempFilePath)
        res.json({ public_id: result.public_id, url: result.secure_url })
    } catch (err) {
        return res.status(500).json({ msg: err.message })
    }
})

module.exports = router