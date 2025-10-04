const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'new_message',
            'listing_sold',
            'new_favorite',
            'transaction_update',
            'review_received',
            'listing_expiring',
            'price_drop',
            'listing_approved',
            'system_announcement'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    relatedListing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    actionUrl: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date
}, {
    timestamps: true
});

// Compound indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        return await this.save();
    }
    return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
    try {
        const notification = await this.create(data);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

module.exports = mongoose.model('Notification', notificationSchema);