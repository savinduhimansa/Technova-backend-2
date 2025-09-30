import express from "express";
import {
  createBuild,
  getBuilds,
  updateBuild,
  deleteBuild,
  updateBuildStatus
} from "../controllers/buildController.js";

const router = express.Router();

router.post("/", createBuild);            // Customer: create build
router.get("/", getBuilds);               // Admin: see all builds
router.put("/:id", updateBuild);          // Customer: update (pending only)
router.delete("/:id", deleteBuild);       // Customer: delete (pending only)
router.put("/:id/status", updateBuildStatus); // Admin: approve/reject

export default router;
