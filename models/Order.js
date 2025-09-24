import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderID: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true }, // Added address

  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
      productId: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true }
    }
  ],

  discount: { type: Number, default: 0 },
  totalPrice: { type: Number },

  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Processing", "Completed", "Cancelled"],
    default: "Pending"
  },
  paymentMethod: {
    type: String,
    enum: ["Card", "Cash", "Invoice"],
    default: "Cash"
  },
  paymentStatus: {
    type: String,
    enum: ["Pending","Paid", "Refunded","Failed"],
    default: "Paid"
  },

  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Calculate total price before save
OrderSchema.pre("save", function (next) {
  const subtotal = this.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  const discountAmount = (subtotal * this.discount) / 100;
  this.totalPrice = Math.max(subtotal - discountAmount, 0);
  next();
});

export default mongoose.model("orders", OrderSchema);

