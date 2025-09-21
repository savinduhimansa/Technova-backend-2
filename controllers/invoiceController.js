import PDFDocument from "pdfkit";
import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";

export const generateInvoice = async (req, res) => {
  // Only admin / salesmanager can generate
  if (!req.user || !["admin", "salesmanager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  try {
    // Load order with product details
    const order = await Order.findById(req.params.orderId).populate("products.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["Confirmed", "Completed"].includes(order.status)) {
      return res.status(400).json({ message: "Only Confirmed/Completed orders can be invoiced" });
    }

    // Build invoice payload
    const count = await Invoice.countDocuments();
    const invoiceID = `INV-${String(count + 1).padStart(3, "0")}`;

    const lines = order.products.map((p) => {
      const unitPrice = Number(p?.product?.price || 0);
      const qty = Number(p?.quantity || 0);
      const discount = Number(p?.discount || 0);
      const lineTotal = unitPrice * qty * (1 - discount / 100);

      return {
        product: p.product?._id,
        name: p.product?.name || "Product",
        quantity: qty,
        unitPrice,
        discount,
        totalPrice: lineTotal,
      };
    });

    const total = lines.reduce((s, r) => s + r.totalPrice, 0);

    // Persist invoice
    const invoice = await Invoice.create({
      invoiceID,
      orderId: order._id,
      customerName: order.customerName,
      phoneNumber: order.phoneNumber,
      products: lines.map(({ product, quantity, unitPrice, discount, totalPrice }) => ({
        product, quantity, unitPrice, discount, totalPrice,
      })),
      totalPrice: total,
      paymentMethod: order.paymentMethod,
      status: order.status,
    });

    // ===== PDF =====
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Stream headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${invoiceID}.pdf`);

    // Handle stream errors (avoid server crash)
    let streamErrored = false;
    doc.on("error", (err) => {
      streamErrored = true;
      if (!res.headersSent) {
        res.status(500).json({ message: "PDF stream error", error: err.message });
      }
      try { res.end(); } catch {}
    });

    // Pipe to response
    doc.pipe(res);

    // Helpers
    const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
    const hr = (x1, x2, y, color = "#E5E7EB") =>
      doc.strokeColor(color).moveTo(x1, y).lineTo(x2, y).stroke();
    const label = (t, v, x, y) => {
      doc.fontSize(9).fillColor("#6B7280").text(t, x, y);
      doc.fontSize(11).fillColor("#111827").text(v, x, y + 12);
    };

    // Header band
    doc.rect(0, 0, doc.page.width, 90).fill("#111827");
    doc
      .fillColor("#FFFFFF")
      .fontSize(22)
      .text("TechNova", 50, 28, { width: 250 });
    doc
      .fontSize(10)
      .fillColor("#93C5FD")
      .text("Smart Solutions for Modern Retail", 50, 56, { width: 300 });
    doc
      .fillColor("#FFFFFF")
      .fontSize(24)
      .text("INVOICE", 0, 30, { width: doc.page.width - 50, align: "right" });

    // Meta
    doc.fillColor("#111827");
    let y = 110;
    label("Invoice ID", invoice.invoiceID, 50, y);
    label("Order ID", order.orderID, 220, y);
    label("Date", new Date(invoice.createdAt || Date.now()).toLocaleDateString(), 390, y);

    // Separator
    y += 42;
    hr(50, 545, y);

    // Bill To + spacing (your request)
    y += 14;
    doc.fontSize(12).fillColor("#111827").text("Bill To", 50, y);
    y += 16; // extra spacing between “Bill To” and “Customer details”
    doc.fontSize(9).fillColor("#6B7280").text("Customer details", 50, y);
    y += 18;

    doc.fontSize(11).fillColor("#111827").text(order.customerName || "-", 50, y);
    doc
      .fontSize(10)
      .fillColor("#374151")
      .text(`Phone: ${order.phoneNumber || "-"}`, 50, y + 16)
      .text(`Address: ${order.address || "-"}`, 50, y + 30, { width: 300 });

    // Table
    y += 70;
    const x = 50;

    // ↓↓↓ Narrowed Product column; widened Discount & Total (your request)
    const colSpec = [
      { key: "name",       title: "Product", width: 200, align: "left"  }, // reduced from ~260
      { key: "quantity",   title: "Qty",     width: 60,  align: "right" },
      { key: "unitPrice",  title: "Unit",    width: 90,  align: "right" },
      { key: "discount",   title: "Disc",    width: 80,  align: "right" }, // more space
      { key: "totalPrice", title: "Total",   width: 115, align: "right" }, // more space
    ];

    const colX = colSpec.map((_, i) =>
      x + colSpec.slice(0, i).reduce((s, c) => s + c.width, 0)
    );
    const tableWidth = colSpec.reduce((s, c) => s + c.width, 0);

    // Header
    doc.rect(x, y, tableWidth, 28).fill("#1F2937");
    doc.fillColor("#FFFFFF").fontSize(11);
    colSpec.forEach((col, i) => {
      doc.text(col.title, colX[i] + 8, y + 8, {
        width: col.width - 16,
        align: col.align,
      });
    });
    y += 28;
    doc.fillColor("#111827");

    // Rows (with simple page-break handling)
    const rowH = 26;
    const bottomLimit = doc.page.height - 160; // leave space for totals/footer

    const printRow = (row, idx) => {
      // Add page if needed
      if (y + rowH > bottomLimit) {
        // Draw bottom rule of prior page
        hr(x, x + tableWidth, y);
        doc.addPage();
        // Reprint header on new page
        y = 50;
        doc.rect(x, y, tableWidth, 28).fill("#1F2937");
        doc.fillColor("#FFFFFF").fontSize(11);
        colSpec.forEach((col, i) => {
          doc.text(col.title, colX[i] + 8, y + 8, { width: col.width - 16, align: col.align });
        });
        y += 28;
        doc.fillColor("#111827");
      }

      const bg = idx % 2 === 0 ? "#F9FAFB" : "#FFFFFF";
      doc.rect(x, y, tableWidth, rowH).fill(bg);

      doc.fillColor("#111827").fontSize(10);
      colSpec.forEach((col, i) => {
        let val = row[col.key];
        if (col.key === "unitPrice" || col.key === "totalPrice") val = fmt(val);
        if (col.key === "discount") val = `${Number(val || 0)}%`;
        doc.text(String(val ?? ""), colX[i] + 8, y + 8, {
          width: col.width - 16,
          align: col.align,
          ellipsis: true,
        });
      });

      // Column dividers
      doc.strokeColor("#E5E7EB");
      for (let i = 1; i < colSpec.length; i++) {
        const cx = colX[i];
        doc.moveTo(cx, y).lineTo(cx, y + rowH).stroke();
      }

      y += rowH;
    };

    lines.forEach((row, idx) => printRow(row, idx));

    // Bottom rule under last row
    hr(x, x + tableWidth, y);

    // Totals panel
    y += 20;
    const panelW = 240;
    const panelX = x + tableWidth - panelW;
    doc.rect(panelX, y, panelW, 92).fill("#F3F4F6");
    doc.fillColor("#111827").fontSize(11);

    const subTotal = lines.reduce((s, r) => s + r.unitPrice * r.quantity, 0);
    const discountSum = subTotal - total;

    const rightLine = (labelTxt, valueTxt, yy, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").text(labelTxt, panelX + 12, yy);
      doc.text(valueTxt, panelX + 12, yy, { width: panelW - 24, align: "right" });
    };

    rightLine("Subtotal", fmt(subTotal), y + 10);
    rightLine("Discounts", `- ${fmt(discountSum)}`, y + 30);
    hr(panelX + 12, panelX + panelW - 12, y + 52, "#D1D5DB");
    rightLine("Total", fmt(total), y + 60, true);

    // Footer
    y += 120;
    doc
      .fontSize(10)
      .fillColor("#6B7280")
      .text("Note: Please retain this invoice for your records.", 50, y);
    doc
      .fontSize(10)
      .fillColor("#9CA3AF")
      .text("Thank you for your business!", 0, doc.page.height - 50, {
        align: "center",
      });

    // End stream
    doc.end();

    // If the stream failed, don't try to use the response again
    if (streamErrored) return;
  } catch (err) {
    // If PDF already started streaming, we cannot send JSON. Let the stream error handler handle it.
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating invoice", error: err.message });
    }
  }
};

export const listInvoices = async (req, res) => {
  if (!req.user || !["admin", "salesmanager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  try {
    const invoices = await Invoice.find()
      .populate("orderId")
      .populate("products.product")
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Error fetching invoices", error: err.message });
  }
};
