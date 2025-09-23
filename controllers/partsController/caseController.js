// controllers/caseController.js
import Case from "../../models/computer_parts/case.js";
import Motherboard from "../../models/computer_parts/motherboard.js";
import { createOrBulk, updateByProductId, deleteByProductId } from "./crudFactory.js";

// COMPAT: cases compatible with motherboard (form factor) + optional GPU length
export async function getCaseCompatible(req, res) {
  try {
    const { motherboardId, gpuLengthMM } = req.query;
    if (!motherboardId) return res.status(400).json({ message: "motherboardId is required" });

    const mb = await Motherboard.findOne({ productId: motherboardId });
    if (!mb) return res.status(404).json({ message: "Motherboard not found" });

    const filter = { supportedFormFactors: mb.formFactor };
    if (gpuLengthMM) filter.gpuMaxLengthMM = { $gte: Number(gpuLengthMM) };

    const cases = await Case.find(filter).sort({ price: 1 });
    res.json({ motherboard: { formFactor: mb.formFactor }, cases });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// CRUD
export const createCase = createOrBulk(Case);
export const updateCase = updateByProductId(Case);
export const deleteCase = deleteByProductId(Case);
