const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User  = require('../models/User');
// const User = require('../models/User');

const SECRET_KEY = process.env.SECRET_KEY || 'yoursecretkey';

//register api
// api/register
router.post('/register',async (req, res) => {
    const {name, phone, email, password, role} = req.body;
    try{
        const user = new User({name, phone, email, password, role});
        await user.save();
        res.status(201).json({message:'User regustered successfully!'});
    }
    catch(err){
        res.status(400).json({error:'User already Registered'});
    }
});

//login api
// /api/login
router.post('/login', async(req, res) => {
    const {email, password} = req.body;
    try{
        const user = await User.findOne({ email });
        if(!user || !(await bcrypt.compare(password, user.password))){
            return res.status(401).json({ message: 'Invalid Credentials!'});
        }

        const token = jwt.sign({ id: user._id, role: user.role}, SECRET_KEY, {expiresIn: '2h'});
        res.json(token);
    }
    catch(err){
        res.status(500).json({ message: 'Login Error!'});
    }
});

//mail sending api
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// API for Register
router.post('/register', async (req, res) => {
    const { name, phone, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered!" });

        const user = new User({ name, phone, email, password, role });
        await user.save();

        // ✉️ Send verification email
        const verificationLink = `https://stellular-haupia-fb1943.netlify.app/verify?email=${email}`;
        await transporter.sendMail({
            from: `"User Management" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify your email",
            html: `<h3>Hello ${name},</h3><p>Please verify your email by clicking <a href="${verificationLink}">this link</a>.</p>`
        });

        res.status(201).json({ message: "Registered successfully! Please check your email for verification." });
    } catch (err) {
        res.status(500).json({ error: "Registration failed", details: err });
    }
});

// ✅ Email Verification Route
router.get('/verify', async (req, res) => {
    const { email } = req.query;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        user.emailVerified = true;
        await user.save();

        res.send("Email verified successfully!");
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).send("Server error during verification");
    }
});


module.exports  = router;