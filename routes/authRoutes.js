const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt.js');
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

module.exports  = router;