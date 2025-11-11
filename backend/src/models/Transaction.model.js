const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // Booking reference
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    
    // User who made the payment
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Turf and owner
    turf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Turf',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Payment details
    totalAmount: {
        type: Number,
        required: true
    },
    platformCommission: {
        type: Number,
        required: true,
        default: function() {
            // Exact 10% commission with proper rounding
            return Math.round(this.totalAmount * 0.10 * 100) / 100;
        }
    },
    ownerPayout: {
        type: Number,
        required: true,
        default: function() {
            // Exact 90% to owner (total - commission for precision)
            const commission = Math.round(this.totalAmount * 0.10 * 100) / 100;
            return Math.round((this.totalAmount - commission) * 100) / 100;
        }
    },
    
    // Payment proof (screenshot uploaded by user)
    paymentProof: {
        url: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    
    // Transaction reference/ID from payment screenshot
    transactionReference: {
        type: String,
        trim: true
    },
    
    // Payment verification status
    paymentStatus: {
        type: String,
        enum: ['pending_verification', 'verified', 'rejected'],
        default: 'pending_verification'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who verified
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    
    // Payout tracking
    payoutStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    payoutMethod: {
        type: String,
        enum: ['upi', 'bank_transfer', 'other'],
        default: 'upi'
    },
    payoutReference: {
        type: String, // UTR/Transaction ID when payout is made
        trim: true
    },
    payoutCompletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who processed payout
    },
    payoutCompletedAt: {
        type: Date
    },
    payoutNotes: {
        type: String
    },
    
    // Booking details snapshot (for historical reference)
    bookingSnapshot: {
        date: Date,
        timeSlot: String,
        sport: String,
        duration: Number
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ turf: 1, createdAt: -1 });
transactionSchema.index({ owner: 1, payoutStatus: 1 });
transactionSchema.index({ paymentStatus: 1 });
transactionSchema.index({ booking: 1 });

// Virtual for commission percentage
transactionSchema.virtual('commissionPercentage').get(function() {
    return 10;
});

// Virtual for owner percentage
transactionSchema.virtual('ownerPercentage').get(function() {
    return 90;
});

// Method to verify payment
transactionSchema.methods.verifyPayment = async function(adminId, isApproved, rejectionReason = null) {
    if (isApproved) {
        this.paymentStatus = 'verified';
        this.verifiedBy = adminId;
        this.verifiedAt = new Date();
        
        // Update associated booking status
        const Booking = mongoose.model('Booking');
        await Booking.findByIdAndUpdate(this.booking, {
            paymentStatus: 'completed'
        });
    } else {
        this.paymentStatus = 'rejected';
        this.verifiedBy = adminId;
        this.verifiedAt = new Date();
        this.rejectionReason = rejectionReason;
        
        // Update associated booking status
        const Booking = mongoose.model('Booking');
        await Booking.findByIdAndUpdate(this.booking, {
            paymentStatus: 'failed'
        });
    }
    
    return await this.save();
};

// Method to complete payout
transactionSchema.methods.completePayout = async function(adminId, payoutReference, notes = null) {
    this.payoutStatus = 'completed';
    this.payoutReference = payoutReference;
    this.payoutCompletedBy = adminId;
    this.payoutCompletedAt = new Date();
    if (notes) this.payoutNotes = notes;
    
    return await this.save();
};

// Static method to get transactions by turf
transactionSchema.statics.getByTurf = function(turfId, filters = {}) {
    const query = { turf: turfId };
    
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.payoutStatus) query.payoutStatus = filters.payoutStatus;
    if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = new Date(filters.endDate);
    }
    
    return this.find(query)
        .populate('user', 'name email phone')
        .populate('booking', 'date timeSlot status')
        .populate('owner', 'name email phone upiId')
        .populate('verifiedBy', 'name')
        .populate('payoutCompletedBy', 'name')
        .sort({ createdAt: -1 });
};

// Static method to get owner earnings summary
transactionSchema.statics.getOwnerEarnings = async function(ownerId, filters = {}) {
    const query = {
        owner: ownerId,
        paymentStatus: 'verified'
    };
    
    if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = new Date(filters.endDate);
    }
    
    const transactions = await this.find(query);
    
    const summary = {
        totalEarnings: 0,
        pendingPayout: 0,
        completedPayout: 0,
        transactionCount: transactions.length
    };
    
    transactions.forEach(txn => {
        summary.totalEarnings += txn.ownerPayout;
        
        if (txn.payoutStatus === 'completed') {
            summary.completedPayout += txn.ownerPayout;
        } else {
            summary.pendingPayout += txn.ownerPayout;
        }
    });
    
    return summary;
};

// Static method to get platform commission summary
transactionSchema.statics.getPlatformCommissionSummary = async function(filters = {}) {
    const query = { paymentStatus: 'verified' };
    
    if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = new Date(filters.endDate);
    }
    
    const transactions = await this.find(query);
    
    const summary = {
        totalCommission: 0,
        totalRevenue: 0,
        transactionCount: transactions.length
    };
    
    transactions.forEach(txn => {
        summary.totalCommission += txn.platformCommission;
        summary.totalRevenue += txn.totalAmount;
    });
    
    return summary;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
