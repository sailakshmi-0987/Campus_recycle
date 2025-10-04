const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    uploadProfileImage,
    getUserListings,
    getUserReviews
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../utils/fileUpload');

router.get('/:id', validateObjectId('id'), getUserProfile);
router.put('/:id', protect, validateObjectId('id'), updateUserProfile);
router.post('/:id/profile-image', protect, uploadLimiter, validateObjectId('id'), upload.single('image'), uploadProfileImage);
router.get('/:id/listings', validateObjectId('id'), getUserListings);
router.get('/:id/reviews', validateObjectId('id'), getUserReviews);

module.exports = router;