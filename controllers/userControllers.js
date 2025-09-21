import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// ✅ Register new user
export const registerUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role, password, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    // Hash the password
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ Generate unique numeric userId safely
const lastUser = await User.findOne({ userId: { $type: "number" } }).sort({ userId: -1 });
const newUserId = lastUser && typeof lastUser.userId === "number" ? lastUser.userId + 1 : 1000;

const user = new User({
  userId: newUserId,
  email,
  firstName,
  lastName,
  role: role || "user",
  password: hashedPassword,
  phone,
});


    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
};


// ✅ Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      "random456", // 🔑 same secret as in auth.js
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

// ✅ List all users (admin only)
export const listUsers = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can view users" });
  }

  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};
