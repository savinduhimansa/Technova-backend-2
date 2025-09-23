import mongoose from "mongoose";
import bcrypt from "bcrypt"; // <-- Add this import


const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        unique: true,  
    },
    email: {
        type: String,
        required: true,
        unique: true, 
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin"], // Only allow "user" or "admin"
        default: "user" 
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        default: "Not given"
    },
    isDisable: {
        type: Boolean,
        required: true,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    isEmailVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    otp: String,
    otpExpires: Date,
    lastLogin: { 
        type: Date
     } ,
     passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre('save', async function (next) {
    if (this.isNew && !this.userId) { // Check if it's a new document and userId is not already set
        try {
            const lastUser = await this.constructor.findOne({}, {}, { sort: { 'userId': -1 } }).exec();
            if (lastUser && lastUser.userId) {
                this.userId = lastUser.userId + 1;
            } else {
                this.userId = 1;
            }
        } catch (err) {
            return next(err); // Pass any errors to the next middleware
        }
    }
    next();
});






// Middleware to hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
const User = mongoose.model("UserModel", userSchema);
export default User;