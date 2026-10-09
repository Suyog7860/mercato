const Category = require("../models/categoryModel") 
// category = require("../models/categoryModel")

const categoryCtrl = {
    getCategories : async(req,res)=>{
        // res.json('Category test ctrl ')
        try{
            const categories = await Category.find()
            res.json(categories)
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    createCategory: async(req,res)=>{
        try{
            const name = req.body?.name?.trim()
            if (!require('../models/productModel').CATEGORIES.includes(name)) {
                return res.status(400).json({msg:"Only the six supported store categories can be created"})
            }
            if (!name) return res.status(400).json({msg:"Category name is required"})
            const category = await Category.findOne({name})
            if(category) return res.status(400).json({msg:"Category Already Exists"})
            const newCategory = new Category({name})
            await newCategory.save()
            // res.json('Check Admin Success')
            res.json({msg:"Created a Category"})
        }catch(err){
            if (err.code === 11000) return res.status(400).json({msg:"Category Already Exists"})
            return res.status(500).json({msg:err.message})
        }
    },
    deleteCategory: async(req,res)=>{
        try{
            const category = await Category.findByIdAndDelete(req.params.id)
            if (!category) return res.status(404).json({msg:"Category not found"})
            res.json({msg:"Deleted Category"})
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    updateCategory: async(req,res)=>{
        try{
            const name = req.body?.name?.trim()
            if (!require('../models/productModel').CATEGORIES.includes(name)) {
                return res.status(400).json({msg:"Choose one of the six supported store categories"})
            }
            if (!name) return res.status(400).json({msg:"Category name is required"})
            const category = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true, runValidators: true })
            if (!category) return res.status(404).json({msg:"Category not found"})
            res.json({msg:"Updated"})
        }catch(err){
            if (err.code === 11000) return res.status(400).json({msg:"Category Already Exists"})
            return res.status(500).json({msg:err.message})
        }
    }
}

module.exports = categoryCtrl