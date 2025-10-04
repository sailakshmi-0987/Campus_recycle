const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    finalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    transactionStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'meetup_scheduled', 'completed', 'cancelled', 'disputed'],
        default: 'pending'
    },
    meetingDetails: {
        location: String,
        scheduledTime: Date,
        notes: String
    },
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    disputeReason: String,
    paymentMethod: {
        type: String,
        enum: ['cash', 'venmo', 'zelle', 'paypal', 'other'],
        default: 'cash'
    }
}, {
    timestamps: true
});

// Indexes
transactionSchema.index({ buyer: 1, transactionStatus: 1 });
transactionSchema.index({ seller: 1, transactionStatus: 1 });
transactionSchema.index({ listing: 1 });
transactionSchema.index({ createdAt: -1 });

// Method to complete transaction
transactionSchema.methods.complete = async function() {
    this.transactionStatus = 'completed';
    this.completedAt = new Date();
    return await this.save();
};

// Method to cancel transaction
transactionSchema.methods.cancel = async function(reason) {
    this.transactionStatus = 'cancelled';
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    return await this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);