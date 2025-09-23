import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  invoiceID: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true },
  customerName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      totalPrice: { type: Number, required: true }
    }
  ],
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ["Confirmed", "Completed"], required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("invoices", InvoiceSchema);
