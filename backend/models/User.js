const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // 👈 this alone is enough, no need for extra index
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.edu$/.test(v);
            },
            message: 'Must be a valid .edu email address'
        }
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: 50
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^\d{10}$/.test(v);
            },
            message: 'Phone number must be 10 digits'
        }
    },
    profileImageUrl: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: 500
    },
    reputationScore: {
        type: Number,
        default: 5.0,
        min: 0,
        max: 5
    },
    totalListings: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    totalPurchases: {
        type: Number,
        default: 0
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    premiumTier: {
        type: String,
        enum: ['free', 'basic', 'premium'],
        default: 'free'
    },
    premiumExpiresAt: Date,
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    }],
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Keep only **necessary** indexes
userSchema.index({ university: 1 });
userSchema.index({ accountStatus: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    this.emailVerificationToken = verificationToken;
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
};

// Public JSON
userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        profileImageUrl: this.profileImageUrl,
        bio: this.bio,
        reputationScore: this.reputationScore,
        totalListings: this.totalListings,
        totalSales: this.totalSales,
        premiumTier: this.premiumTier,
        university: this.university,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);
