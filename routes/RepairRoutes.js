



// import express from "express";
// import {
//   createRepair,
//   getRepairs,
//   getRepairById,
//   updateRepair,
//   deleteRepair,
//    downloadInvoicePdf,
// } from "../controllers/RepairController.js";
// import { validateObjectId } from "../middleware/validateObjectId.js";


// const router = express.Router();


// router.route("/")
//   .get(getRepairs)
//   .post(createRepair);

// router.route("/:id")
//   .get(validateObjectId("id"), getRepairById)
//   .put(validateObjectId("id"), updateRepair)
//   .delete(validateObjectId("id"), deleteRepair);

//   // Invoice PDF
// router.get("/:id/pdf", validateObjectId("id"), downloadInvoicePdf);


// export default router;



// routes/repairRoutes.js
import express from "express";
import {
  createRepair,
  getRepairs,
  getRepairById,
  updateRepair,
  deleteRepair,
  downloadInvoicePdf,
} from "../controllers/RepairController.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.route("/")
  .get(getRepairs)
  .post(createRepair);

router.route("/:id")
  .get(validateObjectId("id"), getRepairById)
  .put(validateObjectId("id"), updateRepair)
  .delete(validateObjectId("id"), deleteRepair);

// Invoice PDF
router.get("/:id/pdf", validateObjectId("id"), downloadInvoicePdf);

export default router;

