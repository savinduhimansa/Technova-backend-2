
import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    serviceNumber: { type: String, required: true, unique: true }, // e.g., SR001
    dateCreated: {
      type: String,
      default: () => new Date().toISOString().split("T")[0], // YYYY-MM-DD
    },
    service: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", ServiceSchema);
export default Service;


