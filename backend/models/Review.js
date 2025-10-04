const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    reviewText: {
        type: String,
        maxlength: 500,
        trim: true
    },
    reviewType: {
        type: String,
        enum: ['buyer_to_seller', 'seller_to_buyer'],
        required: true
    },
    categories: {
        communication: {
            type: Number,
            min: 1,
            max: 5
        },
        accuracy: {
            type: Number,
            min: 1,
            max: 5
        },
        reliability: {
            type: Number,
            min: 1,
            max: 5
        }
    }
}, {
    timestamps: true
});

// Compound unique index - one review per transaction per user
reviewSchema.index({ transaction: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

// Update user reputation after review
reviewSchema.post('save', async function() {
    const User = mongoose.model('User');
    
    // Get all reviews for the reviewee
    const reviews = await this.constructor.find({ reviewee: this.reviewee });
    
    if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        await User.findByIdAndUpdate(this.reviewee, {
            reputationScore: Number(avgRating.toFixed(2))
        });
    }
});

module.exports = mongoose.model('Review', reviewSchema);