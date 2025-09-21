// controllers/productController.js
import mongoose from "mongoose";
import Product from "../models/product.js";

/** Helper: normalize incoming body (map legacy 'cost' -> 'labeledPrice') */
function normalizeBody(body = {}) {
  const normalized = { ...body };
  if (normalized.cost != null && normalized.labeledPrice == null) {
    normalized.labeledPrice = normalized.cost;
    delete normalized.cost;
  }
  return normalized;
}

/** Helper: is string a valid Mongo ObjectId? */
function isObjectId(id) {
  return mongoose.isValidObjectId(id);
}

// ✅ Create a new product
export const createProduct = async (req, res) => {
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
    // Friendly duplicate key handling
    if (error?.code === 11000) {
      const fields = Object.keys(error.keyPattern || {});
      return res
        .status(409)
        .json({ success: false, message: `Duplicate value for: ${fields.join(", ")}` });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get all products (filters: category, brand, search, productId, minPrice, maxPrice, inStock)
export const getProducts = async (req, res) => {
  try {
    const { category, brand, search, productId, minPrice, maxPrice, inStock } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (productId) filter.productId = productId;

    // Price range (optional)
    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = Number(minPrice);
      if (maxPrice != null) filter.price.$lte = Number(maxPrice);
    }

    // In stock only (optional): ?inStock=true
    if (typeof inStock === "string") {
      if (inStock.toLowerCase() === "true") filter.stock = { $gt: 0 };
      if (inStock.toLowerCase() === "false") filter.stock = { $lte: 0 };
    }

    // Search by name or altNames (case-insensitive substring)
    if (search) {
      const rx = { $regex: search, $options: "i" };
      filter.$or = [{ name: rx }, { altNames: rx }];
    }

    const products = await Product.find(filter);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get single product by ID (accepts Mongo _id OR business productId)
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

// ✅ Update a product (by Mongo _id OR business productId)
export const updateProduct = async (req, res) => {
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

// ✅ Delete a product (by Mongo _id OR business productId)
export const deleteProduct = async (req, res) => {
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

// ✅ Update stock (absolute set) — by Mongo _id OR business productId
export const updateStock = async (req, res) => {
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
