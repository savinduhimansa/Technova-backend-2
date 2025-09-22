// routes/productRoutes.js
import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
} from "../controllers/productController.js";

const router = express.Router();

/**
 * NOTE: Your server mounts this router at "/api/product"
 * in index.js: app.use("/api/product", productRouter)
 * So final paths are like /api/product, /api/product/:id, etc.
 */

// Create (admin or inventoryManager)
router.post("/", createProduct);

// List (public)
router.get("/", getProducts);

// Get one (public)
router.get("/:id", getProductById);

// Update (admin or inventoryManager)
router.put("/:id", updateProduct);

// Delete (admin or inventoryManager)
router.delete("/:id", deleteProduct);

// Set stock (admin or inventoryManager)
router.patch("/:id/stock", updateStock);

export default router;
