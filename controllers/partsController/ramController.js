// controllers/ramController.js
import Ram from "../../models/computer_parts/ram.js";
import Motherboard from "../../models/computer_parts/motherboard.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// COMPAT: RAM compatible with a motherboard (type & module count)
export async function getRamCompatible(req, res) {
  try {
    const { motherboardId, maxModules } = req.query;
    if (!motherboardId) return res.status(400).json({ message: "motherboardId is required" });

    const mb = await Motherboard.findOne({ productId: motherboardId });
    if (!mb) return res.status(404).json({ message: "Motherboard not found" });

    const filter = { memoryType: mb.memoryType };
    let rams = await Ram.find(filter).sort({ price: 1 });

    const slots = Number(maxModules || mb.memorySlots || 2);
    rams = rams.filter((r) => (r.modules || 2) <= slots);

    res.json({ motherboard: { memoryType: mb.memoryType, memorySlots: mb.memorySlots }, rams });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD
export const createRam = createOrBulk(Ram);
export const updateRam = updateByProductId(Ram);
export const deleteRam = deleteByProductId(Ram);
