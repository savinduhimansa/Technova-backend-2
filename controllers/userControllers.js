import User from "../models/userModel.js";
import Staff from "../models/staffModel.js";
// import Admin from "../models/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import mongoose from "mongoose";

dotenv.config()

// Configure Nodemailer for security
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Save a new user with a hashed password and send an OTP
export async function saveUser(req, res) {
    try {
        const { email, firstName, lastName, password } = req.body;

        const hashPassword = await bcrypt.hash(password, 10);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 3600000; // 1 hour

        const user = new User({
            email,
            firstName,
            lastName,
            role: "user",
            password,
            otp,
            otpExpires,
            isEmailVerified: false,
            isDisable: false // A user is not disabled by default
        });

        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your OTP for Email Verification',
            html: `Your one-time password (OTP) is: <b>${otp}</b>. This code is valid for 1 hour.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('OTP Email sent:', info.response);
            }
        });

        res.status(201).json({
            message: "User saved successfully. Please check your email for the OTP.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "User not saved",
            error: err.message,
        });
    }
}

// Handle OTP verification
export async function verifyOTP(req, res) {
    const { email, otp } = req.body;
    
    try {
        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "Email successfully verified!" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "OTP verification failed." });
    }
}

// Log in a user and issue a JWT
export async function loginUser(req, res) {
    const { email, password } = req.body;
   

    try {
         const user = await User.findOne({ email }).select("+password");


        
        if (!user) {
          
        
            return res.status(404).json({ message: "Invalid credentials" });
        }

        if (user.password == null) {
            
            return res.status(403).json({ message: "Account not configured for login" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
           
            return res.status(403).json({ message: "Invalid credentials" });
        }
        
        // VULNERABILITY FIX: Check if the user is disabled
        if (user.isDisable) {
            return res.status(403).json({ message: "Your account has been deactivated. Please contact support for assistance." });
        }

        user.lastLogin = new Date();
        await user.save();

        const userData = {
            userId: user._id,
            role: user.role,
        };

        const token = jwt.sign(userData, process.env.JWT_KEY, { expiresIn: '1h' });

        return res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                isDisabled: user.isDisable,
                isEmailVerified: user.isEmailVerified,
                lastLogin: user.lastLogin
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Login failed" });
    }
}

// Get all users
export async function getAllUsers(req, res) {
    try {
        const users = await User.find();
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        return res.status(200).json({ users });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to retrieve users" });
    }
}

// Add a user (by admin)
export async function addUser(req, res) {
    try {
        const { email, firstName, lastName, role, password, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            firstName,
            lastName,
            role,
            password: hashPassword,
            phone,
            isDisable: false,
            isEmailVerified: true
        });

        await newUser.save();
        res.status(201).json({ message: "User added successfully!", user: newUser });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to add user" });
    }
}

// Get a user by ID
export async function getById(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to retrieve user" });
    }
}

// Update a user
export async function updateUser(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }
    const { email, firstName, lastName } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            id,
            { email, firstName, lastName },
            { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } return res.status(200).json({ user });
    } catch (err) {
        console.error(err); return res.status(500).json({
            message: "Unable to update user details"
        });
    }
}

// Delete a user
export async function deleteUser(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            message: "User deleted successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to delete user" });
    }
}

// Toggle a user's account status
export async function toggleUserStatus(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
    }
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isDisable = !user.isDisable;
        await user.save();

        const status = user.isDisable ? "deactivated" : "activated";
        return res.status(200).json({ message: `User account successfully ${status}.`, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to toggle user status." });
    }
}

// Function to handle the forgot password request
export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: "If a user with that email exists, a password reset link has been sent." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 3600000;
        await user.save();

        const resetUrl = `http://localhost:5001/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link is valid for 1 hour.</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending password reset email:', error);
                return res.status(500).json({ message: "Error sending password reset email." });
            }
            console.log('Password reset email sent:', info.response);
            res.status(200).json({ message: "Password reset link sent to your email." });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during forgot password." });
    }
}

// Function to handle the password reset
export async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password successfully reset." });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: "An unexpected error occurred." });
    }
}




