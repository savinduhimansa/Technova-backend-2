import { Router } from "express";
import {
  assignDelivery,
  listDeliveries,
  updateDeliveryStatus,
  deleteDelivery,
  getConfirmedOrders
} from "../controllers/deliveryController.js";

const router = Router();

router.post("/", assignDelivery);
router.get("/", listDeliveries);
router.put("/:id/status", updateDeliveryStatus);
router.delete("/:id", deleteDelivery);

// List all confirmed orders for assigning delivery
router.get("/confirmed-orders", getConfirmedOrders);

export default router;

