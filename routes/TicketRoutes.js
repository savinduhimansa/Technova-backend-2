


// routes/TicketRoutes.js
import express from "express";
import {
  createTicket,
  listTickets,      // <-- now exported by controller
  getTicketById,
  updateTicket,
  deleteTicket,
} from "../controllers/TicketController.js";
import { validateTicket } from "../middleware/TicketMiddleware.js";

const router = express.Router();

// POST   /api/ticket
router.post("/", validateTicket, createTicket);

// GET    /api/ticket
router.get("/", listTickets);

// GET    /api/ticket/:id
router.get("/:id", getTicketById);

// PUT    /api/ticket/:id
router.put("/:id", updateTicket);

// DELETE /api/ticket/:id
router.delete("/:id", deleteTicket);

export default router;



