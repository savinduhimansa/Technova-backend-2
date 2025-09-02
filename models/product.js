import mongoose from "mongoose";

const productScheme = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  altNames: {
    type: [String],
    default: []
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
})

const Product = mongoose.model("products",productScheme);

export default Product;