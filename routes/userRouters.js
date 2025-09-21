import express from "express";
import { registerUser, loginUser, listUsers } from "../controllers/userControllers.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", listUsers); // admin only

export default router;
