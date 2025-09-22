import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";

const canManage = (req) =>
  req.user && (req.user.role === "admin" || req.user.role === "salesManager");

export const getDashboardStats = async (req, res) => {
  if (!canManage(req)) return res.status(403).json({ message: "Not authorized" });

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalOrdersMonth = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
    const processingOrders = await Order.countDocuments({ status: "Processing" });
    const completedOrders = await Order.countDocuments({ status: "Completed" });

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ["Completed", "Confirmed"] } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } }
    ]);
    const revenue = revenueAgg[0]?.revenue || 0;

    const courierStats = await Delivery.aggregate([{ $group: { _id: "$courierService", total: { $sum: 1 } } }]);

    const productStats = await Order.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products.product", totalSales: { $sum: "$products.quantity" } } },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { _id: 0, productName: "$product.name", totalSales: 1 } }
    ]);

    res.json({ totalOrdersMonth, processingOrders, completedOrders, revenue, courierStats, productStats });
  } catch (err) {
    res.status(500).json({ message: "Error fetching dashboard stats", error: err.message });
  }
};
