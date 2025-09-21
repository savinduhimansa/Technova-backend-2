



// controllers/TicketController.js
import Ticket from "../models/TicketModel.js";

// CREATE
export const createTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json({ ticketId: ticket._id, ticket });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// LIST (used by routes as "listTickets")
export const listTickets = async (_req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// optional alias if other code uses this name
export const getAllTickets = listTickets;

// GET ONE
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ ticketId: ticket._id, ticket });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
