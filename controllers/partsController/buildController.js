// controllers/partsController/buildController.js
import Cpu from "../../models/computer_parts/cpu.js";
import Motherboard from "../../models/computer_parts/motherboard.js";
import Ram from "../../models/computer_parts/ram.js";
import Gpu from "../../models/computer_parts/gpu.js";
import Case from "../../models/computer_parts/case.js";
import SSD from "../../models/computer_parts/ssd.js";
import HDD from "../../models/computer_parts/hdd.js";
import PSU from "../../models/computer_parts/psu.js";
import Fan from "../../models/computer_parts/fan.js";
import Build from "../../models/build.js";
import PDFDocument from "pdfkit";

const pick = (doc, fields = []) =>
  Object.fromEntries(fields.map(f => [f, doc?.[f]]));

const snapCPU = (cpu) => ({
  productId: cpu.productId,
  ...pick(cpu, ["brand","model","socket","price","images"])
});
const snapMB = (mb) => ({
  productId: mb.productId,
  ...pick(mb, ["brand","model","socket","formFactor","memoryType","memorySlots","price","images"])
});
const snapRAM = (ram) => ({
  productId: ram.productId,
  ...pick(ram, ["brand","model","memoryType","kitCapacity","modules","speedMHz","price","images"])
});
const snapGPU = (gpu) => ({
  productId: gpu.productId,
  ...pick(gpu, ["brand","model","lengthMM","price","images"])
});
const snapCase = (pcCase) => ({
  productId: pcCase.productId,
  ...pick(pcCase, ["brand","model","supportedFormFactors","gpuMaxLengthMM","price","images"])
});

const snapSSD = (d) => d ? ({
  productId: d.productId,
  ...pick(d, ["brand","model","interface","formFactor","capacityGB","price","images"])
}) : null;

const snapHDD = (d) => d ? ({
  productId: d.productId,
  ...pick(d, ["brand","model","formFactor","capacityGB","rpm","price","images"])
}) : null;

const snapPSU = (d) => d ? ({
  productId: d.productId,
  ...pick(d, ["brand","model","wattage","efficiency","formFactor","price","images"])
}) : null;

const snapFan = (d) => d ? ({
  productId: d.productId,
  ...pick(d, ["brand","model","sizeMM","connector","rgb","price","images"])
}) : null;

const verify = (cpu, mb, ram, gpu, pcCase) => {
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
  if (gpu && pcCase && pcCase.gpuMaxLengthMM != null && gpu.lengthMM != null) {
    const gpuLen = Number(gpu.lengthMM);
    if (!Number.isNaN(gpuLen) && typeof pcCase.gpuMaxLengthMM === "number") {
      if (gpuLen > pcCase.gpuMaxLengthMM) errors.push("GPU is too long for the Case.");
    }
  }
  return { ok: errors.length === 0, errors };
};

const computeTotals = (cpu, mb, ram, gpu, pcCase, ssd, hdd, psu, fans = [], taxRate = 0) => {
  const prices = [
    cpu?.price || 0,
    mb?.price || 0,
    ram?.price || 0,
    gpu?.price || 0,
    pcCase?.price || 0,
    ssd?.price || 0,
    hdd?.price || 0,
    psu?.price || 0,
    ...(Array.isArray(fans) ? fans.map(f => f?.price || 0) : [])
  ];
  const subtotal = prices.reduce((a,b) => a + b, 0);
  const tax = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  return { subtotal, tax, total };
};

const buildName = (cpu, gpu, ram) => {
  const cpuName = cpu?.model || cpu?.brand || "CPU";
  const gpuName = gpu?.model || gpu?.brand || "GPU";
  const ramName = ram ? `${ram.kitCapacity || "??"}GB` : "RAM";
  return `${cpuName} + ${gpuName} + ${ramName}`;
};

const ensureAllFound = (items) => {
  for (const [k, v] of Object.entries(items)) {
    if (v === null) return { found: false, which: k };
  }
  return { found: true };
};

