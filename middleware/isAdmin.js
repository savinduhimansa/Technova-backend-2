// middleware/isAdmin.js
export default function isAdmin(req, res, next) {
  try {
    // verifyJWT should have set req.user
    // Expecting a token payload like { id, email, role: 'user'|'admin' }
    if (req.user?.role === "admin") return next();
    return res.status(403).json({ ok: false, message: "Admin only" });
  } catch {
    return res.status(403).json({ ok: false, message: "Admin only" });
  }
}
