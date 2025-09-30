// routes/orderPublicRoutes.js
import { Router } from "express";
import {
  createPublicOrder,
  getMyPublicOrders,
  cancelMyPublicOrder,
} from "../controllers/orderPublicController.js";
import jwt from "jsonwebtoken";

const router = Router();

// JWT guard that matches your userController tokens
function requireUserAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Auth required" });

  try {
    // IMPORTANT: userController signs with JWT_KEY, not JWT_SECRET
    const payload = jwt.verify(token, process.env.JWT_KEY);

    // userController uses 'userId' claim (not 'id')
    const id = payload.userId || null;
    const role = payload.role || null;
    const email = payload.email || null;

    if (!id) return res.status(401).json({ message: "Token missing user id" });

    // Public checkout is for customers; allow admin if you want to.
    if (!["user", "admin"].includes(role)) {
      return res.status(403).json({ message: "Forbidden: customers only" });
    }

    req.user = { id, email, role }; // controller reads req.user.id
    next();
  } catch (err) {
    console.error("Auth error:", err.name, err.message);
    return res.status(401).json({
      message:
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
}

router.post("/", requireUserAuth, createPublicOrder);
router.get("/mine", requireUserAuth, getMyPublicOrders);
router.patch("/:id/cancel", requireUserAuth, cancelMyPublicOrder);

export default router;
