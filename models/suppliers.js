// models/suppliers.js
import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNo: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    payments: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

const Supplier = mongoose.model("suppliers", supplierSchema);

export default Supplier;
