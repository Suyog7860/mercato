const mongoose = require('mongoose')
const addressSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        address: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        postalCode: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: 'India' },
        isDefault: { type: Boolean, default: false },
    },
    { _id: true }
)

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:Number,
        enum:[0,1],
        default:0
    },
    cart:{
        type:Array,
        default:[]
    },
    phone: { type: String, trim: true, default: '' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Products' }],
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    notificationPreferences: {
        orderUpdates: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
    },
},{
    timestamps:true
})


module.exports = mongoose.model('Users',userSchema)