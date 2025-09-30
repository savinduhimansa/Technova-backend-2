// routes/itDashboardRoutes.js
import express from "express";
import { getITDashboardCounts } from "../controllers/itDashboardController.js";

const router = express.Router();

// GET /api/itdashboard/counts
router.get("/counts", getITDashboardCounts);

export default router;
