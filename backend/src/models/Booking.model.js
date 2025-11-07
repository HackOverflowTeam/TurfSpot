const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  turf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  timeSlots: [{
    startTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    }
  }],
  // Deprecated: kept for backward compatibility
  timeSlot: {
    startTime: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    },
    endTime: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    }
  },
  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'badminton', 'tennis', 'basketball', 'volleyball', 'hockey']
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    platformFee: {
      type: Number,
      required: true
    },
    ownerEarnings: {
      type: Number,
      required: true
    },
    taxes: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  payment: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundId: String,
    refundedAt: Date
  },
  // For tier-based turfs: user uploads payment screenshot
  tierPayment: {
    screenshot: {
      url: String,
      publicId: String
    },
    uploadedAt: Date,
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    rejectionReason: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'pending_refund', 'refund_completed', 'refund_denied'],
    default: 'pending'
  },
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number
  },
  // Refund request with QR verification
  refundRequest: {
    qrImage: {
      url: String,
      publicId: String
    },
    reason: String,
    requestedAt: Date,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNote: String,
    refundAmount: Number
  },
  playerDetails: {
    name: String,
    phone: String,
    numberOfPlayers: {
      type: Number,
      min: 1
    }
  },
  notes: String,
  payoutStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  payoutDetails: {
    paidAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transactionId: String,
    paymentMethod: String,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ turf: 1, bookingDate: 1, 'timeSlots.startTime': 1 });
bookingSchema.index({ turf: 1, bookingDate: 1, 'timeSlot.startTime': 1 }); // Backward compatibility
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1, 'payment.status': 1 });

// Virtual property to get first time slot for backward compatibility
bookingSchema.virtual('firstSlot').get(function() {
  if (this.timeSlots && this.timeSlots.length > 0) {
    return this.timeSlots[0];
  }
  return this.timeSlot;
});

// Pre-save hook to ensure backward compatibility
bookingSchema.pre('save', function(next) {
  // If timeSlots is provided but not timeSlot, set timeSlot to first slot
  if (this.timeSlots && this.timeSlots.length > 0 && !this.timeSlot.startTime) {
    this.timeSlot = {
      startTime: this.timeSlots[0].startTime,
      endTime: this.timeSlots[this.timeSlots.length - 1].endTime
    };
  }
  // If timeSlot is provided but not timeSlots, create timeSlots array
  if (this.timeSlot && this.timeSlot.startTime && (!this.timeSlots || this.timeSlots.length === 0)) {
    this.timeSlots = [{ startTime: this.timeSlot.startTime, endTime: this.timeSlot.endTime }];
  }
  next();
});

// Prevent double booking - updated to check all time slots
// Note: Validation is handled in the controller due to the complexity of checking multiple slots
bookingSchema.index(
  { turf: 1, bookingDate: 1, 'timeSlot.startTime': 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['confirmed', 'pending'] } 
    },
    sparse: true
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
