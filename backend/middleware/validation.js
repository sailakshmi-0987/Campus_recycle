const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// ------------------- User Validations ------------------- //
exports.validateUserRegistration = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
        .custom(value => {
            if (!/\.edu$/.test(value)) throw new Error('Email must be from a .edu domain');
            return true;
        }),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and a number'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    body('universityId')
        .notEmpty()
        .withMessage('University is required')
        .isMongoId()
        .withMessage('Invalid university ID'),
    exports.handleValidation
];

exports.validateUserLogin = [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    exports.handleValidation
];

// ------------------- Listing Validations ------------------- //
exports.validateListing = [
    body('title').trim().notEmpty().withMessage('Title is required')
        .isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('description').trim().notEmpty().withMessage('Description is required')
        .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('category').notEmpty().withMessage('Category is required')
        .isIn([
            'Textbooks','Electronics','Furniture','Clothing','Kitchen & Appliances',
            'Sports & Outdoors','School Supplies','Decor','Other'
        ]).withMessage('Invalid category'),
    body('condition').notEmpty().withMessage('Condition is required')
        .isIn(['New','Like New','Good','Fair','Poor']).withMessage('Invalid condition'),
    body('price').isFloat({ min: 0, max: 10000 }).withMessage('Price must be 0-10000'),
    body('isNegotiable').optional().isBoolean().withMessage('isNegotiable must be boolean'),
    body('locationPickup').optional().trim().isLength({ max: 255 }).withMessage('Location cannot exceed 255 chars'),
    exports.handleValidation
];

exports.validateListingQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
    query('category').optional().isIn([
        'Textbooks','Electronics','Furniture','Clothing','Kitchen & Appliances',
        'Sports & Outdoors','School Supplies','Decor','Other'
    ]).withMessage('Invalid category'),
    exports.handleValidation
];

// ------------------- ObjectId Validation ------------------- //
exports.validateObjectId = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
    exports.handleValidation
];

// ------------------- Message & Review Validations ------------------- //
exports.validateMessage = [
    body('recipientId').notEmpty().withMessage('Recipient required').isMongoId(),
    body('listingId').notEmpty().withMessage('Listing required').isMongoId(),
    body('messageText').trim().notEmpty().withMessage('Message text required')
        .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 chars'),
    exports.handleValidation
];

exports.validateReview = [
    body('transactionId').notEmpty().withMessage('Transaction ID required').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('reviewText').optional().trim().isLength({ max: 500 }).withMessage('Review cannot exceed 500 chars'),
    exports.handleValidation
];
