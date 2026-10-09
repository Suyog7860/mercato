const mongoose = require('mongoose')
const CATEGORIES = require('./productModel').CATEGORIES

const categorySchema = new mongoose.Schema ({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        enum:CATEGORIES
    }
},{
    timestamps:true
})

module.exports = mongoose.model("Category",categorySchema)