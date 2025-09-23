import HDD from "../../models/computer_parts/hdd.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// LIST
export async function getHdd(req, res) {
  try {
    const hdds = await HDD.find().sort({ price: 1 });
    res.json(hdds);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD
export const createHdd = createOrBulk(HDD);
export const updateHdd = updateByProductId(HDD);
export const deleteHdd = deleteByProductId(HDD);
