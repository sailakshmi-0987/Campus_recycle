const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    messageText: {
        type: String,
        required: [true, 'Message text is required'],
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    attachments: [{
        url: String,
        type: String,
        size: Number
    }]
}, {
    timestamps: true
});

// Compound indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(userId1, userId2, listingId) {
    const sortedIds = [userId1.toString(), userId2.toString()].sort();
    return `${sortedIds[0]}_${sortedIds[1]}_${listingId}`;
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        recipient: userId,
        isRead: false
    });
};

// Method to mark as read
messageSchema.methods.markAsRead = async function() {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        return await this.save();
    }
    return this;
};

module.exports = mongoose.model('Message', messageSchema);