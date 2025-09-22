// controllers/motherboardController.js
import Motherboard from "../../models/computer_parts/motherboard.js";
import Cpu from "../../models/computer_parts/cpu.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// COMPAT: motherboards compatible with CPU (brand or brand+socket)
export async function getMotherboardCompatible(req, res) {
  try {
    const { cpuId, mode = "brand" } = req.query;
    if (!cpuId) return res.status(400).json({ message: "cpuId is required" });

    const cpu = await Cpu.findOne({ productId: cpuId });
    if (!cpu) return res.status(404).json({ message: "CPU not found" });

    const filter = { brand: cpu.brand };
    if (mode === "brand+socket") filter.socket = cpu.socket;

    const boards = await Motherboard.find(filter).sort({ price: 1 });
    res.json({ cpu: { brand: cpu.brand, socket: cpu.socket }, boards });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD
export const createMotherboard = createOrBulk(Motherboard);
export const updateMotherboard = updateByProductId(Motherboard);
export const deleteMotherboard = deleteByProductId(Motherboard);
