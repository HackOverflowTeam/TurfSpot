const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  images: [{
    url: String,
    publicId: String
  }],
  isVerified: {
    type: Boolean,
    default: false // Only users who completed booking can review
  }
}, {
  timestamps: true
});

// One review per booking
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ turf: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
