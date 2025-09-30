// controllers/productController.js
import mongoose from "mongoose";
import Product from "../models/product.js";
import PDFDocument from "pdfkit";

/* ---------------- RBAC helper ---------------- */
// Normalize role strings so these are treated the same:
// "inventoryManager", "inventory-manager", "inventory_manager" -> "inventorymanager"
function normalizeRole(r) {
  return String(r || "").toLowerCase().replace(/[\s_-]/g, "");
}
// Keep the allowed roles in normalized form
const INV_ROLES = ["admin", "inventorymanager"]; // central place to edit
function requireRole(req, res, roles = INV_ROLES) {
  // req.user is set by your global verifyJWT middleware
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthenticated" });
    return false;
  }
  const userRole = normalizeRole(req.user.role);
  const allowed = new Set((roles || []).map(normalizeRole));
  if (!allowed.has(userRole)) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return false;
  }
  return true;
}

/* --------------- shared helpers --------------- */
function normalizeBody(body = {}) {
  const normalized = { ...body };
  if (normalized.cost != null && normalized.labeledPrice == null) {
    normalized.labeledPrice = normalized.cost;
    delete normalized.cost;
  }
  return normalized;
}
function isObjectId(id) {
  return mongoose.isValidObjectId(id);
}
function buildFilterFromQuery(q = {}) {
  const { category, brand, search, productId, minPrice, maxPrice, inStock } = q;
  const filter = {};
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (productId) filter.productId = productId;

  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }

  if (typeof inStock === "string") {
    if (inStock.toLowerCase() === "true") filter.stock = { $gt: 0 };
    if (inStock.toLowerCase() === "false") filter.stock = { $lte: 0 };
  }

  if (search) {
    const rx = { $regex: search, $options: "i" };
    filter.$or = [{ name: rx }, { altNames: rx }];
  }
  return filter;
}

/* -------------------- CRUD -------------------- */

