import { Router } from "express";
import {
  createOrder,
  listOrders,
  updateOrder,
  deleteOrder,
  listConfirmedOrders
} from "../controllers/orderController.js";

const router = Router();

router.post("/", createOrder);
router.get("/", listOrders);
router.get("/confirmed", listConfirmedOrders);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;

