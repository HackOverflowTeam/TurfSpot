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
    enum: ['monthly', 'annual'],
    required: true
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
      monthly: { price: 699, maxTurfs: 1, name: 'Basic Plan (Launch Offer)' },
      annual: { price: 600, maxTurfs: 1, name: 'Basic Plan (Launch Offer)' }
    },
    pro: {
      monthly: { price: 1999, maxTurfs: 5, name: 'Pro Plan (Best Value)' },
      annual: { price: 3000, maxTurfs: 5, name: 'Pro Plan (Best Value)' }
    },
    enterprise: {
      custom: true,
      maxTurfs: -1, // unlimited
      name: 'Enterprise Plan'
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
