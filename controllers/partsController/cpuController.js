// controllers/partsController/cpuController.js
import Cpu from "../../models/computer_parts/cpu.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

export async function getCpu(req, res) {
  try {
    const { brand } = req.query; // "AMD" | "Intel"
    const filter = brand ? { brand } : {};
    const cpus = await Cpu.find(filter).sort({ price: 1 });
    res.json(cpus);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

export const createCpu = createOrBulk(Cpu);
export const updateCpu = updateByProductId(Cpu);
export const deleteCpu = deleteByProductId(Cpu);
