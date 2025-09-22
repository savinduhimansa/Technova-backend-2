// routes/supplierRoutes.js
import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  setSupplierBalance,
  addSupplierPayment,
} from "../controllers/supplierController.js"; // keep this path if your folder is named "controller"

const router = express.Router();

/**
 * CRUD
 */
router.post("/", createSupplier);      // Create
router.get("/", getSuppliers);         // List (with filters via query)
router.get("/:id", getSupplierById);   // Read one (by Mongo _id or supplierId)
router.put("/:id", updateSupplier);    // Update
router.delete("/:id", deleteSupplier); // Delete

/**
 * Finance helpers
 */
router.patch("/:id/balance", setSupplierBalance); // Set absolute balance
router.post("/:id/payments", addSupplierPayment); // Add a payment (increments `payments`)

export default router;
