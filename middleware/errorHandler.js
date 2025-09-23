export const notFound = (req, res, next) => {
  res.status(404).json({ message: `🔍 Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};