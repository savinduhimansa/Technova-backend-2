// controllers/orderPublicController.js
import Order from "../models/Order.js";
import Product from "../models/product.js";

/** Create order (customer must be logged in) — starts as Pending */
export const createPublicOrder = async (req, res, next) => {
  try {
    // req.user is set by JWT middleware
    if (!req.user) return res.status(401).json({ message: "Login required" });

    const { customerName, phoneNumber, address, products, discount = 0 } = req.body;

    if (!customerName || !phoneNumber || !address)
      return res.status(400).json({ message: "Missing customer fields" });

    if (!Array.isArray(products) || !products.length)
      return res.status(400).json({ message: "No products provided" });

    const orderProducts = [];

    // stock check + reserve (decrement)
    for (const item of products) {
      if (!item.productId || !item.quantity)
        return res.status(400).json({ message: "Each product needs productId & quantity" });

      const prod = await Product.findOne({ productId: item.productId });
      if (!prod) return res.status(404).json({ message: `Product ${item.productId} not found` });
      if (prod.stock < item.quantity)
        return res.status(400).json({ message: `Not enough stock for ${prod.name}` });

      prod.stock -= item.quantity;
      await prod.save();

      orderProducts.push({
        product: prod._id,
        productId: prod.productId,
        quantity: item.quantity,
        unitPrice: prod.price
      });
    }

    // sequential orderID
    const last = await Order.findOne().sort({ createdAt: -1 });
    let newOrderID = "OD-001";
    if (last?.orderID) {
      const n = parseInt(String(last.orderID).split("-")[1]) || 0;
      newOrderID = `OD-${String(n + 1).padStart(3, "0")}`;
    }

    const order = await Order.create({
      orderID: newOrderID,
      user: req.user.id,                // ⬅️ link to logged-in user
      customerName, phoneNumber, address,
      products: orderProducts,
      discount,
      paymentMethod: "Card",
      paymentStatus: "Pending",
      status: "Pending"                 // ⬅️ was Confirmed; now Pending
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
};

/** List my orders (must be logged in) */
export const getMyPublicOrders = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Login required" });

    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("products.product", "name price images");

    res.json(orders);
  } catch (e) { next(e); }
};

/** Cancel my order (only if Pending & payment Pending) + restock */
export const cancelMyPublicOrder = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Login required" });
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Pending" || order.paymentStatus !== "Pending") {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    // restock
    for (const line of order.products) {
      await Product.updateOne(
        { _id: line.product },
        { $inc: { stock: line.quantity } }
      );
    }

    order.status = "Cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled", order });
  } catch (e) { next(e); }
};
