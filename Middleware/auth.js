const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.SECRET_KEY) {
    throw new Error('SECRET_KEY environment variable is required');
}
const SECRET_KEY = process.env.SECRET_KEY;

const verifyJwtToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access token required' });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Verify user still exists and is active
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }
        
        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({ error: 'Account temporarily locked due to too many failed login attempts' });
        }
        
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        };
        
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        res.status(500).json({ error: 'Token verification failed' });
    }
};

// Role-based access control
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!req.user.role) {
            return res.status(403).json({ error: 'User role not defined' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }
        
        next();
    };
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, SECRET_KEY);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user && user.isActive && !user.isLocked) {
                req.user = {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                };
            }
        }
        
        next();
    } catch (err) {
        // Continue without authentication for optional auth
        next();
    }
};

module.exports = { verifyJwtToken, checkRole, optionalAuth };