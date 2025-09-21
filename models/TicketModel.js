


//////////neww//////////
// models/TicketModel.js
import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    Name:       { type: String, required: true },
    Contact:    { type: String, required: true },
    issueType:  { type: String, required: true },
    description:{ type: String, required: true },
    urgency:    { type: String, enum: ["Low","Medium","High","Critical"], default: "Low" },
    status:     { type: String, enum: ["open","in_progress","closed"], default: "open" },
    ticketId:   { type: String } // optional, if you want a custom id alongside _id
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", TicketSchema);
export default Ticket;


