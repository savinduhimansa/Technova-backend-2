import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function adminAuth(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1]; // Get the token from the header

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded; // Attach the decoded user data

        // Check if the user role is 'admin'
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access forbidden. Not an admin." });
        }

        next(); // User is an admin, proceed to next
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Invalid token." });
    }
}