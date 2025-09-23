import SSD from "../../models/computer_parts/ssd.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// LIST
export async function getSsd(req, res) {
  try {
    const ssds = await SSD.find().sort({ price: 1 });
    res.json(ssds);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD
export const createSsd = createOrBulk(SSD);
export const updateSsd = updateByProductId(SSD);
export const deleteSsd = deleteByProductId(SSD);
