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
  price: Number,
  stock: Number
});

const Case = mongoose.model("cases", caseSchema);

export default Case;
