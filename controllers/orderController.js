import Order from "../models/Order.js";
import Product from "../models/product.js";

// shared auth helper
const canManage = (req) =>
  req.user && (req.user.role === "admin" || req.user.role === "salesManager");

// Create a new order
export const createOrder = async (req, res, next) => {
  if (!canManage(req)) return res.status(403).json({ message: "Not authorized" });

  try {
    const { customerName, phoneNumber, address, products: productItems, discount = 0, paymentMethod, status } = req.body;

    if (!productItems || productItems.length === 0)
      return res.status(400).json({ message: "No products provided" });

    const orderProducts = [];

    for (const item of productItems) {
      const productDoc = await Product.findOne({ productId: item.productId });
      if (!productDoc) return res.status(404).json({ message: `Product ${item.productId} not found` });
      if (productDoc.stock < item.quantity) return res.status(400).json({ message: `Not enough stock for ${productDoc.name}` });

      productDoc.stock -= item.quantity;
      await productDoc.save();

      orderProducts.push({
        product: productDoc._id,
        productId: productDoc.productId,
        quantity: item.quantity,
        unitPrice: productDoc.price
      });
    }

    // Generate new orderID
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    let newOrderID = "OD-001";
    if (lastOrder) {
      const lastNum = parseInt(lastOrder.orderID.split("-")[1]) || 0;
      newOrderID = `OD-${String(lastNum + 1).padStart(3, "0")}`;
    }

    const order = await Order.create({
      orderID: newOrderID,
      customerName,
      phoneNumber,
      address,
      products: orderProducts,
      discount,
      paymentMethod,
      status: status || "Pending"
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// List orders with optional filters
export const listOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { customerName: new RegExp(search, "i") },
        { orderID: new RegExp(search, "i") }
      ];
    }

    const orders = await Order.find(query)
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// List confirmed orders
export const listConfirmedOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: "Confirmed" })
      .select("orderID customerName");
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// Update an order
export const updateOrder = async (req, res, next) => {
  if (!canManage(req)) return res.status(403).json({ message: "Not authorized" });

  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Handle products update
    if (updates.products) {
      // Restore stock from old products
      for (const oldItem of order.products) {
        const oldProduct = await Product.findById(oldItem.product);
        if (oldProduct) {
          oldProduct.stock += oldItem.quantity;
          await oldProduct.save();
        }
      }

      const updatedProducts = [];
      for (const item of updates.products) {
        const productDoc = await Product.findOne({ productId: item.productId });
        if (!productDoc) return res.status(404).json({ message: `Product ${item.productId} not found` });
        if (productDoc.stock < item.quantity) return res.status(400).json({ message: `Not enough stock for ${productDoc.name}` });

        productDoc.stock -= item.quantity;
        await productDoc.save();

        updatedProducts.push({
          product: productDoc._id,
          productId: productDoc.productId,
          quantity: item.quantity,
          unitPrice: productDoc.price
        });
      }
      order.products = updatedProducts;
    }

    // Update other fields
    if (updates.customerName) order.customerName = updates.customerName;
    if (updates.phoneNumber) order.phoneNumber = updates.phoneNumber;
    if (updates.address) order.address = updates.address;
    if (updates.status) order.status = updates.status;
    if (updates.discount !== undefined) order.discount = updates.discount;
    if (updates.paymentMethod) order.paymentMethod = updates.paymentMethod;
    if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus;

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// Delete an order
export const deleteOrder = async (req, res, next) => {
  if (!canManage(req)) return res.status(403).json({ message: "Not authorized" });

  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Restore stock
    for (const item of order.products) {
      const productDoc = await Product.findById(item.product);
      if (productDoc) {
        productDoc.stock += item.quantity;
        await productDoc.save();
      }
    }

    await order.deleteOne();
    res.json({ message: "Order deleted", order });
  } catch (err) {
    next(err);
  }
};
