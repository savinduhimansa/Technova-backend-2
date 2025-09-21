import express from "express";


import {
    saveUser,
    loginUser,
    getAllUsers,
    addUser,
    getById,
    updateUser,
    deleteUser,
     verifyOTP, 
    saveStaff,
    loginStaff,
    getAllStaff,
    addStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    // saveAdmin,
    // loginAdmin,
    // getAllAdmins,
    // addAdmin,
    // getAdminById,
    // updateAdmin,
    // deleteAdmin
} from "../controllers/userControllers.js";
import { adminAuth } from '../middleware/authMiddleware.js';
import {
    toggleStaffStatus, 
    toggleUserStatus
} from "../controllers/userControllers.js";

import { forgotPassword, resetPassword } from "../controllers/userControllers.js";

import { logout } from '../controllers/userControllers.js';

const userRouters = express.Router();

userRouters.post('/logout', logout);

// User Routes
userRouters.post("/user/register", saveUser); 
userRouters.post("/user/login", loginUser);
userRouters.post("/user/verify-otp", verifyOTP); 

// Staff Routes
userRouters.post("/staff", saveStaff);
userRouters.post("/staff/login", loginStaff);

// Admin Routes
// userRouters.post("/admin", saveAdmin); 
// userRouters.post("/admin/login", loginAdmin);
userRouters.get('/admindashboard', adminAuth, (req, res) => {
    res.status(200).send("Welcome to the Admin Dashboard!");
});



// User Management Routes
userRouters.get('/user', adminAuth, getAllUsers); 
userRouters.post("/user/add", adminAuth, addUser);
userRouters.get("/user/:id", adminAuth, getById);
userRouters.put("/user/:id", adminAuth, updateUser);
userRouters.delete('/user/:id', adminAuth, deleteUser);

// Staff Management Routes
userRouters.get('/staff', adminAuth, getAllStaff); 
userRouters.post("/staff/add", adminAuth, addStaff);
userRouters.get("/staff/:id", adminAuth, getStaffById);
userRouters.put("/staff/:id", adminAuth, updateStaff);
userRouters.delete("/staff/:id", adminAuth, deleteStaff);

// // Admin Management Routes
// userRouters.get("/admin", adminAuth, getAllAdmins); 
// userRouters.post("/admin/add", adminAuth, addAdmin);
// userRouters.get("/admin/:id", adminAuth, getAdminById);
// userRouters.put("/admin/:id", adminAuth, updateAdmin);
// userRouters.delete("/admin/:id", adminAuth, deleteAdmin);


userRouters.put("/user/toggle-status/:id", adminAuth, toggleUserStatus);
userRouters.put("/staff/toggle-status/:id", adminAuth, toggleStaffStatus);

userRouters.post("/forgot-password", forgotPassword);
userRouters.post("/reset-password", resetPassword);


export default userRouters;