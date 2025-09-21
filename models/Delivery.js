import mongoose from "mongoose";

const DeliverySchema = new mongoose.Schema({
  orderId: { type: String, ref: "orders", required: true }, // orderID string
  customerName: { type: String, required: true },
  courierService: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Pending", "Out for Delivery", "Delivered", "Delayed"],
    default: "Pending"
  },
  deliveredAt: { type: Date } // set on Delivered
}, { timestamps: true });

export default mongoose.model("deliveries", DeliverySchema);

