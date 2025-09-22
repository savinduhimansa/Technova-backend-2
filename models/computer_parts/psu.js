import mongoose from "mongoose";

const psuSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  wattage: { type: Number, required: true }, // e.g. 650
  efficiency: {
    type: String,
    enum: ["80+", "Bronze", "Silver", "Gold", "Platinum", "Titanium"],
    default: "Gold"
  },
  modular: { type: String, enum: ["Non", "Semi", "Full"], default: "Non" },
  formFactor: { type: String, enum: ["ATX", "SFX"], default: "ATX" },
  price: { type: Number, required: true, min: 0 },
  images: {
    type: [String],
    required: true,
    default: ["https://d2ati23fc66y9j.cloudfront.net/category-pages/sub_category-174021874143.jpg"]
  },
  stock: { type: Number, required: true, min: 0 }
});

const PSU = mongoose.model("psus", psuSchema);
export default PSU;
