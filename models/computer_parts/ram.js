import mongoose from "mongoose";

const ramSchema = new mongoose.Schema({
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
  memoryType: {
    type: String,
    enum: ["DDR4", "DDR5"],
    required: true
  },
  kitCapacity: {
    type: Number,
    required: true
  },  //GB in the kit
  modules: {
    type: Number,
    required: true
  },   //Number of sticks
  speedMHz: {
    type: Number,
    required: true
  },
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
  }
});

const Ram = mongoose.model("rams", ramSchema);

export default Ram;