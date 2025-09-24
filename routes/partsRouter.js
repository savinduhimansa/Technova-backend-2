// routes/partsRouter.js
import express from "express";
import verifyJWT from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";

import { verifyBuild } from "../controllers/partsController/verifyController.js";
import { getRamCompatible, createRam, updateRam, deleteRam } from "../controllers/partsController/ramController.js";
import { getCaseCompatible, createCase, updateCase, deleteCase } from "../controllers/partsController/caseController.js";
import { getCpu, createCpu, updateCpu, deleteCpu } from "../controllers/partsController/cpuController.js";
import { getGpu, createGpu, updateGpu, deleteGpu } from "../controllers/partsController/gpuController.js";
import { getMotherboardCompatible, createMotherboard, updateMotherboard, deleteMotherboard } from "../controllers/partsController/motherboardController.js";

import {
  quoteBuild, createBuild, getBuild,
  listMyBuilds, submitBuild,
  adminListBuilds, adminUpdateBuild, adminDeleteBuild,
  // NEW:
  getBuildPdf, purchaseBuild
} from "../controllers/partsController/buildController.js";

import { getSsd, createSsd, updateSsd, deleteSsd } from "../controllers/partsController/ssdController.js";
import { getHdd, createHdd, updateHdd, deleteHdd } from "../controllers/partsController/hddController.js";
import { getPsu, createPsu, updatePsu, deletePsu } from "../controllers/partsController/psuController.js";
import { getFan, createFan, updateFan, deleteFan } from "../controllers/partsController/fanController.js";

const partsRouter = express.Router();

/* ------------------------------ PUBLIC READ ------------------------------- */
partsRouter.get("/cpus", getCpu); // supports ?brand=AMD|Intel
partsRouter.get("/gpus", getGpu);
partsRouter.get("/motherboards/compatible", getMotherboardCompatible);
partsRouter.get("/rams/compatible", getRamCompatible);
partsRouter.get("/cases/compatible", getCaseCompatible);
partsRouter.get("/ssds", getSsd);
partsRouter.get("/hdds", getHdd);
partsRouter.get("/psus", getPsu);
partsRouter.get("/fans", getFan);
partsRouter.post("/builds/verify", verifyBuild);

// NEW: live quote without saving
partsRouter.post("/builds/quote", quoteBuild);

partsRouter.get("/builds/:buildId", getBuild);

/* ------------------------------ AUTH NEEDED ------------------------------- */
// everything below requires JWT
partsRouter.use(verifyJWT);

// Save a draft build
partsRouter.post("/builds", createBuild);

// List my builds
partsRouter.get("/my/builds", listMyBuilds);

// Submit a draft for admin approval
partsRouter.post("/builds/:buildId/submit", submitBuild);

// NEW: download build as PDF
partsRouter.get("/builds/:buildId/pdf", getBuildPdf);

// NEW: mark approved build as purchased
partsRouter.patch("/builds/:buildId/purchase", purchaseBuild);

/* ------------------------------ ADMIN CRUD ------------------------------- */
partsRouter.get("/admin/builds", isAdmin, adminListBuilds);
partsRouter.put("/admin/builds/:buildId", isAdmin, adminUpdateBuild);
partsRouter.delete("/admin/builds/:buildId", isAdmin, adminDeleteBuild);

/* ------------------------------ CRUD (parts) ------------------------------- */
// protect create/update/delete under admin
partsRouter.post("/cpus", isAdmin, createCpu);
partsRouter.put("/cpus/:productId", isAdmin, updateCpu);
partsRouter.delete("/cpus/:productId", isAdmin, deleteCpu);

partsRouter.post("/motherboards", isAdmin, createMotherboard);
partsRouter.put("/motherboards/:productId", isAdmin, updateMotherboard);
partsRouter.delete("/motherboards/:productId", isAdmin, deleteMotherboard);

partsRouter.post("/rams", isAdmin, createRam);
partsRouter.put("/rams/:productId", isAdmin, updateRam);
partsRouter.delete("/rams/:productId", isAdmin, deleteRam);

partsRouter.post("/gpus", isAdmin, createGpu);
partsRouter.put("/gpus/:productId", isAdmin, updateGpu);
partsRouter.delete("/gpus/:productId", isAdmin, deleteGpu);

partsRouter.post("/cases", isAdmin, createCase);
partsRouter.put("/cases/:productId", isAdmin, updateCase);
partsRouter.delete("/cases/:productId", isAdmin, deleteCase);

partsRouter.post("/ssds", isAdmin, createSsd);
partsRouter.put("/ssds/:productId", isAdmin, updateSsd);
partsRouter.delete("/ssds/:productId", isAdmin, deleteSsd);

partsRouter.post("/hdds", isAdmin, createHdd);
partsRouter.put("/hdds/:productId", isAdmin, updateHdd);
partsRouter.delete("/hdds/:productId", isAdmin, deleteHdd);

partsRouter.post("/psus", isAdmin, createPsu);
partsRouter.put("/psus/:productId", isAdmin, updatePsu);
partsRouter.delete("/psus/:productId", isAdmin, deletePsu);

partsRouter.post("/fans", isAdmin, createFan);
partsRouter.put("/fans/:productId", isAdmin, updateFan);
partsRouter.delete("/fans/:productId", isAdmin, deleteFan);

export default partsRouter;
