const express = require('express');
const User = require('../models/User');
const router = express.Router();

let users = [];

// Add User
router.post('/users', async (req, res) => {
    try{
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    }
    catch(err){
        res.status(500).json({message:'Error Creating User', error:err});
    }
});

// Get Users
router.get('/users', async (req, res) => {
    try{
        const users = await User.find();
        res.json(users);
    }
    catch(err){
        res.status(500).json({message: 'Error Fetching Users', error:err});
    }
});

// Update User
router.put('/users/:id', async (req, res) => {
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
router.delete('/users/:id', async (req, res) => {
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