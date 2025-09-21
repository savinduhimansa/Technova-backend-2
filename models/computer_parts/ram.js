import mongoose from "mongoose";

const ramSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: true
  },
  brand: String,
  model: String,
  memoryType: {
    type: String,
    enum: ["DDR4", "DDR5"],
    required: true
  },
  kitCapacity: Number,  //GB in the kit
  modules: Number,   //Number of sticks
  speedMHz: Number,
  price: Number,
  stock: Number
});

const Ram = mongoose.model("rams", ramSchema);

export default Ram;