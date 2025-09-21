import mongoose from "mongoose";

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
        enum: ["user", "admin","salesmanager"], // Only allow "user" or "admin" or "salesmanager"
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
     } 
});

userSchema.pre("save", async function (next) {
  if (!this.userId) {
    const lastUser = await this.constructor.findOne().sort({ userId: -1 });
    this.userId = lastUser ? lastUser.userId + 1 : 1;
  }
  next();
});

const User = mongoose.model("UserModel", userSchema);
export default User;