const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'owner'],
    default: 'user'
  },
  emailOTP: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  otpRequestCount: {
    type: Number,
    default: 0
  },
  lastOtpRequest: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Document will be automatically deleted after 1 hour if not verified
  }
});

// Prevent multiple pending users with same email
pendingUserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('PendingUser', pendingUserSchema);
