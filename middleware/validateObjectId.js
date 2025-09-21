


import mongoose from "mongoose";

export const validateObjectId = (param = "id") => (req, res, next) => {
  const id = req.params[param];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `Invalid ${param}` });
  }
  next();
};
