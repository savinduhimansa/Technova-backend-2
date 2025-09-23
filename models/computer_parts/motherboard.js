import mongoose from "mongoose";

const motherboardSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: true
  },
  brand: {
    type: String,
    enum: ["AMD", "Intel"],
    required: true
  },
  model: {
    type: String,
    required: true
  },
  socket: {
    type: String,
    required: true   // AM4, AM5, LGA1700
  },
  formFactor: {
    type: String, 
    enum: ["ATX", "mATX", "Mini-ITX"],
    default: "ATX"
  },
  memoryType: {
    type: String,
    enum: ["DDR4", "DDR5"],
    required: true
  },
  memorySlots: {
    type: Number,
    default: 2
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
  },
  m2Slots: { 
    type: Number, 
    default: 1 
  },        // for NVMe M.2 SSD
  sataPorts: { 
    type: Number, 
    default: 4 
  },      // for SATA SSD/HDD
  cpuTdpHintW: { 
    type: Number, 
    default: 65 }   // optional: used if CPU lacks tdp
});

const Motherboard = mongoose.model("motherboards", motherboardSchema);

export default Motherboard;