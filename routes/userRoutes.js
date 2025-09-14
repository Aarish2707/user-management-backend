const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { verifyJwtToken, checkRole } = require('../Middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for user operations
const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' }
});

// Add User
router.post('/users', userLimiter, verifyJwtToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, phone, email, password, role = 'user' } = req.body;
        
        // Input validation
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const newUser = new User({ name, phone, email, password, role, emailVerified: true });
        await newUser.save();
        
        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        res.status(201).json(userResponse);
    } catch (err) {
        console.error('Error creating user:', err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get Users
router.get('/users', userLimiter, verifyJwtToken, checkRole(['admin', 'user']), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
            
        const total = await User.countDocuments(query);
        
        res.json({
            users,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update User
router.put('/users/:id', userLimiter, verifyJwtToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, role } = req.body;
        
        // Validate allowed fields only
        const allowedUpdates = { name, phone, email, role };
        Object.keys(allowedUpdates).forEach(key => 
            allowedUpdates[key] === undefined && delete allowedUpdates[key]
        );
        
        if (Object.keys(allowedUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            id, 
            allowedUpdates, 
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(updatedUser);
    } catch (err) {
        console.error('Error updating user:', err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete User
router.delete('/users/:id', userLimiter, verifyJwtToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Prevent admin from deleting themselves
        if (req.user.id === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;