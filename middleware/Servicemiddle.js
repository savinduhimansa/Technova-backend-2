





// middleware/ServiceMiddle.js
import Service from "../models/ServiceModel.js";


const serviceMiddle = async (req, res, next) => {
  try {
    const { service, cost } = req.body ?? {};

    // Only validate body on POST/PUT
    if (req.method === "POST" || req.method === "PUT") {
      if (service == null || cost == null) {
        return res.status(400).json({ message: "Both 'service' and 'cost' are required." });
      }
      if (Number.isNaN(Number(cost)) || Number(cost) < 0) {
        return res.status(400).json({ message: "'cost' must be a number >= 0." });
      }
    }

    // On POST, block duplicate service names
    if (req.method === "POST") {
      const exists = await Service.findOne({ service: String(service).trim() });
      if (exists) {
        return res.status(409).json({ message: "Service with this name already exists." });
      }
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export default serviceMiddle;
