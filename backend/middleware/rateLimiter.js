const rateLimit = require('express-rate-limit');

// General API rate limiter
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for authentication routes
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.'
    }
});

// Rate limiter for creating listings
exports.createListingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 listings per hour
    message: {
        success: false,
        error: 'Too many listings created, please try again later.'
    }
});

// Rate limiter for sending messages
exports.messageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Max 10 messages per minute
    message: {
        success: false,
        error: 'Too many messages sent, please slow down.'
    }
});

// Rate limiter for image uploads
exports.uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Max 50 uploads per hour
    message: {
        success: false,
        error: 'Too many uploads, please try again later.'
    }
});