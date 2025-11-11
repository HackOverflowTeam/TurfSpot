const Subscription = require('../models/subscription.model');
const Turf = require('../models/Turf.model');
const { AppError } = require('../middleware/error.middleware');

// Get all subscription plans
exports.getPlans = async (req, res, next) => {
  try {
    const plans = Subscription.getPlans();
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

// Create a new subscription
exports.createSubscription = async (req, res, next) => {
  try {
    const { plan, billingCycle } = req.body;
    const ownerId = req.user._id;

    // Check if owner already has an active subscription
    const existingActiveSubscription = await Subscription.hasActiveSubscription(ownerId);
    if (existingActiveSubscription) {
      return next(new AppError('You already have an active subscription', 400));
    }

    // Check if owner has a pending subscription
    const existingPendingSubscription = await Subscription.findOne({
      ownerId,
      status: 'pending'
    });
    
    if (existingPendingSubscription) {
      return res.status(200).json({
        success: true,
        message: 'You already have a pending subscription. Please upload payment proof to activate it.',
        data: existingPendingSubscription
      });
    }

    // Allow new subscription even if previous ones were cancelled/expired

    // Validate plan and billing cycle
    const plans = Subscription.getPlans();
    if (!plans[plan]) {
      return next(new AppError('Invalid subscription plan', 400));
    }

    if (plan === 'enterprise') {
      return res.status(200).json({
        success: true,
        message: 'Please contact us for enterprise plan pricing',
        contactEmail: 'enterprise@turfspot.com',
        contactPhone: '+91-1234567890'
      });
    }

    if (!plans[plan][billingCycle]) {
      return next(new AppError('Invalid billing cycle for selected plan', 400));
    }

    const { price, maxTurfs, durationDays } = plans[plan][billingCycle];

    // Set features based on plan
    const features = {
      dynamicPricing: plan === 'pro' || plan === 'enterprise',
      advancedAnalytics: plan === 'pro' || plan === 'enterprise',
      prioritySupport: plan === 'pro' || plan === 'enterprise',
      dedicatedManager: plan === 'enterprise',
      apiAccess: plan === 'enterprise'
    };

    // Create subscription
    const subscription = await Subscription.create({
      ownerId,
      plan,
      billingCycle,
      durationDays,
      price,
      maxTurfs,
      features,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created. Please upload payment proof to activate.',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Upload payment proof for subscription
exports.uploadPaymentProof = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { paymentProofUrl } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return next(new AppError('Subscription not found', 404));
    }

    // Verify ownership
    if (subscription.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this subscription', 403));
    }

    if (subscription.status === 'active') {
      return next(new AppError('Subscription is already active', 400));
    }

    subscription.paymentProof = {
      url: paymentProofUrl,
      uploadedAt: new Date()
    };
    subscription.status = 'pending'; // Waiting for admin verification

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully. Waiting for admin verification.',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Get owner's subscription status
exports.getMySubscription = async (req, res, next) => {
  try {
    // Only get active or pending subscriptions (ignore cancelled/expired)
    const subscription = await Subscription.findOne({
      ownerId: req.user._id,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No subscription found'
      });
    }

    // Check turf count
    const turfCount = await Turf.countDocuments({
      owner: req.user._id,
      status: { $ne: 'deleted' }
    });

    // Check expiry status
    const expiryInfo = subscription ? {
      isExpiringSoon: subscription.isExpiringSoon(),
      daysUntilExpiry: subscription.getDaysUntilExpiry(),
      isActive: subscription.isActive()
    } : null;

    res.status(200).json({
      success: true,
      data: {
        subscription,
        currentTurfCount: turfCount,
        canAddMoreTurfs: subscription ? await subscription.canAddTurf() : false,
        expiryInfo
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return next(new AppError('Subscription not found', 404));
    }

    // Verify ownership
    if (subscription.ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to cancel this subscription', 403));
    }

    subscription.status = 'cancelled';
    subscription.notes = reason || 'Cancelled by owner';
    subscription.endDate = new Date();

    await subscription.save();

    // Update turfs to commission-based
    await Turf.updateMany(
      { owner: req.user._id, paymentMethod: 'tier' },
      { paymentMethod: 'commission', subscription: null }
    );

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully. Your turfs have been switched to commission-based payment.',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Verify subscription payment
exports.verifySubscriptionPayment = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { approved, reason } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return next(new AppError('Subscription not found', 404));
    }

    if (approved) {
      // Calculate end date based on duration in days
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      // Add duration days to start date
      endDate.setDate(endDate.getDate() + subscription.durationDays);

      subscription.status = 'active';
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.verifiedBy = req.user._id;
      subscription.verifiedAt = new Date();
    } else {
      subscription.status = 'cancelled';
      subscription.notes = reason || 'Payment verification failed';
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: approved ? 'Subscription activated successfully' : 'Subscription rejected',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all subscriptions
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, plan, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    const subscriptions = await Subscription.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscription.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
