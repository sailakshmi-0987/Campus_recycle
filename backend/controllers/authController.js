const User = require('../models/User');
const University = require('../models/University');
const { ErrorResponse } = require('../middleware/errorHandler');
const { sendEmail, getVerificationEmailTemplate } = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, universityId } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorResponse('Email already registered', 400));
        }

        // Verify university exists
        const university = await University.findById(universityId);
        if (!university) {
            return next(new ErrorResponse('University not found', 404));
        }

        // Extract domain from email
        const emailDomain = email.split('@')[1];
        if (emailDomain !== university.domain) {
            return next(new ErrorResponse('Email domain does not match selected university', 400));
        }

        // Create user
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            university: universityId
        });

        // Generate verification token
        const verificationCode = user.getEmailVerificationToken();
        await user.save();

        // Send verification email
        const emailSent = await sendEmail({
            email: user.email,
            subject: 'Verify Your Campus Recycle Account',
            html: getVerificationEmailTemplate(verificationCode, user.firstName)
        });

        if (!emailSent) {
            console.error('Failed to send verification email');
        }

        // Update university statistics
        await University.findByIdAndUpdate(universityId, {
            $inc: { 'statistics.totalUsers': 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: {
                user: user.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({
            email,
            emailVerificationToken: code,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return next(new ErrorResponse('Invalid or expired verification code', 400));
        }

        // Mark email as verified
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        // Generate JWT token
        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                token,
                user: user.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email }).select('+password').populate('university', 'name domain');

        if (!user) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return next(new ErrorResponse('Please verify your email before logging in', 403));
        }

        // Check account status
        if (user.accountStatus !== 'active') {
            return next(new ErrorResponse('Your account has been suspended', 403));
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate token
        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            data: {
                token,
                user: user.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('university', 'name domain location');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return next(new ErrorResponse('User not found', 404));
        }

        if (user.emailVerified) {
            return next(new ErrorResponse('Email already verified', 400));
        }

        // Generate new verification token
        const verificationCode = user.getEmailVerificationToken();
        await user.save();

        // Send verification email
        await sendEmail({
            email: user.email,
            subject: 'Verify Your Campus Recycle Account',
            html: getVerificationEmailTemplate(verificationCode, user.firstName)
        });

        res.status(200).json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    try {
        // In a more advanced setup, you would invalidate the token here
        // For now, we'll just return success and let the client handle token removal
        
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};