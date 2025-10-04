const User = require('../models/User');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const { ErrorResponse } = require('../middleware/errorHandler');
const cloudinary = require('../utils/cloudinaryUpload');
const streamifier = require('streamifier');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('university', 'name location')
            .select('-favorites');

        if (!user) return next(new ErrorResponse('User not found', 404));

        const listings = await Listing.find({ seller: user._id, status: 'active' })
            .select('title price images category condition createdAt')
            .limit(6)
            .sort('-createdAt');

        const reviews = await Review.find({ reviewee: user._id })
            .populate('reviewer', 'firstName lastName profileImageUrl')
            .populate('transaction')
            .sort('-createdAt')
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                user: user.toPublicJSON(),
                listings,
                reviews,
                reviewCount: reviews.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
    try {
        if (req.params.id !== req.user.id) {
            return next(new ErrorResponse('Not authorized to update this profile', 403));
        }

        const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'bio'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate('university', 'name location');

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload profile image
// @route   POST /api/users/:id/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
    try {
        if (req.params.id !== req.user.id) {
            return next(new ErrorResponse('Not authorized', 403));
        }

        if (!req.file) return next(new ErrorResponse('Please upload an image', 400));

        const user = await User.findById(req.params.id);

        // Delete old profile image if exists
        if (user.profileImagePublicId) {
            await cloudinary.uploader.destroy(user.profileImagePublicId);
        }

        // Upload new image
        const uploadFromBuffer = (buffer) =>
            new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'profiles', resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });

        const result = await uploadFromBuffer(req.file.buffer);

        user.profileImageUrl = result.secure_url;
        user.profileImagePublicId = result.public_id;
        await user.save();

        res.status(200).json({ success: true, data: { profileImageUrl: user.profileImageUrl } });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's listings
// @route   GET /api/users/:id/listings
// @access  Public
exports.getUserListings = async (req, res, next) => {
    try {
        const { status = 'active', page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const query = { seller: req.params.id };
        if (status) query.status = status;

        const listings = await Listing.find(query)
            .populate('university', 'name')
            .sort('-createdAt')
            .limit(Number(limit))
            .skip(skip);

        const total = await Listing.countDocuments(query);

        res.status(200).json({
            success: true,
            count: listings.length,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
            data: listings
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's reviews
// @route   GET /api/users/:id/reviews
// @access  Public
exports.getUserReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const reviews = await Review.find({ reviewee: req.params.id })
            .populate('reviewer', 'firstName lastName profileImageUrl')
            .populate({ path: 'transaction', populate: { path: 'listing', select: 'title images' } })
            .sort('-createdAt')
            .limit(Number(limit))
            .skip(skip);

        const total = await Review.countDocuments({ reviewee: req.params.id });

        const ratingDistribution = await Review.aggregate([
            { $match: { reviewee: mongoose.Types.ObjectId(req.params.id) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        res.status(200).json({
            success: true,
            count: reviews.length,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
            ratingDistribution,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};
