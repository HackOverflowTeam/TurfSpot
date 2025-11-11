const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes
router.get('/platform-qr', transactionController.getPlatformQR);

// User routes - submit payment proof
router.post('/submit-proof/:bookingId', protect, transactionController.submitPaymentProof);

// Owner routes - view their earnings
router.get('/owner-earnings/:ownerId', protect, transactionController.getOwnerEarnings);
router.get('/owner-daily-earnings', protect, authorize('owner'), transactionController.getOwnerDailyEarnings);

// Admin routes - payment verification
router.post('/verify/:bookingId', protect, authorize('admin'), transactionController.verifyPaymentProof);
router.get('/pending-verifications', protect, authorize('admin'), transactionController.getPendingVerifications);

// Admin routes - transaction viewing
router.get('/turf/:turfId', protect, authorize('admin'), transactionController.getTransactionsByTurf);
router.get('/platform-summary', protect, authorize('admin'), transactionController.getPlatformSummary);

// Admin routes - payout management
router.get('/pending-payouts', protect, authorize('admin'), transactionController.getPendingPayouts);
router.get('/daily-payouts', protect, authorize('admin'), transactionController.getDailyPayouts);
router.post('/complete-payout/:transactionId', protect, authorize('admin'), transactionController.completePayout);
router.post('/bulk-payout/:ownerId', protect, authorize('admin'), transactionController.bulkCompletePayout);

// Admin routes - platform QR management
router.post('/platform-qr', protect, authorize('admin'), transactionController.updatePlatformQR);

// Get specific transaction (must be last to avoid matching other routes)
router.get('/:transactionId', protect, transactionController.getTransactionDetails);

module.exports = router;
