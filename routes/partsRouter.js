import express from "express";
import {
  // READ
  getCaseCompatible, getCpu, getGpu, getMotherboardCompatible, getRamCompatible, verifyBuild,
  // CRUD
  createCpu, updateCpu, deleteCpu,
  createMotherboard, updateMotherboard, deleteMotherboard,
  createRam, updateRam, deleteRam,
  createGpu, updateGpu, deleteGpu,
  createCase, updateCase, deleteCase
} from "../controllers/partsController.js";

const partsRouter = express.Router();

/* ------------------------------ READ ------------------------------- */
partsRouter.get("/cpus", getCpu);
partsRouter.get("/gpus", getGpu);
partsRouter.get("/motherboards/compatible", getMotherboardCompatible);
partsRouter.get("/rams/compatible", getRamCompatible);
partsRouter.get("/cases/compatible", getCaseCompatible);
partsRouter.post("/builds/verify", verifyBuild);

/* ------------------------------ CRUD ------------------------------- */
// CPUs
partsRouter.post("/cpus", createCpu);
partsRouter.put("/cpus/:productId", updateCpu);
partsRouter.delete("/cpus/:productId", deleteCpu);

// Motherboards
partsRouter.post("/motherboards", createMotherboard);
partsRouter.put("/motherboards/:productId", updateMotherboard);
partsRouter.delete("/motherboards/:productId", deleteMotherboard);

// RAM
partsRouter.post("/rams", createRam);
partsRouter.put("/rams/:productId", updateRam);
partsRouter.delete("/rams/:productId", deleteRam);

// GPUs
partsRouter.post("/gpus", createGpu);
partsRouter.put("/gpus/:productId", updateGpu);
partsRouter.delete("/gpus/:productId", deleteGpu);

// Cases
partsRouter.post("/cases", createCase);
partsRouter.put("/cases/:productId", updateCase);
partsRouter.delete("/cases/:productId", deleteCase);

export default partsRouter;
