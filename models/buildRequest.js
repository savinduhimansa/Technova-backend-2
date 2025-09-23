// models/buildRequest.js
import mongoose from "mongoose";

const buildRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, unique: true, required: true }, // e.g., REQ-...
    user: {
      userId: String,
      name: String,
      email: String
    },
    build: { type: mongoose.Schema.Types.Mixed, required: true }, // snapshot of the chosen build
    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected", "purchased"],
      default: "submitted"
    },
    adminNotes: String
  },
  { timestamps: true }
);

const BuildRequest = mongoose.model("build_requests", buildRequestSchema);
export default BuildRequest;
