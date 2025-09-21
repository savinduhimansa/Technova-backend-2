import mongoose from "mongoose";

const gpuSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  brand: String,
  model: String,
  lengthMM: Number,       // for case clearance
  price: Number,
  stock: Number
});

const Gpu = mongoose.model("gpus", gpuSchema);

export default Gpu;
