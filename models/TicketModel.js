
import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true, trim: true },
    Contact: {
      type: String,
      required: true,
    
      validate: {
        validator: (v) => /^[0-9]{10}$/.test(v),
        message: "Contact must be a 10-digit number",
      },
    },
    issueType: {
      type: String,
      enum: ["User-Caused Issues", "Hardware Issues", "Software Issues"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    urgency: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Low" },

    // ✅ short ticket code stored in DB
    ticketId: { type: String, unique: true, index: true },
    status: { type: String, enum: ["Open", "In Progress", "Resolved", "Closed"], default: "Open" },
  },
  { timestamps: true }
);


function makeCode(len = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}


TicketSchema.pre("save", async function (next) {
  if (this.ticketId) return next(); // already set
  let tries = 0;
  while (tries < 10) {
    const candidate = makeCode(4);
    const exists = await this.constructor.exists({ ticketId: candidate });
    if (!exists) {
      this.ticketId = candidate;
      return next();
    }
    tries++;
  }
  return next(new Error("Could not generate unique ticket code. Please retry."));
});

const Ticket = mongoose.model("Ticket", TicketSchema);
export default Ticket;
