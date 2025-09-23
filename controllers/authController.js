// src/controllers/authController.js
import User from '../models/userModel.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

// Function to generate and send OTP
export const forgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save the OTP and its expiration to the user's document
        user.passwordResetToken = otp; // Re-using this field for the OTP
        user.passwordResetExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        // Nodemailer setup
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use your email service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Password Reset OTP',
            html: `<p>Your One-Time Password (OTP) for resetting your password is: <strong>${otp}</strong></p>
                   <p>This OTP is valid for 10 minutes.</p>`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully.' });

    } catch (error) {
        console.error('Forgot password OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
};

// Function to verify OTP and reset password
export const resetPasswordOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({
            email,
            passwordResetToken: otp,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been successfully reset.' });

    } catch (error) {
        console.error('Reset password OTP error:', error);
        res.status(500).json({ message: 'Failed to reset password.' });
    }
};