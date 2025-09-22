import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";

export const assignDelivery = async (req, res, next) => {
  if (!req.user || !["admin", "salesmanager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Not authorized" });
  }
  try {
    const { orderId, courierService, scheduledDate } = req.body;
    const order = await Order.findOne({ orderID: orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "Confirmed")
      return res.status(400).json({ message: "Only confirmed orders can be assigned" });

    const delivery = await Delivery.create({
      orderId: order.orderID,
      customerName: order.customerName,
      courierService,
      scheduledDate
    });

    console.log(`[MAIL] Delivery scheduled for ${order.customerName} on ${new Date(scheduledDate).toLocaleString()} via ${courierService}`);
    res.status(201).json(delivery);
  } catch (err) { next(err); }
};

export const listDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (err) { next(err); }
};

export const updateDeliveryStatus = async (req, res, next) => {
  if (!req.user || !["admin", "salesmanager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Not authorized" });
  }
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    delivery.status = status;
    if (status === "Delivered") {
      delivery.deliveredAt = new Date();
      // mark order as Completed
      await Order.findOneAndUpdate({ orderID: delivery.orderId }, { status: "Completed" });
    }
    await delivery.save();
    res.json(delivery);
  } catch (err) { next(err); }
};

export const deleteDelivery = async (req, res, next) => {
  if (!req.user || !["admin", "salesmanager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Not authorized" });
  }
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });
    res.json({ message: "Delivery deleted successfully" });
  } catch (err) { next(err); }
};

export const getConfirmedOrders = async (req, res, next) => {
  try {
    const confirmed = await Order.find({ status: "Confirmed" })
      .select("orderID customerName totalPrice address");
    res.json(confirmed);
  } catch (err) { next(err); }
};
