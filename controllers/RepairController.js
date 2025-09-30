


// import PDFDocument from "pdfkit";
// import QRCode from "qrcode";
// import fs from "fs";
// import path from "path";
// import Repair from "../models/RepairModel.js";
// import Service from "../models/ServiceModel.js";

// const computeTotal = ({ services = [], materials = [] }) => {
//   const s = services.reduce((sum, it) => sum + (Number(it.fee) || 0), 0);
//   const m = materials.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
//   return s + m;
// };

// // POST /app/repair
// export const createRepair = async (req, res) => {
//   try {
//     const {
//       code, clientName,ticketId, services = [], materials = [],
//       remarks = "", paymentStatus = "Unpaid", status = "Pending",
//       totalAmount, dateCreated
//     } = req.body;

//     if (!code || !clientName) return res.status(400).json({ message: "code and clientName are required" });

//     // validate & hydrate service fees from Service.cost if missing
//     if (services.length) {
//       const ids = services.map(s => s.serviceId);
//       const existing = await Service.find({ _id: { $in: ids } }, { _id: 1, cost: 1 });
//       const costMap = new Map(existing.map(s => [String(s._id), s.cost]));
//       for (const s of services) {
//         if (!costMap.has(String(s.serviceId))) {
//           return res.status(400).json({ message: `Invalid serviceId: ${s.serviceId}` });
//         }
//         if (s.fee == null) s.fee = costMap.get(String(s.serviceId));
//       }
//     }

//     const payload = {
//       code,
//       clientName: clientName.trim(),
//       ticketId,
//       services,
//       materials,
//       remarks,
//       paymentStatus,
//       status,
//       totalAmount: totalAmount != null ? Number(totalAmount) : computeTotal({ services, materials }),
//       dateCreated: dateCreated ? new Date(dateCreated) : undefined
//     };

//     const created = await Repair.create(payload);
//     const populated = await Repair.findById(created._id).populate("services.serviceId", "service cost");
//     res.status(201).json(populated);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// };

// // GET /app/repair
// export const getRepairs = async (_req, res) => {
//   try {
//     const items = await Repair.find()
//       .populate("services.serviceId", "service cost")
//       .sort({ createdAt: -1 });
//     res.status(200).json(items);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// };

// // GET /app/repair/:id
// export const getRepairById = async (req, res) => {
//   try {
//     const doc = await Repair.findById(req.params.id).populate("services.serviceId", "service cost");
//     if (!doc) return res.status(404).json({ message: "Repair not found" });
//     res.status(200).json(doc);
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// };

// // PUT /app/repair/:id
// export const updateRepair = async (req, res) => {
//   try {
//     const update = { ...req.body };

//     if (Array.isArray(update.services)) {
//       const ids = update.services.map(s => s.serviceId);
//       const existing = await Service.find({ _id: { $in: ids } }, { _id: 1, cost: 1 });
//       const costMap = new Map(existing.map(s => [String(s._id), s.cost]));
//       for (const s of update.services) {
//         if (!costMap.has(String(s.serviceId))) {
//           return res.status(400).json({ message: `Invalid serviceId: ${s.serviceId}` });
//         }
//         if (s.fee == null) s.fee = costMap.get(String(s.serviceId));
//       }
//     }

//     if (update.totalAmount == null) {
//       update.totalAmount = computeTotal({
//         services: update.services || [],
//         materials: update.materials || []
//       });
//     }

//     const doc = await Repair.findByIdAndUpdate(req.params.id, update, {
//       new: true, runValidators: true
//     }).populate("services.serviceId", "service cost");

//     if (!doc) return res.status(404).json({ message: "Repair not found" });
//     res.status(200).json(doc);
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

// // DELETE /app/repair/:id
// export const deleteRepair = async (req, res) => {
//   try {
//     const del = await Repair.findByIdAndDelete(req.params.id);
//     if (!del) return res.status(404).json({ message: "Repair not found" });
//     res.status(200).json({ message: "Repair deleted successfully" });
    
//   } catch (e) {
//     res.status(500).json({ message: e.message });
//   }
// };

// // GET /app/repair/:id/pdf 
// export const downloadInvoicePdf = async (req, res) => {
//   try {
//     const repair = await Repair.findById(req.params.id).populate("services.serviceId", "service cost");
//     if (!repair) return res.status(404).json({ message: "Repair not found" });

