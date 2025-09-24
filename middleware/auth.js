import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function verifyJWT(req, res, next) {
  const header = req.header("Authorization");
  if (!header) return next();

  const token = header.replace("Bearer ", "");
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (!err && decoded) {
      // normalize an `id` property no matter how your token is shaped
      const id = decoded.id || decoded._id || decoded.userId || decoded.sub || null;
      req.user = { ...decoded, id };
    }
    // important: call next AFTER verify finishes so req.user is ready
    return next();
  });
}
