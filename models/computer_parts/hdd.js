import mongoose from "mongoose";

const hddSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  formFactor: { type: String, enum: ['3.5"', '2.5"'], default: '3.5"' },
  interface: { type: String, enum: ["SATA"], default: "SATA" },
  capacityGB: { type: Number, required: true },
  rpm: { type: Number, default: 7200 },
  price: { type: Number, required: true, min: 0 },
  images: {
    type: [String],
    required: true,
    default: ["https://d2ati23fc66y9j.cloudfront.net/category-pages/sub_category-174021874143.jpg"]
  },
  stock: { type: Number, required: true, min: 0 }
});

const HDD = mongoose.model("hdds", hddSchema);
export default HDD;
