const express = require('express');
const router = express.Router();

const {
    getListings,
    getListing,
    createListing,
    uploadImages,
    updateListing,
    /*deleteListing,
    toggleFavorite,
    getFavorites,
    getTrendingListings,
    markAsSold*/
} = require('../controllers/listingController');

const { protect, optionalAuth } = require('../middleware/auth');
const { 
    validateListing,
    validateListingQuery,
    validateObjectId
} = require('../middleware/validation');

const { createListingLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../utils/fileUpload'); // Multer config

// ------------------- Public Routes ------------------- //
// List all listings with filters
router.get('/', validateListingQuery, optionalAuth, getListings);

// Trending listings
//router.get('/trending', getTrendingListings);

// Single listing by ID
router.get('/:id', validateObjectId('id'), optionalAuth, getListing);

// ------------------- Protected Routes ------------------- //
// Create listing
router.post(
    '/',
    protect,
    createListingLimiter,
    validateListing,
    createListing
);

// Upload images (up to 5)
router.post(
    '/:id/images',
    protect,
    uploadLimiter,
    validateObjectId('id'),
    upload.array('images', 5),
    uploadImages
);

// Update listing
router.put(
    '/:id',
    protect,
    validateObjectId('id'),
    validateListing,
    updateListing
);

// Delete listing
/*router.delete(
    '/:id',
    protect,
    validateObjectId('id'),
    deleteListing
);

// Toggle favorite
router.post(
    '/:id/favorite',
    protect,
    validateObjectId('id'),
    toggleFavorite
);

// Get user's favorite listings
router.get('/user/favorites', protect, getFavorites);

// Mark listing as sold
router.put(
    '/:id/sold',
    protect,
    validateObjectId('id'),
    markAsSold
);*/

module.exports = router;
