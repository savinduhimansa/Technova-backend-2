import mongoose from "mongoose";

const caseSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  brand: String,
  model: String,
  supportedFormFactors: [{ 
    type: String, 
    enum: ["ATX", "mATX", "Mini-ITX"] 
  }],
  gpuMaxLengthMM: Number,
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
  bays25: { 
    type: Number, 
    default: 2 
  },         // 2.5" bays (SATA SSD)
  bays35: { 
    type: Number, 
    default: 2 
  },         // 3.5" bays (HDD)
  supportedFanSizesMM: { 
    type: [Number], 
    default: [120, 140] 
  },
  psuFormFactor: { 
    type: String, 
    default: "ATX" 
  }
});

const Case = mongoose.model("cases", caseSchema);

export default Case;
