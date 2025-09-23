// controllers/buildRequestController.js
import BuildRequest from "../models/buildRequest.js";

// USER: submit a build (from client preview or created build)
export async function submitBuildRequest(req, res) {
  try {
    const { build, user } = req.body; // build = the preview or saved Build doc
    if (!build) {
      return res.status(400).json({ ok: false, message: "build is required" });
    }

    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const doc = await BuildRequest.create({
      requestId,
      build,
      user: user || {}
    });

    res.status(201).json({ ok: true, requestId: doc.requestId, request: doc });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// USER: get my requests (simplified; filter by req.user if you have auth)
export async function listMyBuildRequests(req, res) {
  try {
    // If you have auth: const userId = req.user?.id; and filter by that
    const requests = await BuildRequest.find().sort({ createdAt: -1 });
    res.json({ items: requests });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ADMIN: list all requests
export async function adminListBuildRequests(req, res) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await BuildRequest.find(filter).sort({ createdAt: -1 });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ADMIN: update status/notes (approve/reject/etc.)
export async function adminUpdateBuildRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { status, adminNotes } = req.body;

    const update = {};
    if (status) update.status = status;
    if (typeof adminNotes === "string") update.adminNotes = adminNotes;

    const doc = await BuildRequest.findOneAndUpdate(
      { requestId },
      { $set: update },
      { new: true }
    );

    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, request: doc });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ADMIN: delete request
export async function adminDeleteBuildRequest(req, res) {
  try {
    const { requestId } = req.params;
    const doc = await BuildRequest.findOneAndDelete({ requestId });
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, deleted: doc.requestId });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
