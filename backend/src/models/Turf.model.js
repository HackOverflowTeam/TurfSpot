const mongoose = require('mongoose');

const turfSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Turf name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true,
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
    },
    landmark: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  contactInfo: {
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    alternatePhone: String,
    email: String
  },
  sportsSupported: [{
    type: String,
    enum: ['cricket', 'football', 'badminton', 'tennis', 'basketball', 'volleyball', 'hockey'],
    required: true
  }],
  pricing: {
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Price cannot be negative']
    },
    weekendRate: {
      type: Number,
      default: function() { return this.pricing.hourlyRate; }
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  amenities: [{
    type: String,
    enum: [
      'parking',
      'washroom',
      'changing_room',
      'first_aid',
      'drinking_water',
      'cafeteria',
      'seating_area',
      'floodlights',
      'equipment_rental',
      'scoreboard'
    ]
  }],
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
  },
  slotDuration: {
    type: Number,
    default: 60, // in minutes
    enum: [30, 60, 90, 120]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvalInfo: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for geospatial queries
turfSchema.index({ 'location.coordinates': '2dsphere' });
turfSchema.index({ owner: 1, status: 1 });
turfSchema.index({ status: 1, 'address.city': 1 });

module.exports = mongoose.model('Turf', turfSchema);
