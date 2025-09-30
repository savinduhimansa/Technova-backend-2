



import mongoose from "mongoose";

const RepairSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true }, 
    clientName: { type: String, required: true, trim: true },
    ticketId: { type: String, trim: true }, 

    services: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
        fee: { type: Number, required: true, min: 0 }, 
      }
    ],

    materials: [
      {
        name: { type: String, required: true, trim: true },
        cost: { type: Number, required: true, min: 0 },
      }
    ],

    serviceCharge: { type: Number, default: 500, min: 0 }, 

    remarks: { type: String, default: "" },
    paymentStatus: { type: String, enum: ["Unpaid", "Paid", "Partial"], default: "Unpaid" },
    status: { type: String, enum: ["Pending", "Checking", "In Progress", "Done", "Cancelled"], default: "Pending" },

    totalAmount: { type: Number, required: true, min: 0 },
    dateCreated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Repair = mongoose.model("Repair", RepairSchema);
export default Repair;
