// routes/productRoutes.js
import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductsReportPdf,
  getLowStock,   
} from "../controllers/productController.js"; // ✅ corrected path

const productRouter = express.Router();

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @body    { productId, name, brand, category, price, labeledPrice|cost, description, images?, stock, altNames? }
 */
productRouter.post("/", createProduct);

/**
 * @route   GET /api/products
 * @desc    List products with optional filters:
 *          ?category=&brand=&search=&productId=&minPrice=&maxPrice=&inStock=true|false
 */
productRouter.get("/", getProducts);

productRouter.get("/report/pdf", getProductsReportPdf); 
productRouter.get("/low-stock", getLowStock);


/**
 * @route   GET /api/products/:id
 * @desc    Get one product by Mongo _id OR business productId
 * @param   :id = 66f... (ObjectId) OR PROD-0001 (string)
 */
productRouter.get("/:id", getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product by Mongo _id OR business productId
 * @body    accepts legacy { cost } which will be mapped to { labeledPrice }
 */
productRouter.put("/:id", updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product by Mongo _id OR business productId
 */
productRouter.delete("/:id", deleteProduct);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Set stock (absolute) by Mongo _id OR business productId
 * @body    { quantity: number >= 0 }
 */
productRouter.patch("/:id/stock", updateStock);

export default productRouter;
