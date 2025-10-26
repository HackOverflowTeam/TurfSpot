const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  amount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true
  },
  totalRevenue: {
    type: Number,
    required: true
  },
  bookingsCount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cheque', 'other'],
    default: 'bank_transfer'
  },
  transactionId: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    upiId: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  notes: String,
  period: {
    startDate: Date,
    endDate: Date
  }
}, {
  timestamps: true
});

// Indexes
payoutSchema.index({ owner: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

module.exports = mongoose.model('Payout', payoutSchema);
