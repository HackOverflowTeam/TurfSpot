const express = require('express');
const router = express.Router();
const {
  getPlans,
  createSubscription,
  uploadPaymentProof,
  getMySubscription,
  cancelSubscription,
  verifySubscriptionPayment,
  getAllSubscriptions
} = require('../controllers/subscription.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes
router.get('/plans', getPlans);

// Admin routes (must be before owner routes)
router.put('/admin/:subscriptionId/verify', protect, authorize('admin'), verifySubscriptionPayment);
router.get('/admin/all', protect, authorize('admin'), getAllSubscriptions);

// Owner routes
router.post('/', protect, authorize('owner'), createSubscription);
router.post('/:subscriptionId/payment-proof', protect, authorize('owner'), uploadPaymentProof);
router.get('/my-subscription', protect, authorize('owner'), getMySubscription);
router.put('/:subscriptionId/cancel', protect, authorize('owner'), cancelSubscription);

module.exports = router;
