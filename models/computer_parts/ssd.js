import mongoose from "mongoose";

const ssdSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  interface: { type: String, enum: ["NVMe", "SATA"], required: true },
  formFactor: { type: String, enum: ["M.2 2280", '2.5"'], required: true },
  capacityGB: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 },
  images: {
    type: [String],
    required: true,
    default: ["https://d2ati23fc66y9j.cloudfront.net/category-pages/sub_category-174021874143.jpg"]
  },
  stock: { type: Number, required: true, min: 0 }
});

const SSD = mongoose.model("ssds", ssdSchema);
export default SSD;
