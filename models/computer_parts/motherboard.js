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
  price: Number,
  stock: Number
});

const Motherboard = mongoose.model("motherboards", motherboardSchema);

export default Motherboard;