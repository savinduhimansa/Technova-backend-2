// routes/buildRequestRouter.js
import express from "express";
import {
  submitBuildRequest,
  listMyBuildRequests,
  adminListBuildRequests,
  adminUpdateBuildRequest,
  adminDeleteBuildRequest
} from "../controllers/buildRequestController.js";
import verifyJWT from "../middleware/auth.js"; // if you want to protect

const r = express.Router();

// user
r.post("/submit", submitBuildRequest);
r.get("/mine", listMyBuildRequests);

// admin (protect if needed: r.use(verifyJWT))
r.get("/admin", adminListBuildRequests);
r.patch("/admin/:requestId", adminUpdateBuildRequest);
r.delete("/admin/:requestId", adminDeleteBuildRequest);

export default r;