//     // QR with code
//     const qrDataURL = await QRCode.toDataURL(repair.code || String(repair._id));
//     const qrBuffer = Buffer.from(qrDataURL.split(",")[1], "base64");

    
//     const logoPath = path.resolve("logo.png");
//     const hasLogo = fs.existsSync(logoPath);

//     // Create PDF
//     const doc = new PDFDocument({ size: "A4", margin: 36 });
//     const filename = `invoice_${repair.code || repair._id}.pdf`;

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

//     doc.on("error", (e) => console.error("PDF error:", e));
//     doc.pipe(res);

//     // Header
//     if (hasLogo) doc.image(logoPath, 36, 36, { width: 64 });
//     doc.fontSize(24).text("INVOICE", hasLogo ? 110 : 36, 40);
//     doc.fontSize(10).fillColor("#555")
//       .text("Technova – Repair Billing Software", hasLogo ? 110 : 36, 70)
//       .text("email@technova.com  •  +94 11 234 5678", hasLogo ? 110 : 36, 84)
//       .text("Colombo, Sri Lanka", hasLogo ? 110 : 36, 98)
//       .fillColor("black");

//     doc.moveDown();
//     doc.fontSize(11);
//     doc.text(`Invoice No: ${repair.code}`, 36, 130);
//     doc.text(`Date: ${new Date(repair.dateCreated || repair.createdAt).toLocaleDateString()}`, 36, 146);
//     doc.text(`To: ${repair.clientName}`, 400, 130);
//     doc.text(`Payment: ${repair.paymentStatus}`, 400, 146);
//     doc.text(`Status: ${repair.status}`, 400, 162);

//     // QR
//     doc.image(qrBuffer, 460, 36, { width: 64 });

//     // Services Table
//     let y = 190;
//     doc.fontSize(12).text("Services", 36, y); y += 10;
//     doc.moveTo(36, y).lineTo(559, y).stroke(); y += 6;
//     doc.fontSize(10);
//     doc.text("#", 36, y);
//     doc.text("Service", 60, y);
//     doc.text("Fee", 500, y, { width: 59, align: "right" });
//     y += 14;

//     (repair.services || []).forEach((s, i) => {
//       doc.text(String(i + 1), 36, y);
//       doc.text(s?.serviceId?.service ?? "—", 60, y);
//       doc.text(Number(s?.fee || 0).toFixed(2), 500, y, { width: 59, align: "right" });
//       y += 14;
//     });

//     if (!repair.services?.length) {
//       doc.text("No services", 60, y); y += 14;
//     }

//     // Materials Table
//     y += 10;
//     doc.fontSize(12).text("Materials", 36, y); y += 10;
//     doc.moveTo(36, y).lineTo(559, y).stroke(); y += 6;
//     doc.fontSize(10);
//     doc.text("#", 36, y);
//     doc.text("Material", 60, y);
//     doc.text("Cost", 500, y, { width: 59, align: "right" });
//     y += 14;

//     (repair.materials || []).forEach((m, i) => {
//       doc.text(String(i + 1), 36, y);
//       doc.text(m?.name ?? "—", 60, y);
//       doc.text(Number(m?.cost || 0).toFixed(2), 500, y, { width: 59, align: "right" });
//       y += 14;
//     });

//     if (!repair.materials?.length) {
//       doc.text("No materials", 60, y); y += 14;
//     }

//     // Totals
//     y += 10;
//     doc.moveTo(400, y).lineTo(559, y).stroke(); y += 6;
//     doc.fontSize(12).text("Total:", 400, y);
//     doc.text(Number(repair.totalAmount || 0).toFixed(2), 500, y, { width: 59, align: "right" });
//     y += 24;

//     // Remarks + Terms
//     doc.fontSize(11).text("Remarks:", 36, y); y += 14;
//     doc.fontSize(10).fillColor("#444").text(repair.remarks || "-", 36, y, { width: 523 });
//     y += 40;
//     doc.fillColor("black").fontSize(11).text("Terms & Conditions", 36, y); y += 12;
//     doc.fontSize(9).fillColor("#444").text(
//       "Quotes are based on initial assessment and may vary after additional parts/tests. " +
//       "Estimates are valid for 30 days. By leaving your item for repair, you authorize necessary tests and replacements.",
//       36, y, { width: 523 }
//     );

//     doc.end();
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: e.message });
//   }
// };



// controllers/RepairController.js
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import Repair from "../models/RepairModel.js";
import Service from "../models/ServiceModel.js";

