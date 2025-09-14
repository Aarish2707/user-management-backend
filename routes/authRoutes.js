const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

// Environment validation
if (!process.env.SECRET_KEY) {
    throw new Error('SECRET_KEY environment variable is required');
}
const SECRET_KEY = process.env.SECRET_KEY;

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later' }
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Registration API
router.post('/register', authLimiter, async (req, res) => {
    const { name, phone, email, password, role = 'user' } = req.body;
    
    // Input validation
    if (!name || !phone || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Password strength validation
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = new User({ name, phone, email, password, role });
        await user.save();

        // Send verification email
        const verificationToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: '24h' });
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
        
        await transporter.sendMail({
            from: `"User Management System" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Verify your email address',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to User Management System!</h2>
                    <p>Hello ${name},</p>
                    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                    <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${verificationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                </div>
            `
        });

        res.status(201).json({ 
            message: 'Registration successful! Please check your email for verification link.' 
        });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login API
router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.emailVerified) {
            return res.status(401).json({ error: 'Please verify your email before logging in' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            SECRET_KEY,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email Verification Route
router.get('/verify', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Verification token is required');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.emailVerified) {
            return res.send('Email already verified');
        }

        user.emailVerified = true;
        await user.save();

        res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h2>Email Verified Successfully!</h2>
                <p>You can now login to your account.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a>
            </div>
        `);
    } catch (error) {
        console.error('Verification error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).send('Verification link has expired');
        }
        res.status(500).send('Server error during verification');
    }
});

// Password Reset Request
router.post('/forgot-password', authLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const resetToken = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: `"User Management System" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested a password reset. Click the button below to reset your password:</p>
                    <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        });

        res.json({ message: 'Password reset link sent to your email' });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
});

module.exports = router;