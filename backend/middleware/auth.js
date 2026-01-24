const jwt = require('jsonwebtoken');

// JWT secret - should match the one in auth routes
const JWT_SECRET = process.env.JWT_SECRET || 'aagam_jwt_secret_key';

// Authentication middleware
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Add user info to request
        req.user = decoded;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        res.status(500).json({ message: 'Authentication error' });
    }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    next();
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }

        next();
    } catch (error) {
        // For optional auth, we don't fail if token is invalid
        // Just continue without user info
        next();
    }
};

// Role-based authorization
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role !== role) {
            return res.status(403).json({ message: `Access denied. ${role} role required.` });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireAdmin,
    optionalAuth,
    requireRole
};