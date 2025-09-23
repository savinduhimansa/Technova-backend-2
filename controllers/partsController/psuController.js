import PSU from "../../models/computer_parts/psu.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// LIST
export async function getPsu(req, res) {
  try {
    const psus = await PSU.find().sort({ wattage: 1 });
    res.json(psus);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD
export const createPsu = createOrBulk(PSU);
export const updatePsu = updateByProductId(PSU);
export const deletePsu = deleteByProductId(PSU);
