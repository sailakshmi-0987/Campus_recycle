const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'University name is required'],
        unique: true,
        trim: true
    },
    domain: {
        type: String,
        required: [true, 'University domain is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            default: 'USA'
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0]
            }
        }
    },
    studentPopulation: {
        type: Number,
        default: 0
    },
    logoUrl: {
        type: String,
        default: null
    },
    sustainabilityProgram: {
        type: Boolean,
        default: false
    },
    partnershipStatus: {
        type: String,
        enum: ['none', 'pending', 'active', 'paused'],
        default: 'none'
    },
    partnershipDetails: {
        contactEmail: String,
        contactName: String,
        startDate: Date,
        features: [String]
    },
    settings: {
        allowExternalUsers: {
            type: Boolean,
            default: false
        },
        moderationEnabled: {
            type: Boolean,
            default: true
        },
        maxListingDuration: {
            type: Number,
            default: 30 // days
        }
    },
    statistics: {
        totalUsers: {
            type: Number,
            default: 0
        },
        activeListings: {
            type: Number,
            default: 0
        },
        totalTransactions: {
            type: Number,
            default: 0
        },
        wasteReduced: {
            type: Number,
            default: 0 // in pounds
        }
    }
}, {
    timestamps: true
});

// Indexes

universitySchema.index({ 'location.coordinates': '2dsphere' });
universitySchema.index({ partnershipStatus: 1 });

// Virtual for full location
universitySchema.virtual('fullLocation').get(function() {
    return `${this.location.city}, ${this.location.state}`;
});

module.exports = mongoose.model('University', universitySchema);