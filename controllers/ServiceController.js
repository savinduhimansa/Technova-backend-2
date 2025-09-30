


// controllers/ServiceController.js
import Service from "../models/ServiceModel.js";


async function getNextServiceNumber() {
  // Find latest by numeric part of serviceNumber
  const latest = await Service.findOne().sort({ createdAt: -1 }).lean();
  if (!latest || !latest.serviceNumber) return "SR001";

  const num = parseInt(latest.serviceNumber.replace(/^SR/, ""), 10);
  const next = (isNaN(num) ? 0 : num) + 1;
  return `SR${String(next).padStart(3, "0")}`;
}

// GET /api/services
export const getServices = async (_req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (e) {
    res.status(500).json({ message: "Error fetching services", error: e.message });
  }
};

// POST /api/services
export const createService = async (req, res) => {
  try {
    const { service, description, cost, dateCreated } = req.body || {};
    if (!service || !description || (cost === undefined || cost === null)) {
      return res.status(400).json({
        message: "service, description and cost are required",
      });
    }

    const serviceNumber = await getNextServiceNumber();

    const created = await Service.create({
      serviceNumber,
      dateCreated: dateCreated || undefined,
      service: service.trim(),
      description: description.trim(),
      cost: Number(cost),
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: "Error adding service", error: e.message });
  }
};

// PUT /api/services/:id
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent changing the serviceNumber from the client
    const { serviceNumber, ...update } = req.body || {};

    const updated = await Service.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Service not found" });
    res.status(200).json(updated);
  } catch (e) {
    res.status(400).json({ message: "Error updating service", error: e.message });
  }
};

// DELETE /api/services/:id
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Service not found" });
    res.status(200).json({ message: "Service deleted" });
  } catch (e) {
    res.status(500).json({ message: "Error deleting service", error: e.message });
  }
};









