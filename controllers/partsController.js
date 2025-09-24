import Case from "../models/computer_parts/case.js";
import Cpu from "../models/computer_parts/cpu.js";
import Gpu from "../models/computer_parts/gpu.js";
import Motherboard from "../models/computer_parts/motherboard.js";
import Ram from "../models/computer_parts/ram.js";

/* ---------------------- Generic CRUD helpers ---------------------- */
const createOrBulk = (Model) => async (req, res) => {
  try {
    const payload = req.body;

    // BULK
    if (Array.isArray(payload)) {
      const docs = await Model.insertMany(payload, { ordered: false });
      return res.status(201).json({
        ok: true,
        message: `Inserted ${docs.length} item(s)`,
        count: docs.length,
        ids: docs.map(d => d.productId || String(d._id))
      });
    }

    // SINGLE
    const doc = await Model.create(payload);
    return res.status(201).json({
      ok: true,
      message: `${Model.modelName} ${doc.productId || String(doc._id)} created`,
      id: doc.productId || String(doc._id)
    });
  } catch (err) {
    // Partial success for bulk (some duplicates, etc.)
    if (Array.isArray(req.body) && err?.writeErrors?.length) {
      return res.status(207).json({
        ok: false,
        message: "Partial success inserting items",
        failed: err.writeErrors.map(e => ({
          index: e.index,
          code: e.code || e.err?.code,
          keyValue: e.keyValue || e.err?.keyValue,
          errmsg: e.errmsg || e.err?.errmsg
        }))
      });
    }
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, message: "Duplicate key", keyValue: err.keyValue });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({
        ok: false,
        message: "Validation error",
        errors: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]))
      });
    }
    return res.status(500).json({ ok: false, message: err.message });
  }
};



const updateByProductId = (Model) => async (req, res) => {
  try {
    const { productId } = req.params;
    const doc = await Model.findOneAndUpdate({ productId }, { $set: req.body }, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



const deleteByProductId = (Model) => async (req, res) => {
  try {
    const { productId } = req.params;
    const doc = await Model.findOneAndDelete({ productId });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true, deleted: doc.productId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* ------------------------------ READ ------------------------------- */

// CPUs
export async function getCpu(req, res) {
  try {
    const cpus = await Cpu.find().sort({ price: 1 });
    res.json(cpus);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// GPUs
export async function getGpu(req, res) {
  try {
    const gpus = await Gpu.find().sort({ price: 1 });
    res.json(gpus);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// Motherboards compatible with a CPU (brand-only or brand+socket)
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

// RAM compatible with a motherboard (by memoryType & available slots)
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

// Cases compatible with motherboard (form factor) and optional gpu length
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

/* --------------------------- VERIFY BUILD -------------------------- */
export async function verifyBuild(req, res) {
  try {
    const { cpuId, motherboardId, ramId, gpuId, caseId } = req.body;

    const [cpu, mb, ram, gpu, pcCase] = await Promise.all([
      cpuId ? Cpu.findOne({ productId: cpuId }) : null,
      motherboardId ? Motherboard.findOne({ productId: motherboardId }) : null,
      ramId ? Ram.findOne({ productId: ramId }) : null,
      gpuId ? Gpu.findOne({ productId: gpuId }) : null,
      caseId ? Case.findOne({ productId: caseId }) : null,
    ]);

    const errors = [];
    if (cpu && mb) {
      if (cpu.brand !== mb.brand) errors.push("CPU brand and Motherboard brand mismatch.");
      if (cpu.socket !== mb.socket) errors.push("CPU socket and Motherboard socket mismatch.");
    }
    if (mb && ram) {
      if (mb.memoryType !== ram.memoryType) errors.push("RAM type not supported by Motherboard.");
      if ((ram.modules || 2) > (mb.memorySlots || 2)) errors.push("Not enough memory slots on Motherboard.");
    }
    if (mb && pcCase) {
      const ok = (pcCase.supportedFormFactors || []).includes(mb.formFactor);
      if (!ok) errors.push("Case does not support Motherboard form factor.");
    }
    if (gpu && pcCase && pcCase.gpuMaxLengthMM && gpu.lengthMM) {
      if (gpu.lengthMM > pcCase.gpuMaxLengthMM) errors.push("GPU is too long for the Case.");
    }

    if (errors.length) return res.status(400).json({ ok: false, errors });
    res.json({ ok: true, message: "Build is valid." });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

/* ------------------------------ CRUD ------------------------------- */
export const createCpu = createOrBulk(Cpu);
export const updateCpu = updateByProductId(Cpu);
export const deleteCpu = deleteByProductId(Cpu);

export const createMotherboard = createOrBulk(Motherboard);
export const updateMotherboard = updateByProductId(Motherboard);
export const deleteMotherboard = deleteByProductId(Motherboard);

export const createRam = createOrBulk(Ram);
export const updateRam = updateByProductId(Ram);
export const deleteRam = deleteByProductId(Ram);

export const createGpu = createOrBulk(Gpu);
export const updateGpu = updateByProductId(Gpu);
export const deleteGpu = deleteByProductId(Gpu);

export const createCase = createOrBulk(Case);
export const updateCase = updateByProductId(Case);
export const deleteCase = deleteByProductId(Case);
