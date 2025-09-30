


import Ticket from "../models/TicketModel.js";


const makeCode = (len = 4) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

const getUniqueTicketId = async () => {

  for (let i = 0; i < 10; i++) {
    const candidate = makeCode(4);
    const exists = await Ticket.exists({ ticketId: candidate });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate unique ticket code");
};

// CREATE
export const createTicket = async (req, res) => {
  try {
    
    if (!req.body.ticketId) {
      req.body.ticketId = await getUniqueTicketId();
    }

    const ticket = await Ticket.create(req.body);

    
    res.status(201).json({ ticketId: ticket.ticketId, ticket });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// LIST
export const listTickets = async (_req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Optional alias
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

    // ✅ Return short ticketId instead of _id
    res.status(200).json({ ticketId: ticket.ticketId, ticket });
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
