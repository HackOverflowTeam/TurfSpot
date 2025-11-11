const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['1_month', '3_months'],
    required: true
  },
  durationDays: {
    type: Number,
    required: true,
    default: function() {
      return this.billingCycle === '3_months' ? 90 : 30;
    }
  },
  price: {
    type: Number,
    required: true
  },
  maxTurfs: {
    type: Number,
    required: true
  },
  features: {
    dynamicPricing: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    dedicatedManager: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  paymentProof: {
    url: String,
    uploadedAt: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  notes: String
}, {
  timestamps: true
});

// Index for finding active subscriptions
subscriptionSchema.index({ ownerId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.endDate > new Date();
};

// Method to check if subscription is expiring soon (within 5 days)
subscriptionSchema.methods.isExpiringSoon = function() {
  if (this.status !== 'active') return false;
  
  const daysUntilExpiry = Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry > 0 && daysUntilExpiry <= 5;
};

// Method to get days until expiry
subscriptionSchema.methods.getDaysUntilExpiry = function() {
  if (this.status !== 'active') return 0;
  
  const daysUntilExpiry = Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntilExpiry);
};

// Method to check if owner can add more turfs
subscriptionSchema.methods.canAddTurf = async function() {
  if (this.plan === 'enterprise') return true;
  
  const Turf = mongoose.model('Turf');
  const turfCount = await Turf.countDocuments({ 
    ownerId: this.ownerId,
    status: { $ne: 'deleted' }
  });
  
  return turfCount < this.maxTurfs;
};

// Static method to get subscription plans
subscriptionSchema.statics.getPlans = function() {
  return {
    basic: {
      '1_month': { price: 700, maxTurfs: 1, name: 'Basic Plan - 1 Month', durationDays: 30 },
      '3_months': { price: 2000, maxTurfs: 1, name: 'Basic Plan - 3 Months', durationDays: 90 }
    },
    pro: {
      '1_month': { price: 3000, maxTurfs: 5, name: 'Pro Plan - 1 Month', durationDays: 30 },
      '3_months': { price: 6000, maxTurfs: 5, name: 'Pro Plan - 3 Months', durationDays: 90 }
    },
    enterprise: {
      custom: true,
      maxTurfs: -1, // unlimited
      name: 'Enterprise Plan',
      contactEmail: 'enterprise@turfspot.com',
      contactPhone: '+91-1234567890',
      features: ['Unlimited turfs', 'White-label options', 'Custom integrations', 'Priority support', 'Dedicated account manager']
    }
  };
};

// Static method to check if owner has active subscription
subscriptionSchema.statics.hasActiveSubscription = async function(ownerId) {
  const subscription = await this.findOne({
    ownerId,
    status: 'active',
    endDate: { $gt: new Date() }
  });
  
  return subscription;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
