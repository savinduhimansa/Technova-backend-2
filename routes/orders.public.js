import { Router } from "express";
import { createPublicOrder } from "../controllers/orderPublicController.js";

const router = Router();
router.post("/", createPublicOrder);
export default router;
