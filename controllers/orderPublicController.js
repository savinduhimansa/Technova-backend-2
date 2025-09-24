import Order from "../models/Order.js";
import Product from "../models/product.js";

// Public checkout: multi-item, address, Card, paymentStatus Pending, status Confirmed
export const createPublicOrder = async (req, res, next) => {
  try {
    const { customerName, phoneNumber, address, products, discount = 0 } = req.body;

    if (!customerName || !phoneNumber || !address)
      return res.status(400).json({ message: "Missing customer fields" });

    if (!Array.isArray(products) || !products.length)
      return res.status(400).json({ message: "No products provided" });

    const orderProducts = [];

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

    const last = await Order.findOne().sort({ createdAt: -1 });
    let newOrderID = "OD-001";
    if (last) {
      const n = parseInt(last.orderID.split("-")[1]) || 0;
      newOrderID = `OD-${String(n + 1).padStart(3, "0")}`;
    }

    const order = await Order.create({
      orderID: newOrderID,
      customerName, phoneNumber, address,
      products: orderProducts,
      discount,
      paymentMethod: "Card",
      paymentStatus: "Pending",
      status: "Confirmed"
    });

    console.log(`[MAIL] Order ${order.orderID} confirmed for ${order.customerName}`);
    res.status(201).json(order);
  } catch (e) { next(e); }
};
