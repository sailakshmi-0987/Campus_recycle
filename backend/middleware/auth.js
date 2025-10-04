const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if account is active
        if (req.user.accountStatus !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Account is suspended or deleted'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }
};

// Check if user owns the resource
exports.authorize = (model) => {
    return async (req, res, next) => {
        try {
            const resource = await model.findById(req.params.id);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    error: `${model.modelName} not found`
                });
            }

            // Check if user owns the resource (seller field)
            if (resource.seller && resource.seller.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: `Not authorized to modify this ${model.modelName.toLowerCase()}`
                });
            }

            // Attach resource to request
            req.resource = resource;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };
};

// Optional authentication - attach user if token exists
exports.optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Token invalid, continue without user
        }
    }

    next();
};