/** PROTECTED: Create */
export const createProduct = async (req, res) => {
  if (!requireRole(req, res)) return;
  try {
    const data = normalizeBody(req.body);
    const product = new Product(data);
    await product.save();
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const fields = Object.keys(error.keyPattern || {});
      return res
        .status(409)
        .json({ success: false, message: `Duplicate value for: ${fields.join(", ")}` });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

/** PUBLIC: List products for homepage & search (NO auth required) */
export const getProducts = async (req, res) => {
  try {
    const filter = buildFilterFromQuery(req.query);
    const products = await Product.find(filter);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PUBLIC: Get one product by _id OR productId (NO auth required) */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = isObjectId(id)
      ? await Product.findById(id)
      : await Product.findOne({ productId: id });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PROTECTED: Update */
export const updateProduct = async (req, res) => {
  if (!requireRole(req, res)) return;
  try {
    const { id } = req.params;
    const data = normalizeBody(req.body);
    const query = isObjectId(id) ? { _id: id } : { productId: id };

    const product = await Product.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const fields = Object.keys(error.keyPattern || {});
      return res
        .status(409)
        .json({ success: false, message: `Duplicate value for: ${fields.join(", ")}` });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

/** PROTECTED: Delete */
export const deleteProduct = async (req, res) => {
  if (!requireRole(req, res)) return;
  try {
    const { id } = req.params;
    const product = isObjectId(id)
      ? await Product.findByIdAndDelete(id)
      : await Product.findOneAndDelete({ productId: id });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PROTECTED: Set stock (absolute) */
export const updateStock = async (req, res) => {
  if (!requireRole(req, res)) return;
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity == null || Number(quantity) < 0) {
      return res.status(400).json({ success: false, message: "Invalid stock quantity" });
    }

    const query = isObjectId(id) ? { _id: id } : { productId: id };
    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.stock = Number(quantity);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ----------------- PDF REPORT ----------------- */
/** PROTECTED: inventory report remains restricted */
export const getProductsReportPdf = async (req, res) => {
  if (!requireRole(req, res)) return;
  try {
    const filter = buildFilterFromQuery(req.query);
    const products = await Product.find(filter).sort({ category: 1, name: 1 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="inventory-report.pdf"');

    const doc = new PDFDocument({ size: "A4", margin: 36 });
    doc.pipe(res);

    // Header
    doc
      .fontSize(18)
      .fillColor("#111")
      .text("TechNova • Inventory Report", { continued: true })
      .fillColor("#666")
      .fontSize(10)
      .text(`   ${new Date().toLocaleString()}`);
    doc.moveDown(0.5);

    // Filters summary
    doc.fontSize(10).fillColor("#444")
      .text(`Filters: ${Object.keys(req.query).length ? JSON.stringify(req.query) : "None"}`);
    doc.moveDown(0.5);

    // Table header
    const cols = [
      { key: "productId", label: "ID", width: 70 },
      { key: "name", label: "Name", width: 170, wrap: true },
      { key: "brand", label: "Brand", width: 80 },
      { key: "category", label: "Category", width: 90 },
      { key: "price", label: "Price", width: 60, align: "right" },
      { key: "stock", label: "Stock", width: 50, align: "right" },
    ];

    let x = doc.x, y = doc.y;
    const tableWidth = cols.reduce((s, c) => s + c.width, 0);
    doc.rect(x, y, tableWidth, 18).fill("#f2f3f5").fillColor("#000");
    cols.reduce((cx, c) => {
      doc.fontSize(10).text(c.label, cx + 4, y + 4, { width: c.width - 8, align: c.align || "left" });
      return cx + c.width;
    }, x);
    y += 18;

    doc.fillColor("#111");
    const lineH = 16;
    const maxY = doc.page.height - doc.page.margins.bottom - 30;

    const currency = (n) =>
      typeof n === "number"
        ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
        : "";

    const lineClamp = (text, maxWidth, maxLines = 2) => {
      const words = String(text || "").split(/\s+/);
      const out = [];
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        const width = doc.widthOfString(test, { size: 10 });
        if (width <= maxWidth) {
          line = test;
        } else {
          out.push(line || w);
          line = w;
          if (out.length === maxLines - 1) break;
        }
      }
      out.push(line);
      if (out.length > maxLines) out.length = maxLines;
      // ellipsis if truncated
      if (words.join(" ") !== out.join(" ")) {
        const last = out[maxLines - 1] || "";
        let ell = last + "…";
        while (doc.widthOfString(ell, { size: 10 }) > maxWidth && ell.length > 1) {
          ell = ell.slice(0, -2) + "…";
        }
        out[maxLines - 1] = ell;
      }
      return out;
    };

    for (const p of products) {
      const cells = {
        productId: p.productId ?? "",
        name: p.name ?? "",
        brand: p.brand ?? "",
        category: p.category ?? "",
        price: currency(p.price),
        stock: String(p.stock ?? ""),
      };

      let requiredHeight = lineH;
      const wrapped = {};

      cols.forEach((c) => {
        const text = String(cells[c.key] ?? "");
        if (c.wrap) {
          const lines = lineClamp(text, c.width - 8, 2);
          wrapped[c.key] = lines;
          requiredHeight = Math.max(requiredHeight, 4 + lines.length * 12);
        }
      });

      if (y + requiredHeight > maxY) {
        doc.addPage();
        y = doc.y;
      }

      // draw row
      let cx = x;
      cols.forEach((c) => {
        doc.fontSize(10).fillColor("#111");
        if (c.wrap && wrapped[c.key]) {
          const lines = wrapped[c.key];
          lines.forEach((ln, i) => {
            doc.text(ln, cx + 4, y + 3 + i * 12, {
              width: c.width - 8,
              align: c.align || "left",
            });
          });
        } else {
          doc.text(String(cells[c.key] ?? ""), cx + 4, y + 3, {
            width: c.width - 8,
            align: c.align || "left",
          });
        }
        cx += c.width;
      });

      y += requiredHeight;

      // row separator
      doc
        .moveTo(x, y - 2)
        .lineTo(x + tableWidth, y - 2)
        .strokeColor("#e9eaee")
        .lineWidth(0.5)
        .stroke();
    }

    // Footer
    doc.moveDown(1.2);
    doc.fontSize(10).fillColor("#444").text(`Total items: ${products.length}`);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* --------------- Low stock alerts --------------- */
/** PROTECTED: keep internal */
export const getLowStock = async (req, res) => {
  if (!requireRole(req, res)) return;
  try {
    const min = Number.isFinite(Number(req.query.min)) ? Number(req.query.min) : 5;
    const products = await Product.find({ stock: { $lt: min } })
      .select("productId name stock labeledPrice")
      .sort({ stock: 1 })
      .lean();

    res.status(200).json({
      success: true,
      min,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
