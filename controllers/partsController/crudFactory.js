// controllers/crudFactory.js
export const createOrBulk = (Model) => async (req, res) => {
  try {
    const payload = req.body;

    // BULK
    if (Array.isArray(payload)) {
      const docs = await Model.insertMany(payload, { ordered: false });
      return res.status(201).json({
        ok: true,
        message: `Inserted ${docs.length} item(s)`,
        count: docs.length,
        ids: docs.map((d) => d.productId || String(d._id)),
      });
    }

    // SINGLE  (NOTE: defaults like images[] will be applied automatically)
    const doc = await Model.create(payload);
    return res.status(201).json({
      ok: true,
      message: `${Model.modelName} ${doc.productId || String(doc._id)} created`,
      id: doc.productId || String(doc._id),
    });
  } catch (err) {
    // Partial success for bulk (some duplicates, etc.)
    if (Array.isArray(req.body) && err?.writeErrors?.length) {
      return res.status(207).json({
        ok: false,
        message: "Partial success inserting items",
        failed: err.writeErrors.map((e) => ({
          index: e.index,
          code: e.code || e.err?.code,
          keyValue: e.keyValue || e.err?.keyValue,
          errmsg: e.errmsg || e.err?.errmsg,
        })),
      });
    }
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ ok: false, message: "Duplicate key", keyValue: err.keyValue });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({
        ok: false,
        message: "Validation error",
        errors: Object.fromEntries(
          Object.entries(err.errors).map(([k, v]) => [k, v.message])
        ),
      });
    }
    return res.status(500).json({ ok: false, message: err.message });
  }
};

export const updateByProductId = (Model) => async (req, res) => {
  try {
    const { productId } = req.params;
    const doc = await Model.findOneAndUpdate(
      { productId },
      { $set: req.body },
      {
        new: true,
        runValidators: true,   // <-- enforce enum/required on update
        context: "query"       // <-- required for some validators to work on findOneAndUpdate
      }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    // surface validation errors consistently on update
    if (err?.name === "ValidationError") {
      return res.status(400).json({
        ok: false,
        message: "Validation error",
        errors: Object.fromEntries(
          Object.entries(err.errors).map(([k, v]) => [k, v.message])
        ),
      });
    }
    res.status(500).json({ message: err.message });
  }
};

export const deleteByProductId = (Model) => async (req, res) => {
  try {
    const { productId } = req.params;
    const doc = await Model.findOneAndDelete({ productId });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true, deleted: doc.productId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
