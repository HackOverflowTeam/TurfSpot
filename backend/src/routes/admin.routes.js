const express = require('express');
const { body } = require('express-validator');
const {
  getPendingTurfs,
  approveTurf,
  rejectTurf,
  suspendTurf,
  getAllUsers,
  updateUserStatus,
  getDashboardStats,
  getAllBookings,
  getPendingPayouts,
  markBookingAsPaid,
  getPayoutHistory
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Turf management
router.get('/turfs/pending', getPendingTurfs);
router.put('/turfs/:id/approve', approveTurf);
router.put(
  '/turfs/:id/reject',
  [body('reason').notEmpty().withMessage('Rejection reason is required')],
  validate,
  rejectTurf
);
router.put('/turfs/:id/suspend', suspendTurf);

// User management
router.get('/users', getAllUsers);
router.put(
  '/users/:id/status',
  [body('isActive').isBoolean().withMessage('isActive must be a boolean')],
  validate,
  updateUserStatus
);

// Booking management
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/payout', markBookingAsPaid);

// Payout management
router.get('/payouts/pending', getPendingPayouts);
router.get('/payouts/history', getPayoutHistory);

module.exports = router;
