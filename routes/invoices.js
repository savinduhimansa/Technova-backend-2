import express from "express";
import { generateInvoice, listInvoices } from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/:orderId", generateInvoice);
router.get("/", listInvoices);

export default router;
