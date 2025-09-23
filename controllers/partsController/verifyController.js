import Case from "../../models/computer_parts/case.js";
import Cpu from "../../models/computer_parts/cpu.js";
import Gpu from "../../models/computer_parts/gpu.js";
import Motherboard from "../../models/computer_parts/motherboard.js";
import Ram from "../../models/computer_parts/ram.js";

// Verify build (simple cross-compat checks)
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

    // CPU ↔ MB
    if (cpu && mb) {
      if (cpu.brand !== mb.brand) errors.push("CPU brand and Motherboard brand mismatch.");
      if (cpu.socket !== mb.socket) errors.push("CPU socket and Motherboard socket mismatch.");
    }

    // MB ↔ RAM
    if (mb && ram) {
      if (mb.memoryType !== ram.memoryType) errors.push("RAM type not supported by Motherboard.");
      if ((ram.modules || 2) > (mb.memorySlots || 2)) errors.push("Not enough memory slots on Motherboard.");
    }

    // Case ↔ MB
    if (mb && pcCase) {
      const ok = (pcCase.supportedFormFactors || []).includes(mb.formFactor);
      if (!ok) errors.push("Case does not support Motherboard form factor.");
    }

    // Case ↔ GPU (length)
    if (gpu && pcCase && pcCase.gpuMaxLengthMM != null && gpu.lengthMM != null) {
      const gpuLen = Number(gpu.lengthMM);
      if (!Number.isNaN(gpuLen) && typeof pcCase.gpuMaxLengthMM === "number") {
        if (gpuLen > pcCase.gpuMaxLengthMM) errors.push("GPU is too long for the Case.");
      }
    }

    if (errors.length) return res.status(400).json({ ok: false, errors });
    res.json({ ok: true, message: "Build is valid." });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