// ===== Self-service profile =====
const safeUser = (u) => ({
  _id: u._id,
  userId: u.userId,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  phone: u.phone ?? null,
  isDisable: !!u.isDisable,
  isEmailVerified: !!u.isEmailVerified,
  lastLogin: u.lastLogin ?? null,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

// GET /api/user/me
export async function getMe(req, res) {
  
    try {
    const id =req.user.id
    console.log(id);
    if (!id) return res.status(401).json({ message: "Unauthorized" });
        
    const user = await User.findOne({ _id:id });
    console.log(user);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isDisable) return res.status(403).json({ message: "Account is deactivated" });

    return res.json({ user: safeUser(user) });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

// PUT /api/user/me
export async function updateMe(req, res) {
  try {
    const id = req.user.id
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isDisable) return res.status(403).json({ message: "Account is deactivated" });

    const { firstName, lastName, phone } = req.body ?? {};
    if (firstName != null) user.firstName = String(firstName).trim();
    if (lastName  != null) user.lastName  = String(lastName).trim();
    if (phone     != null) user.phone     = String(phone).trim();

    await user.save();
    return res.json({ user: safeUser(user), message: "Profile updated" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

// POST /api/auth/change-password
export async function changePassword(req, res) {
  try {
    const id = req.user.id
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isDisable) return res.status(403).json({ message: "Account is deactivated" });

    const ok = await bcrypt.compare(String(currentPassword), String(user.password));
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(String(newPassword), salt);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

// ===== Self-service profile =====
const safeStaff = (s) => ({
        staffId: s.staffId,
        name: s.name,
        role: s.role,
        email: s.email,
        age: s.age,
        address: s.address,
        isDisable: s.isDisable,
        lastLogin: s.lastLogin,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
});

// GET /api/staff/me
export async function getMyStaff(req, res) {
  try {
    const id = req.user.id;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const staff = await Staff.findById(id);
    // console.log(staff);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (staff.isDisable) return res.status(403).json({ message: "Account is deactivated" });

    return res.json({
      staff: {
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        email: staff.email,
        age: staff.age,
        address: staff.address,
        isDisable: staff.isDisable,
        lastLogin: staff.lastLogin,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      }
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}


export async function updateMyStaff(req, res) {
   
    try {
    const id = req.body["id"]
    if (!id) return res.status(401).json({ message: "Unauthorized" });
    
    const staff = await Staff.findOne({ staffId:id });
    
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (staff.isDisable) return res.status(403).json({ message: "Account is deactivated" });

    const { name, age, address } = req.body ?? {};
    if (name != null) staff.name = String(name).trim();
    if (age  != null) staff.age  = String(age).trim();
    if (address     != null) staff.address = String(address).trim();

    await staff.save();
    return res.json({ staff: safeStaff(staff), message: "Profile updated" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}





//STAFF MEMBERS
// Save a new staff member with a hashed password
export async function saveStaff(req, res) {
    // if (req.body.role === "admin") {
    //     if (req.user == null) {
    //         return res.status(403).json({
    //             message: "Please login as admin before creating an admin account",
    //         });
    //     }
    //     if (req.user.role !== "admin") {
    //         return res.status(403).json({
    //             message: "You are not authorized to create an admin account",
    //         });
    //     }
    // }

    try {
        const { staffId, name, role, email, age, password, address } = req.body;
        const hashPassword = await bcrypt.hash(password, 10);

        const staff = new Staff({
            staffId,
            name,
            role,
            email,
            age,
            password,
            address,
            isDisable: false
        });

        await staff.save();
        return res.status(201).json({
            message: "Staff member saved successfully",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Staff member not saved",
            error: err.message,
        });
    }
}
// Other staff member functions are assumed to be correct

// Log in a staff member and issue a JWT
export async function loginStaff(req, res) {
  const { email, password } = req.body;

  try {
    // If your Staff schema has `select: false` on password, include +password.
    const staff = await Staff.findOne({ email }).select("+password");

    // ✅ Guard before touching any properties
    if (!staff) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    // Optional debug, but safe:
    // console.log(staff?.password);

    if (staff.password == null) {
      return res.status(403).json({ message: "Account not configured for login" });
    }

    // ✅ Compare safely
    const isPasswordCorrect = await bcrypt.compare(String(password), String(staff.password));
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Invalid credentials" });
    }

    if (staff.isDisable) {
        
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact support for assistance."
      });
    }

    staff.lastLogin = new Date();
    await staff.save();

    const staffData = { staffId: staff._id, role: staff.role };
    const token = jwt.sign(staffData, process.env.JWT_KEY, { expiresIn: "1h" });

    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        email: staff.email,
        age: staff.age,
        address: staff.address,
        isDisabled: staff.isDisable, // keeping your existing field names
        isEmailVerified: staff.isEmailVerified,
        lastLogin: staff.lastLogin
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
}

// Get all staff members
export async function getAllStaff(req, res) {
    try {
        const staffMembers = await Staff.find();
        if (staffMembers.length === 0) {
            return res.status(404).json({ message: "No staff members found" });
        }
        return res.status(200).json({ staffMembers });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to retrieve staff members" });
    }
}

// Add a new staff member
export async function addStaff(req, res) {
    const { staffId, name, role, email, age, password, address } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    try {
        const staff = new Staff({ staffId, name, role, email, age, password:hashPassword, address });
        await staff.save();
        return res.status(201).json({ staff });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to add staff member" });
    }
}

// Get a staff member by ID
export async function getStaffById(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid staff id" });
    }
    try {
        const staff = await Staff.findById(id);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }
        return res.status(200).json({ staff });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to retrieve staff member" });
    }
}

// Update a staff member
export async function updateStaff(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid staff id" });
    }
    const { staffId, name, role, email, age, address } = req.body;
    try {
        const staff = await Staff.findByIdAndUpdate(
            id,
            { staffId, name, role, email, age, address },
            { new: true, runValidators: true }
        );
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }
        return res.status(200).json({ staff });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to update staff member details" });
    }
}

// Delete a staff member
export async function deleteStaff(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid staff id" });
    }
    try {
        const staff = await Staff.findByIdAndDelete(id);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }
        return res.status(200).json({ message: "Staff member deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to delete staff member" });
    }
}

// In your userControllers.js file, add this function to the "STAFF MEMBERS" section.

// Toggle a staff member's account status
export async function toggleStaffStatus(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid staff id" });
    }
    try {
        const staff = await Staff.findById(id);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        staff.isDisable = !staff.isDisable;
        await staff.save();

        const status = staff.isDisable ? "deactivated" : "activated";
        return res.status(200).json({ message: `Staff account successfully ${status}.`, staff });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to toggle staff status." });
    }
}


// Logout a user by sending a response that clears the token
// Logout a user by sending a response that clears the token
export async function logout(req, res) {
 try {

         return res.status(200).json({ message: "Logout successful. Please delete your token on the client-side." });
     } catch (err) {
         console.error(err);
         return res.status(500).json({ message: "Logout failed" });
     }
}








// //ADMIN

// // Save a new administrator with a hashed password
// export async function saveAdmin(req, res) {
//     try {
//         const { email, firstName, lastName, role, password } = req.body;
//         // VULNERABILITY FIX: Standardize password hashing to be async
//         const hashPassword = await bcrypt.hash(password, 10);

//         const admin = new Admin({
//             email,
//             firstName,
//             lastName,
//             role,
//             password: hashPassword,
//             isDisable: false
//         });

//         await admin.save();
//         return res.status(201).json({
//             message: "Admin saved successfully",
//         });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({
//             message: "Admin not saved",
//             error: err.message,
//         });
//     }
// }

// // Log in an administrator and issue a JWT
// export async function loginAdmin(req, res) {
//     const { email, password } = req.body;

//     try {
//         const admin = await Admin.findOne({ email });

//         if (!admin) {
//             return res.status(404).json({ message: "Invalid credentials" });
//         }

//         if (admin.password == null) {
//             return res.status(403).json({ message: "Account not configured for login" });
//         }
//         // VULNERABILITY FIX: Standardize password comparison to be async
//         const isPasswordCorrect = await bcrypt.compare(password, admin.password);

//         if (!isPasswordCorrect) {
//             return res.status(403).json({ message: "Invalid credentials" });
//         }

//         // VULNERABILITY FIX: Check if the admin is disabled
//         if (admin.isDisable) {
//             return res.status(403).json({ message: "Your account has been deactivated. Please contact support for assistance." });
//         }

//         admin.lastLogin = new Date();
//         await admin.save();

//         const adminData = {
//             adminId: admin._id,
//             role: admin.role
//         };
//         // VULNERABILITY FIX: Add expiry date to token
//         const token = jwt.sign(adminData, process.env.JWT_KEY, { expiresIn: '1h' });

//         return res.status(200).json({
//             message: "Login successful",
//             token: token,
//             user: {
//                 email: admin.email,
//                 firstName: admin.firstName,
//                 lastName: admin.lastName,
//                 role: admin.role,
//                 phone: admin.phone,
//                 isDisabled: admin.isDisabled,
//                 isEmailVerified: admin.isEmailVerified,
//                 lastLogin: admin.lastLogin
//             },
//         });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Login failed" });
//     }
// }

// // Get all administrators
// export async function getAllAdmins(req, res) {
//     try {
//         const admins = await Admin.find();
//         if (admins.length === 0) {
//             return res.status(404).json({ message: "No admins found" });
//         }
//         return res.status(200).json({ admins });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Failed to retrieve admins" });
//     }
// }

// // Add a new administrator
// export async function addAdmin(req, res) {
//     const { email, firstName, lastName } = req.body;
//     try {
//         const admin = new Admin({ email, firstName, lastName });
//         await admin.save();
//         return res.status(201).json({ admin });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Unable to add admin" });
//     }
// }

// // Get an administrator by ID
// export async function getAdminById(req, res) {
//     const { id } = req.params;
//     if (!mongoose.isValidObjectId(id)) {
//         return res.status(400).json({ message: "Invalid admin id" });
//     }
//     try {
//         const admin = await Admin.findById(id);
//         if (!admin) {
//             return res.status(404).json({ message: "Admin not found" });
//         }
//         return res.status(200).json({ admin });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Failed to retrieve admin" });
//     }
// }

// // Update an administrator
// export async function updateAdmin(req, res) {
//     const { id } = req.params;
//     if (!mongoose.isValidObjectId(id)) {
//         return res.status(400).json({ message: "Invalid admin id" });
//     }
//     const { email, firstName, lastName } = req.body;
//     try {
//         const admin = await Admin.findByIdAndUpdate(
//             id,
//             { email, firstName, lastName },
//             { new: true, runValidators: true }
//         );
//         if (!admin) {
//             return res.status(404).json({ message: "Admin not found" });
//         }
//         return res.status(200).json({ admin });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Unable to update admin details" });
//     }
// }

// // Delete an administrator
// export async function deleteAdmin(req, res) {
//     const { id } = req.params;
//     if (!mongoose.isValidObjectId(id)) {
//         return res.status(400).json({ message: "Invalid admin id" });
//     }
//     try {
//         const admin = await Admin.findByIdAndDelete(id);
//         if (!admin) {
//             return res.status(404).json({ message: "Admin not found" });
//         }
//         return res.status(200).json({ message: "Admin deleted successfully" });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Unable to delete admin" });
//     }
// }

// // Toggle an admin's account status
// export async function toggleAdminStatus(req, res) {
//     const { id } = req.params;
//     if (!mongoose.isValidObjectId(id)) {
//         return res.status(400).json({ message: "Invalid admin id" });
//     }
//     try {
//         const admin = await Admin.findById(id);
//         if (!admin) {
//             return res.status(404).json({ message: "Admin not found" });
//         }
        
//         admin.isDisable = !admin.isDisable;
//         await admin.save();
        
//         const status = admin.isDisable ? "deactivated" : "activated";
//         return res.status(200).json({ message: `Admin account successfully ${status}.`, admin });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Unable to toggle admin status." });
//     }
// }

