/*import jwt from "jsonwebtoken";

export default function verifyJWT(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // 🔧 CHANGE: accept userId OR staffId OR id OR _id
    const id = decoded.userId ?? decoded.staffId ?? decoded.id ?? decoded._id;
    if (!id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // keep your existing shape
    req.user = { id, role: decoded.role };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}*/

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function verifyJWT (req, res, next) {
  const header = req.header("Authorization");
  if(header != null){
    const token = header.replace("Bearer ","");
    jwt.verify(token,process.env.JWT_KEY,(err,decoded) => {
      //console.log(decoded);
      if(decoded != null){
        req.user = decoded;
      }
    });
  }
  next();
}