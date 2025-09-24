import mongoose from "mongoose";

const CourierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  assignedOrders: { type: Number, required: true, default: 0 },
  completedOrders: { type: Number, required: true, default: 0 },
  delayedOrders: { type: Number, required: true, default: 0 },
  overallPerformance: { type: String }, 
  month: { type: String } 
}, { timestamps: true });

export default mongoose.model("couriers", CourierSchema);
