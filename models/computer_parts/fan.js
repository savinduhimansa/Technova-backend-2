import mongoose from "mongoose";

const fanSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  sizeMM: { type: Number, enum: [80, 92, 120, 140], required: true },
  connector: { type: String, enum: ["3-pin", "4-pin PWM"], default: "4-pin PWM" },
  rgb: { type: Boolean, default: false },
  price: { type: Number, required: true, min: 0 },
  images: {
    type: [String],
    required: true,
    default: ["https://d2ati23fc66y9j.cloudfront.net/category-pages/sub_category-174021874143.jpg"]
  },
  stock: { type: Number, required: true, min: 0 }
});

const Fan = mongoose.model("fans", fanSchema);
export default Fan;
