// models/build.js
import mongoose from "mongoose";

const partSnapshotSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    brand: String,
    model: String,
    price: Number,
    images: [String],
    socket: String,
    formFactor: String,
    memoryType: String,
    modules: Number,
    kitCapacity: Number,
    speedMHz: Number,
    lengthMM: String,
    gpuMaxLengthMM: Number,
    supportedFormFactors: [String],
    interface: String,
    capacityGB: Number,
    rpm: Number,
    wattage: Number,
    efficiency: String,
    sizeMM: Number,
    connector: String,
    rgb: Boolean
  },
  { _id: false }
);

const buildSchema = new mongoose.Schema(
  {
    buildId: { type: String, unique: true, required: true },
    userId: { type: String, index: true }, // comes from token
    name: { type: String },
    items: {
      cpu: partSnapshotSchema,
      motherboard: partSnapshotSchema,
      ram: partSnapshotSchema,
      gpu: partSnapshotSchema,
      case: partSnapshotSchema,
      ssd: partSnapshotSchema,
      hdd: partSnapshotSchema,
      psu: partSnapshotSchema,
      fans: [partSnapshotSchema]
    },
    prices: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, default: 0 },
      total: { type: Number, required: true }
    },
    compatibility: {
      ok: { type: Boolean, default: false },
      errors: { type: [String], default: [] }
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "purchased"],
      default: "draft",
      index: true
    },
    notes: { type: String, default: "" } // admin comments
  },
  { timestamps: true }
);

const Build = mongoose.model("builds", buildSchema);
export default Build;