const SERVICE_CHARGE_DEFAULT = 500;

const computeTotal = ({ services = [], materials = [], serviceCharge = 0 }) => {
  const s = services.reduce((sum, it) => sum + (Number(it.fee) || 0), 0);
  const m = materials.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
  return s + m + Number(serviceCharge || 0);
};

// POST /app/repair
export const createRepair = async (req, res) => {
  try {
    const {
      code, clientName, ticketId,
      services = [], materials = [],
      remarks = "", paymentStatus = "Unpaid", status = "Pending",
      totalAmount, dateCreated,
      serviceCharge, // NEW
    } = req.body;

    if (!code || !clientName) {
      return res.status(400).json({ message: "code and clientName are required" });
    }

    // validate & hydrate service fees from Service.cost if missing
    if (services.length) {
      const ids = services.map(s => s.serviceId);
      const existing = await Service.find({ _id: { $in: ids } }, { _id: 1, cost: 1 });
      const costMap = new Map(existing.map(s => [String(s._id), s.cost]));
      for (const s of services) {
        if (!costMap.has(String(s.serviceId))) {
          return res.status(400).json({ message: `Invalid serviceId: ${s.serviceId}` });
        }
        if (s.fee == null) s.fee = costMap.get(String(s.serviceId));
      }
    }

    const sc = serviceCharge == null ? SERVICE_CHARGE_DEFAULT : Number(serviceCharge);

    const payload = {
      code,
      clientName: clientName.trim(),
      ticketId,
      services,
      materials,
      remarks,
      paymentStatus,
      status,
      serviceCharge: sc,
      totalAmount: totalAmount != null
        ? Number(totalAmount)
        : computeTotal({ services, materials, serviceCharge: sc }),
      dateCreated: dateCreated ? new Date(dateCreated) : undefined
    };

    const created = await Repair.create(payload);
    const populated = await Repair.findById(created._id)
      .populate("services.serviceId", "service cost");
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /app/repair
export const getRepairs = async (_req, res) => {
  try {
    const items = await Repair.find()
      .populate("services.serviceId", "service cost")
      .sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /app/repair/:id
export const getRepairById = async (req, res) => {
  try {
    const doc = await Repair.findById(req.params.id)
      .populate("services.serviceId", "service cost");
    if (!doc) return res.status(404).json({ message: "Repair not found" });
    res.status(200).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /app/repair/:id
export const updateRepair = async (req, res) => {
  try {
    const update = { ...req.body };

    if (Array.isArray(update.services)) {
      const ids = update.services.map(s => s.serviceId);
      const existing = await Service.find({ _id: { $in: ids } }, { _id: 1, cost: 1 });
      const costMap = new Map(existing.map(s => [String(s._id), s.cost]));
      for (const s of update.services) {
        if (!costMap.has(String(s.serviceId))) {
          return res.status(400).json({ message: `Invalid serviceId: ${s.serviceId}` });
        }
        if (s.fee == null) s.fee = costMap.get(String(s.serviceId));
      }
    }

    if (update.serviceCharge == null) update.serviceCharge = SERVICE_CHARGE_DEFAULT;
    update.serviceCharge = Number(update.serviceCharge);

    if (update.totalAmount == null) {
      update.totalAmount = computeTotal({
        services: update.services || [],
        materials: update.materials || [],
        serviceCharge: update.serviceCharge
      });
    }

    const doc = await Repair.findByIdAndUpdate(req.params.id, update, {
      new: true, runValidators: true
    }).populate("services.serviceId", "service cost");

    if (!doc) return res.status(404).json({ message: "Repair not found" });
    res.status(200).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// DELETE /app/repair/:id
export const deleteRepair = async (req, res) => {
  try {
    const del = await Repair.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: "Repair not found" });
    res.status(200).json({ message: "Repair deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /app/repair/:id/pdf
export const downloadInvoicePdf = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate("services.serviceId", "service cost");
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    // QR with code
    const qrDataURL = await QRCode.toDataURL(repair.code || String(repair._id));
    const qrBuffer = Buffer.from(qrDataURL.split(",")[1], "base64");

    const logoPath = path.resolve("logo.png");
    const hasLogo = fs.existsSync(logoPath);

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const filename = `invoice_${repair.code || repair._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.on("error", (e) => console.error("PDF error:", e));
    doc.pipe(res);

    // Header
    if (hasLogo) doc.image(logoPath, 36, 36, { width: 64 });
    doc.fontSize(24).text("INVOICE", hasLogo ? 110 : 36, 40);
    doc.fontSize(10).fillColor("#555")
      .text("Technova – Repair Billing Software", hasLogo ? 110 : 36, 70)
      .text("email@technova.com  •  +94 11 234 5678", hasLogo ? 110 : 36, 84)
      .text("Colombo, Sri Lanka", hasLogo ? 110 : 36, 98)
      .fillColor("black");

    // Bill-to / meta
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Invoice No: ${repair.code}`, 36, 130);
    if (repair.ticketId) doc.text(`Ticket ID: ${repair.ticketId}`, 36, 146);
    doc.text(`Date: ${new Date(repair.dateCreated || repair.createdAt).toLocaleDateString()}`, 36, 162);
    doc.text(`To: ${repair.clientName}`, 400, 130);
    doc.text(`Payment: ${repair.paymentStatus}`, 400, 146);
    doc.text(`Status: ${repair.status}`, 400, 162);

    // QR
    doc.image(qrBuffer, 460, 36, { width: 64 });

    // Services Table
    let y = 190;
    doc.fontSize(12).text("Services", 36, y); y += 10;
    doc.moveTo(36, y).lineTo(559, y).stroke(); y += 6;
    doc.fontSize(10);
    doc.text("#", 36, y);
    doc.text("Service", 60, y);
    doc.text("Fee", 500, y, { width: 59, align: "right" });
    y += 14;

    (repair.services || []).forEach((s, i) => {
      doc.text(String(i + 1), 36, y);
      doc.text(s?.serviceId?.service ?? "—", 60, y);
      doc.text(Number(s?.fee || 0).toFixed(2), 500, y, { width: 59, align: "right" });
      y += 14;
    });

    if (!repair.services?.length) { doc.text("No services", 60, y); y += 14; }

    // Materials Table
    y += 10;
    doc.fontSize(12).text("Materials", 36, y); y += 10;
    doc.moveTo(36, y).lineTo(559, y).stroke(); y += 6;
    doc.fontSize(10);
    doc.text("#", 36, y);
    doc.text("Material", 60, y);
    doc.text("Cost", 500, y, { width: 59, align: "right" });
    y += 14;

    (repair.materials || []).forEach((m, i) => {
      doc.text(String(i + 1), 36, y);
      doc.text(m?.name ?? "—", 60, y);
      doc.text(Number(m?.cost || 0).toFixed(2), 500, y, { width: 59, align: "right" });
      y += 14;
    });

    if (!repair.materials?.length) { doc.text("No materials", 60, y); y += 14; }

    // Totals / breakdown
    const servicesSum = (repair.services || []).reduce((sum, s) => sum + (Number(s?.fee) || 0), 0);
    const materialsSum = (repair.materials || []).reduce((sum, m) => sum + (Number(m?.cost) || 0), 0);
    const sc = Number(repair.serviceCharge ?? SERVICE_CHARGE_DEFAULT);

    y += 10;
    doc.moveTo(400, y).lineTo(559, y).stroke(); y += 6;
    doc.fontSize(11);
    doc.text("Services Subtotal:", 400, y); doc.text(servicesSum.toFixed(2), 500, y, { width: 59, align: "right" }); y += 14;
    doc.text("Materials Subtotal:", 400, y); doc.text(materialsSum.toFixed(2), 500, y, { width: 59, align: "right" }); y += 14;
    doc.text("Service Charge:",     400, y); doc.text(sc.toFixed(2),          500, y, { width: 59, align: "right" }); y += 14;

    doc.moveTo(400, y).lineTo(559, y).stroke(); y += 6;
    doc.fontSize(12).text("Total:", 400, y);
    doc.text(Number(repair.totalAmount || (servicesSum + materialsSum + sc)).toFixed(2),
             500, y, { width: 59, align: "right" });
    y += 24;

    // Remarks + Terms
    doc.fontSize(11).text("Remarks:", 36, y); y += 14;
    doc.fontSize(10).fillColor("#444").text(repair.remarks || "-", 36, y, { width: 523 });
    y += 40;
    doc.fillColor("black").fontSize(11).text("Terms & Conditions", 36, y); y += 12;
    doc.fontSize(9).fillColor("#444").text(
      "Quotes are based on initial assessment and may vary after additional parts/tests. " +
      "Estimates are valid for 30 days. By leaving your item for repair, you authorize necessary tests and replacements.",
      36, y, { width: 523 }
    );

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};



