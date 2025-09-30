// controllers/itDashboardController.js
import Service from "../models/ServiceModel.js";
import Repair from "../models/RepairModel.js";
import Ticket from "../models/TicketModel.js";

/**
 * GET /api/itdashboard/counts
 * Returns high-level KPI counts for IT dashboard.
 */
export const getITDashboardCounts = async (req, res) => {
  try {
    // Top-level counts
    const services = await Service.countDocuments();
    const totalTickets = await Ticket.countDocuments();         // <-- Ticket model
    const totalRepairs = await Repair.countDocuments();

    // Repair counts by status (enum: Pending, Checking, In Progress, Done, Cancelled)
    const [pendingRequests, checking, inProgress, done, cancelled] = await Promise.all([
      Repair.countDocuments({ status: "Pending" }),
      Repair.countDocuments({ status: "Checking" }),
      Repair.countDocuments({ status: "In Progress" }),
      Repair.countDocuments({ status: "Done" }),
      Repair.countDocuments({ status: "Cancelled" }),
    ]);

    return res.status(200).json({
      services,
      totalTickets,
      totalRepairs,
      pendingRequests,
      checking,
      inProgress,
      done,
      cancelled,
    });
  } catch (err) {
    console.error("IT Dashboard counts error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
