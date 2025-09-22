import Fan from "../../models/computer_parts/fan.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// LIST
export async function getFan(req, res) {
  try {
    const fans = await Fan.find().sort({ sizeMM: 1 });
    res.json(fans);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD
export const createFan = createOrBulk(Fan);
export const updateFan = updateByProductId(Fan);
export const deleteFan = deleteByProductId(Fan);
