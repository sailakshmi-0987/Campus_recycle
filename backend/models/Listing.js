const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Textbooks',
            'Electronics',
            'Furniture',
            'Clothing',
            'Kitchen & Appliances',
            'Sports & Outdoors',
            'School Supplies',
            'Decor',
            'Other'
        ],
        index: true
    },
    condition: {
        type: String,
        required: true,
        enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be positive'],
        max: [10000, 'Price cannot exceed $10,000']
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    isNegotiable: {
        type: Boolean,
        default: true
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        thumbnailUrl: String,
        key: String, // S3 key for deletion
        displayOrder: {
            type: Number,
            default: 0
        }
    }],
    listingType: {
        type: String,
        enum: ['standard', 'featured', 'promoted'],
        default: 'standard'
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'pending', 'sold', 'expired', 'deleted'],
        default: 'active',
        index: true
    },
    views: {
        type: Number,
        default: 0
    },
    viewsHistory: [{
        date: Date,
        count: Number
    }],
    favoritesCount: {
        type: Number,
        default: 0
    },
    locationPickup: {
        type: String,
        maxlength: 255
    },
    availability: {
        from: {
            type: Date,
            default: Date.now
        },
        until: {
            type: Date,
            default: function() {
                return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
        }
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    soldAt: Date,
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reportCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound indexes for common queries
listingSchema.index({ university: 1, status: 1, createdAt: -1 });
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ category: 1, status: 1, price: 1 });
listingSchema.index({ status: 1, createdAt: -1 });

// Text index for search
listingSchema.index({ 
    title: 'text', 
    description: 'text', 
    tags: 'text' 
});

// Virtual for checking if expired
listingSchema.virtual('isExpired').get(function() {
    return this.availability.until < new Date() && this.status === 'active';
});

// Virtual for savings percentage
listingSchema.virtual('savingsPercentage').get(function() {
    if (!this.originalPrice || this.originalPrice <= this.price) {
        return 0;
    }
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Method to increment views
listingSchema.methods.incrementViews = async function() {
    this.views += 1;
    
    // Update views history
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayHistory = this.viewsHistory.find(
        h => h.date.getTime() === today.getTime()
    );
    
    if (todayHistory) {
        todayHistory.count += 1;
    } else {
        this.viewsHistory.push({ date: today, count: 1 });
        
        // Keep only last 30 days
        if (this.viewsHistory.length > 30) {
            this.viewsHistory.shift();
        }
    }
    
    return await this.save();
};

// Method to mark as sold
listingSchema.methods.markAsSold = async function(buyerId) {
    this.status = 'sold';
    this.soldAt = new Date();
    this.soldTo = buyerId;
    return await this.save();
};

// Set to expired if past availability date
listingSchema.pre('save', function(next) {
    if (this.status === 'active' && this.availability.until < new Date()) {
        this.status = 'expired';
    }
    next();
});

module.exports = mongoose.model('Listing', listingSchema);