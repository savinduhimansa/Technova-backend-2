import mongoose from "mongoose";

const cpuSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: true
  },
  brand: {
    type: String,
    enum: ["AMD", "Intel"],  // Ryzen => AMD
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
  price: Number,
  stock: Number
});

const Cpu = mongoose.model("cpus",cpuSchema);

export default Cpu;