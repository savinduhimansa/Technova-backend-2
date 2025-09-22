// controllers/supplierController.js
import mongoose from "mongoose";
import Supplier from "../models/suppliers.js";

/* ---------- Role gate (controller-level) ---------- */
function deny(res, code, message) {
  return res.status(code).json({ success: false, message });
}
function requireInventoryAccess(req, res) {
  // must have a verified user attached by verifyJWT
  const user = req.user;
  if (!user || !user.role) {
    deny(res, 401, "Unauthorized: missing or invalid token.");
    return false;
  }
  const role = String(user.role).toLowerCase();
  // allow admin and inventory-manager (support a few common spellings)
  const allowed = new Set(["admin", "inventory-manager", "inventory_manager"]);
  if (!allowed.has(role)) {
    deny(res, 403, "Forbidden: admin or inventory manager only.");
    return false;
  }
  return true;
}

/** Helper: is string a valid Mongo ObjectId? */
function isObjectId(id) {
  return mongoose.isValidObjectId(id);
}

// ✅ Create a new supplier
export const createSupplier = async (req, res) => {
  if (!requireInventoryAccess(req, res)) return;
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
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

// ✅ Get suppliers (filters: supplierId, search, min/max for balance & payments)
export const getSuppliers = async (req, res) => {
  if (!requireInventoryAccess(req, res)) return;
  try {
    const {
      supplierId,
      search,            // matches supplierName | email | contactNo | address
      minBalance,
      maxBalance,
      minPayments,
      maxPayments,
    } = req.query;

    const filter = {};

    if (supplierId) filter.supplierId = supplierId;

    // search across common text fields
    if (search) {
      const rx = { $regex: search, $options: "i" };
      filter.$or = [
        { supplierName: rx },
        { email: rx },
        { contactNo: rx },
        { address: rx },
      ];
    }

    // numeric ranges
    if (minBalance != null || maxBalance != null) {
      filter.balance = {};
      if (minBalance != null) filter.balance.$gte = Number(minBalance);
      if (maxBalance != null) filter.balance.$lte = Number(maxBalance);
    }
    if (minPayments != null || maxPayments != null) {
      filter.payments = {};
      if (minPayments != null) filter.payments.$gte = Number(minPayments);
      if (maxPayments != null) filter.payments.$lte = Number(maxPayments);
    }

    const suppliers = await Supplier.find(filter).sort({ supplierName: 1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get single supplier by Mongo _id OR business supplierId
export const getSupplierById = async (req, res) => {
  if (!requireInventoryAccess(req, res)) return;
  try {
    const { id } = req.params;

    const supplier = isObjectId(id)
      ? await Supplier.findById(id)
      : await Supplier.findOne({ supplierId: id });

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update supplier (by Mongo _id OR business supplierId)
export const updateSupplier = async (req, res) => {
  if (!requireInventoryAccess(req, res)) return;
  try {
    const { id } = req.params;
    const query = isObjectId(id) ? { _id: id } : { supplierId: id };

    const supplier = await Supplier.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
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

// ✅ Delete supplier (by Mongo _id OR business supplierId)
export const deleteSupplier = async (req, res) => {
  if (!requireInventoryAccess(req, res)) return;
  try {
    const { id } = req.params;

    const supplier = isObjectId(id)
      ? await Supplier.findByIdAndDelete(id)
      : await Supplier.findOneAndDelete({ supplierId: id });

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    res.status(200).json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------- Optional focused endpoints (handy for finance flows) ---------- */

// ✅ Set absolute balance
export const setSupplierBalance = async (req, res) => {
  if (!requireInventoryAccess(req, res)) return;
  try {
    const { id } = req.params;
    const { balance } = req.body;
    if (balance == null || !Number.isFinite(Number(balance))) {
      return res.status(400).json({ success: false, message: "Invalid balance" });
    }

    const query = isObjectId(id) ? { _id: id } : { supplierId: id };
    const supplier = await Supplier.findOne(query);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    supplier.balance = Number(balance);
    await supplier.save();

    res.status(200).json({
      success: true,
      message: "Balance updated successfully",
      data: supplier,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Add a payment
export const addSupplierPayment = async (req, res) => {
  if (!requireInventoryAccess(req, res)) return;
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount == null || Number(amount) < 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    const query = isObjectId(id) ? { _id: id } : { supplierId: id };
    const supplier = await Supplier.findOne(query);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    supplier.payments = Number(supplier.payments || 0) + Number(amount);

    // If you also want to reduce balance by payment, uncomment next line:
    // supplier.balance = Number(supplier.balance || 0) - Number(amount);

    await supplier.save();

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      data: supplier,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
