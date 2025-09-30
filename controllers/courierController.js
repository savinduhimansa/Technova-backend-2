import Delivery from "../models/Delivery.js";
import Courier from "../models/Courier.js";

const canManage = (req) =>
  req.user && (req.user.role === "admin" || req.user.role === "salesManager");

export const getAllCouriers = async (req, res) => {
  try {
    const couriers = await Courier.find().sort({ name: 1 });
    res.json(couriers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching couriers", error: err.message });
  }
};

export const generateCourierReport = async (req, res) => {
  if (!canManage(req)) return res.status(403).json({ message: "Not authorized" });

  try {
    const { month } = req.query;
    let matchStage = {};
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      matchStage.scheduledDate = { $gte: start, $lte: end };
    }

    const report = await Delivery.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          delivered: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          onTime: {
            $cond: [
              { $and: [{ $eq: ["$status", "Delivered"] }, { $lte: ["$deliveredAt", "$scheduledDate"] }] },
              1, 0
            ]
          },
          delayMs: {
            $cond: [
              { $and: [{ $eq: ["$status", "Delivered"] }, { $gt: ["$deliveredAt", "$scheduledDate"] }] },
              { $subtract: ["$deliveredAt", "$scheduledDate"] },
              null
            ]
          }
        }
      },
      {
        $group: {
          _id: "$courierService",
          assignedOrders: { $sum: 1 },
          completedOrders: { $sum: "$delivered" },
          delayedOrders: { $sum: { $cond: [{ $eq: ["$status", "Delayed"] }, 1, 0] } },
          onTimeDeliveries: { $sum: "$onTime" },
          avgDelayMs: { $avg: "$delayMs" },
          avgLeadMs: {
            $avg: {
              $cond: [{ $eq: ["$status", "Delivered"] }, { $subtract: ["$deliveredAt", "$createdAt"] }, null]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          courier: "$_id",
          assignedOrders: 1,
          completedOrders: 1,
          delayedOrders: 1,
          onTimeRatePct: {
            $cond: [
              { $gt: ["$completedOrders", 0] },
              { $round: [{ $multiply: [{ $divide: ["$onTimeDeliveries", "$completedOrders"] }, 100] }, 2] },
              0
            ]
          },
          avgDelayMinutes: {
            $cond: [{ $ne: ["$avgDelayMs", null] }, { $round: [{ $divide: ["$avgDelayMs", 1000*60] }, 2] }, null]
          },
          avgLeadHours: {
            $cond: [{ $ne: ["$avgLeadMs", null] }, { $round: [{ $divide: ["$avgLeadMs", 1000*60*60] }, 2] }, null]
          },
          overallPerformance: {
            $cond: [
              { $gt: ["$assignedOrders", 0] },
              { $concat: [{ $toString: { $round: [{ $multiply: [{ $divide: ["$completedOrders", "$assignedOrders"] }, 100] }, 0] } }, "%"] },
              "0%"
            ]
          }
        }
      }
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Error generating report", error: err.message });
  }
};

export const deleteCourierById = async (req, res) => {
  if (!canManage(req)) return res.status(403).json({ message: "Not authorized" });

  try {
    const courier = await Courier.findByIdAndDelete(req.params.id);
    if (!courier) return res.status(404).json({ message: "Courier not found" });
    res.json({ message: "Courier deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting courier", error: err.message });
  }
};
