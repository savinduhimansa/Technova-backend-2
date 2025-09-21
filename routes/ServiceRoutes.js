





import express from "express";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/ServiceController.js";
import serviceMiddle from "../middleware/Servicemiddle.js";   // <- default import
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.route("/")
  .get(getServices)
  .post(serviceMiddle, createService);

router.route("/:id")
  .put(validateObjectId("id"), serviceMiddle, updateService)
  .delete(validateObjectId("id"), deleteService);

export default router;