// ============== QUOTE (no DB write) ==============
export async function quoteBuild(req, res) {
  try {
    const { cpuId, motherboardId, ramId, gpuId, caseId, ssdId, hddId, psuId, fanIds = [] } = req.body;

    const [cpu, mb, ram, gpu, pcCase, ssd, hdd, psu, fans] = await Promise.all([
      cpuId ? Cpu.findOne({ productId: cpuId }) : null,
      motherboardId ? Motherboard.findOne({ productId: motherboardId }) : null,
      ramId ? Ram.findOne({ productId: ramId }) : null,
      gpuId ? Gpu.findOne({ productId: gpuId }) : null,
      caseId ? Case.findOne({ productId: caseId }) : null,
      ssdId ? SSD.findOne({ productId: ssdId }) : null,
      hddId ? HDD.findOne({ productId: hddId }) : null,
      psuId ? PSU.findOne({ productId: psuId }) : null,
      Array.isArray(fanIds) && fanIds.length ? Fan.find({ productId: { $in: fanIds } }) : Promise.resolve([])
    ]);

    const nf = ensureAllFound({ cpu, motherboard: mb, ram, gpu, case: pcCase });
    if (!nf.found) return res.status(404).json({ ok: false, message: `${nf.which} not found` });

    const compat = verify(cpu, mb, ram, gpu, pcCase);
    const prices = computeTotals(cpu, mb, ram, gpu, pcCase, ssd, hdd, psu, fans);
    const name = buildName(cpu, gpu, ram);

    const preview = {
      ok: compat.ok,
      name,
      items: {
        cpu: snapCPU(cpu),
        motherboard: snapMB(mb),
        ram: snapRAM(ram),
        gpu: snapGPU(gpu),
        case: snapCase(pcCase),
        ssd: snapSSD(ssd),
        hdd: snapHDD(hdd),
        psu: snapPSU(psu),
        fans: (fans || []).map(snapFan)
      },
      prices,
      compatibility: compat
    };

    const status = compat.ok ? 200 : 400;
    return res.status(status).json(preview);
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// ============== CREATE DRAFT BUILD (save + decrement stock) ==============
export async function createBuild(req, res) {
  try {
    const { cpuId, motherboardId, ramId, gpuId, caseId, ssdId, hddId, psuId, fanIds = [] } = req.body;

    const [cpu, mb, ram, gpu, pcCase, ssd, hdd, psu, fans] = await Promise.all([
      cpuId ? Cpu.findOne({ productId: cpuId }) : null,
      motherboardId ? Motherboard.findOne({ productId: motherboardId }) : null,
      ramId ? Ram.findOne({ productId: ramId }) : null,
      gpuId ? Gpu.findOne({ productId: gpuId }) : null,
      caseId ? Case.findOne({ productId: caseId }) : null,
      ssdId ? SSD.findOne({ productId: ssdId }) : null,
      hddId ? HDD.findOne({ productId: hddId }) : null,
      psuId ? PSU.findOne({ productId: psuId }) : null,
      Array.isArray(fanIds) && fanIds.length ? Fan.find({ productId: { $in: fanIds } }) : Promise.resolve([])
    ]);

    const nf = ensureAllFound({ cpu, motherboard: mb, ram, gpu, case: pcCase });
    if (!nf.found) return res.status(404).json({ ok: false, message: `${nf.which} not found` });

    const compat = verify(cpu, mb, ram, gpu, pcCase);
    if (!compat.ok) return res.status(400).json({ ok: false, errors: compat.errors });

    const outOfStock = [];
    for (const d of [cpu, mb, ram, gpu, pcCase, ssd, hdd, psu, ...(fans||[])]) {
      if (d && (d.stock || 0) < 1) outOfStock.push(d.productId);
    }
    if (outOfStock.length) {
      return res.status(409).json({ ok: false, message: "Out of stock", items: outOfStock });
    }

    const prices = computeTotals(cpu, mb, ram, gpu, pcCase, ssd, hdd, psu, fans);
    const name = buildName(cpu, gpu, ram);
    const buildId = `BUILD-${Date.now()}-${Math.floor(Math.random()*10000)}`;

    const buildDoc = await Build.create({
      buildId,
      userId: req.user?.id || null,
      name,
      items: {
        cpu: snapCPU(cpu),
        motherboard: snapMB(mb),
        ram: snapRAM(ram),
        gpu: snapGPU(gpu),
        case: snapCase(pcCase),
        ssd: snapSSD(ssd),
        hdd: snapHDD(hdd),
        psu: snapPSU(psu),
        fans: (fans || []).map(snapFan)
      },
      prices,
      compatibility: compat,
      status: "draft"
    });

    await Promise.all(
      [cpu, mb, ram, gpu, pcCase, ssd, hdd, psu, ...(fans||[])]
        .filter(Boolean)
        .map(d => d.constructor.updateOne({ _id: d._id }, { $inc: { stock: -1 } }))
    );

    return res.status(201).json({
      ok: true,
      message: "Build saved as draft",
      buildId: buildDoc.buildId,
      build: buildDoc
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
}

// ============== READ ONE BUILD ==============
export async function getBuild(req, res) {
  try {
    const { buildId } = req.params;
    const b = await Build.findOne({ buildId });
    if (!b) return res.status(404).json({ ok: false, message: "Build not found" });
    res.json(b);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ============== USER: list my builds ==============
export async function listMyBuilds(req, res) {
  try {
    const userId = req.user?.id || "";
    const items = await Build.find({ userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ============== USER: submit a draft ==============
export async function submitBuild(req, res) {
  try {
    const { buildId } = req.params;
    const userId = req.user?.id || "";
    const build = await Build.findOne({ buildId, userId });
    if (!build) return res.status(404).json({ ok: false, message: "Build not found" });
    if (build.status !== "draft") {
      return res.status(400).json({ ok: false, message: "Only draft builds can be submitted" });
    }
    build.status = "submitted";
    await build.save();
    res.json({ ok: true, message: "Build submitted for approval", build });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ============== ADMIN: list all builds ==============
export async function adminListBuilds(req, res) {
  try {
    const { status } = req.query; // optional filter
    const filter = status ? { status } : {};
    const items = await Build.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ============== ADMIN: update status/notes ==============
export async function adminUpdateBuild(req, res) {
  try {
    const { buildId } = req.params;
    const { status, notes } = req.body; // status: approved/rejected/purchased
    const build = await Build.findOne({ buildId });
    if (!build) return res.status(404).json({ ok: false, message: "Not found" });

    if (status) build.status = status;
    if (typeof notes === "string") build.notes = notes;
    await build.save();

    res.json({ ok: true, build });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ============== ADMIN: delete build ==============
export async function adminDeleteBuild(req, res) {
  try {
    const { buildId } = req.params;
    const b = await Build.findOneAndDelete({ buildId });
    if (!b) return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, deleted: buildId });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}


// --- Download build as PDF (JWT) ---
export async function getBuildPdf(req, res) {
  try {
    const { buildId } = req.params;
    const userId = req.user?.id || null;

    // Only allow the owner to download (or relax if you want admins too)
    const build = await Build.findOne({ buildId, userId });
    if (!build) return res.status(404).json({ ok: false, message: "Build not found" });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${buildId}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill("#111827");
    doc.fillColor("#FFFFFF").fontSize(20).text("TechNova — PC Build", 50, 28);
    doc.fillColor("#9CA3AF").fontSize(10).text(`Build ID: ${build.buildId}`, 50, 58);

    // Meta
    doc.moveDown().fillColor("#111827").fontSize(12);
    const meta = [
      ["Status", build.status],
      ["Created", new Date(build.createdAt).toLocaleString()],
      ["Updated", new Date(build.updatedAt).toLocaleString()],
      ["Name", build.name || "(untitled build)"],
    ];
    meta.forEach(([k,v]) => doc.text(`${k}: ${v}`));
    doc.moveDown();

    // Items
    const rows = [];
    const add = (label, part) => { if (part) rows.push([label, part.model || "", part.price ?? 0]); };
    const it = build.items || {};
    add("CPU", it.cpu);
    add("Motherboard", it.motherboard);
    add("RAM", it.ram);
    add("GPU", it.gpu);
    add("Case", it.case);
    add("SSD", it.ssd);
    add("HDD", it.hdd);
    add("PSU", it.psu);
    (it.fans || []).forEach((f, i) => add(`Fan #${i+1}`, f));

    const fmt = n => `$${Number(n||0).toFixed(2)}`;

    doc.fontSize(13).text("Selected Parts", { underline: true });
    doc.moveDown(0.5);
    rows.forEach(([cat, desc, price]) => {
      doc.fontSize(11).text(`${cat}: ${desc}`);
      doc.text(`Price: ${fmt(price)}`);
      doc.moveDown(0.25);
    });

    doc.moveDown(0.5);
    doc.fontSize(12).text(`Subtotal: ${fmt(build.prices?.subtotal)}`);
    doc.text(`Tax: ${fmt(build.prices?.tax)}`);
    doc.font("Helvetica-Bold").text(`Total: ${fmt(build.prices?.total)}`);
    doc.font("Helvetica");

    // Compatibility
    doc.moveDown();
    const compat = build.compatibility || { ok: true, errors: [] };
    doc.text(`Compatibility: ${compat.ok ? "OK" : "Issues found"}`);
    if (!compat.ok && compat.errors?.length) {
      compat.errors.forEach(e => doc.text(` • ${e}`));
    }

    doc.end();
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ ok: false, message: e.message });
  }
}

// --- Mark approved build as purchased (JWT) ---
export async function purchaseBuild(req, res) {
  try {
    const { buildId } = req.params;
    const userId = req.user?.id || "";

    const b = await Build.findOne({ buildId, userId });
    if (!b) return res.status(404).json({ ok: false, message: "Build not found" });

    if (b.status !== "approved") {
      return res.status(400).json({ ok: false, message: "Build must be approved before purchase" });
    }

    b.status = "purchased";
    await b.save();
    res.json({ ok: true, build: b });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
