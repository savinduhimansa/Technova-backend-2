import express from "express";
import { chatbotQuery } from "../controllers/chatbotController.js";
const router = express.Router();
router.post("/query", chatbotQuery);
export default router;