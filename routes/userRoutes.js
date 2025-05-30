const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { verifyJwtToken, checkRole } = require('../Middleware/auth');

let users = [];

// Add User
router.post('/users',verifyJwtToken, checkRole(['admin', 'user']), async (req, res) => {
    try{
        console.log("Received data:", req.body); // Check incoming data

        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    }
    catch(err){
        console.error("Error in POST /users:", err); // 👀 Log full error

        res.status(500).json({message:'Error Creating User', error:err});
    }
});

// Get Users
router.get('/users',verifyJwtToken, checkRole(['admin', 'user']), async (req, res) => {
    try{
        const users = await User.find();
        res.json(users);
    }
    catch(err){
        res.status(500).json({message: 'Error Fetching Users', error:err});
    }
});

// Update User
router.put('/users/:id', verifyJwtToken, checkRole(['admin']), async (req, res) => {
    try{
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {new:true});
        if (!updatedUser){
            return res.status(404).json({message:'User not found'});
            res.json(updatedUser);
        }
    }
    catch(err){
        res.status(500).json({message:'Error updatig user', error:err});
    }
});

// Delete User
router.delete('/users/:id', verifyJwtToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found!" });
        }
        res.json({ message: "User deleted successfully!" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error while deleting user." });
    }
});

module.exports = router;