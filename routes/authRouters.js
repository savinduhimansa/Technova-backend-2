// src/routes/authRoutes.js
import express from 'express';
import { forgotPasswordOtp, resetPasswordOtp } from '../controllers/authController.js';

const router = express.Router();

// Route to request an OTP for password reset
router.post('/forgot-password-otp', forgotPasswordOtp);
// Route to verify the OTP and reset the password
router.post('/reset-password-otp', resetPasswordOtp);

export default router;