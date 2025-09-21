

// middleware/TicketMiddleware.js
export const validateTicket = (req, res, next) => {
  const { Name, Contact, issueType, description, urgency } = req.body;

  if (!Name || !Contact || !issueType || !description || !urgency) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!/^\d{10,15}$/.test(String(Contact))) {
    return res.status(400).json({ message: "Invalid contact number format" });
  }

  next();
};

