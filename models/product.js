import mongoose from "mongoose";

const productScheme = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },
   brand:{
        type: String,
        required: true,
        trim: true,
    },
  altNames: {
    type: [String],
    default: []
  },
  category: {
      type: String,
      required: true,
      enum: {
        values: [
          'Laptops',
          'Desktops',
          'Monitors',
          'Keyboards',
          'Mice',
          'Headsets',
          'Graphics Cards',
          'CPUs',
          'Storage',
        ]
      }
    },
  price: {
    type: Number,
    required: true
  },
  labeledPrice: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    required: true,
    default: ["https://d2ati23fc66y9j.cloudfront.net/category-pages/sub_category-174021874143.jpg"]
  },
  stock: {
    type: Number,
    required: true
  },
  ratingsQuantity: {
      type: Number,
      default: 0,
    } 
})

const Product = mongoose.model("products",productScheme);

export default Product;