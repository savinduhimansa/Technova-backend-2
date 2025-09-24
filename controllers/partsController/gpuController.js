// controllers/gpuController.js
import Gpu from "../../models/computer_parts/gpu.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// LIST
export async function getGpu(req, res) {
  try {
    const gpus = await Gpu.find().sort({ price: 1 });
    res.json(gpus);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD  (remember: send "lengthMM" as a numeric string like "305")
export const createGpu = createOrBulk(Gpu);
export const updateGpu = updateByProductId(Gpu);
export const deleteGpu = deleteByProductId(Gpu);
