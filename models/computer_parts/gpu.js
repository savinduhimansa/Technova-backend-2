import mongoose from "mongoose";

const gpuSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  lengthMM: {
    type: String
  },       // for case clearance
  price: {
    type: Number,
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
  tdpWatts: { 
    type: Number, 
    default: 160 
  }
});

const Gpu = mongoose.model("gpus", gpuSchema);

export default Gpu;
