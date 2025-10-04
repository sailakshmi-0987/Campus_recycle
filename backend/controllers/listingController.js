const Listing = require('../models/Listing');
const User = require('../models/User');
const University = require('../models/University');
const { ErrorResponse } = require('../middleware/errorHandler');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload'); // ✅ use Cloudinary instead of S3

// @desc    Get all listings with filters
// @route   GET /api/listings
// @access  Public
exports.getListings = async (req, res, next) => {
    try {
        const {
            university,
            category,
            minPrice,
            maxPrice,
            condition,
            search,
            sort = '-createdAt',
            page = 1,
            limit = 20,
            status = 'active'
        } = req.query;

        // Build query
        const query = { status };

        if (university) query.university = university;
        if (category) query.category = category;
        if (condition) query.condition = condition;

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Execute query
        const listings = await Listing.find(query)
            .populate('seller', 'firstName lastName profileImageUrl reputationScore')
            .populate('university', 'name location.city location.state')
            .sort(sort)
            .limit(Number(limit))
            .skip(skip)
            .lean();

        const total = await Listing.countDocuments(query);

        res.status(200).json({
            success: true,
            count: listings.length,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            data: listings
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
exports.getListing = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('seller', 'firstName lastName profileImageUrl reputationScore totalListings totalSales createdAt bio')
            .populate('university', 'name location');

        if (!listing) {
            return next(new ErrorResponse('Listing not found', 404));
        }

        // Increment views (not for seller’s own listing)
        if (!req.user || req.user.id !== listing.seller._id.toString()) {
            await listing.incrementViews();
        }

        res.status(200).json({
            success: true,
            data: listing
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create listing
// @route   POST /api/listings
// @access  Private
exports.createListing = async (req, res, next) => {
    try {
        req.body.seller = req.user.id;
        req.body.university = req.user.university;

        const listing = await Listing.create(req.body);

        await User.findByIdAndUpdate(req.user.id, {
            $inc: { totalListings: 1 }
        });

        await University.findByIdAndUpdate(req.user.university, {
            $inc: { 'statistics.activeListings': 1 }
        });

        res.status(201).json({
            success: true,
            data: listing
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload listing images (max 5)
// @route   POST /api/listings/:id/images
// @access  Private
exports.uploadImages = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return next(new ErrorResponse('Listing not found', 404));
        }

        // Ownership check
        if (listing.seller.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized', 403));
        }

        // Ensure files exist
        if (!req.files || req.files.length === 0) {
            return next(new ErrorResponse('Please upload at least one image', 400));
        }

        // Max 5 images
        if (listing.images.length + req.files.length > 5) {
            return next(new ErrorResponse('Maximum 5 images allowed per listing', 400));
        }

        // Upload to Cloudinary
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.path, "listings"));
        const uploadedUrls = await Promise.all(uploadPromises);

        const newImages = uploadedUrls.map((url, index) => ({
            url,
            displayOrder: listing.images.length + index
        }));

        listing.images.push(...newImages);
        await listing.save();

        res.status(200).json({
            success: true,
            data: listing
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private
exports.updateListing = async (req, res, next) => {
    try {
        let listing = await Listing.findById(req.params.id);
        if (!listing) {
            return next(new ErrorResponse('Listing not found', 404));
        }

        if (listing.seller.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized to update this listing', 403));
        }

        // Restricted fields
        delete req.body.seller;
        delete req.body.university;
        delete req.body.views;
        delete req.body.soldAt;
        delete req.body.soldTo;

        listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('seller', 'firstName lastName profileImageUrl reputationScore');

        res.status(200).json({
            success: true,
            data: listing
        });
    } catch (error) {
        next(error);
    }
};
