import express from "express";
import {
  generateCourierReport,
  deleteCourierById,
  getAllCouriers
} from "../controllers/courierController.js";

const router = express.Router();

router.get("/", getAllCouriers);
router.get("/report", generateCourierReport);
router.delete("/:id", deleteCourierById);

export default router;
