const express = require('express');
const { body, check } = require('express-validator');
const {
  createBooking,
  verifyPayment,
  getMyBookings,
  getBooking,
  cancelBooking,
  getOwnerBookings
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

// Custom validation for time slots (supports both single timeSlot and multiple timeSlots)
const validateTimeSlots = check('*').custom((value, { req }) => {
  const { timeSlot, timeSlots } = req.body;
  
  // Check if either timeSlot or timeSlots is provided
  if (!timeSlot && (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0)) {
    throw new Error('Either timeSlot or timeSlots is required');
  }

  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

  // Validate single timeSlot if provided
  if (timeSlot) {
    if (!timeSlot.startTime || !timePattern.test(timeSlot.startTime)) {
      throw new Error('Valid start time is required for timeSlot (HH:MM)');
    }
    if (!timeSlot.endTime || !timePattern.test(timeSlot.endTime)) {
      throw new Error('Valid end time is required for timeSlot (HH:MM)');
    }
  }

  // Validate timeSlots array if provided
  if (timeSlots && Array.isArray(timeSlots)) {
    if (timeSlots.length === 0) {
      throw new Error('At least one time slot is required');
    }
    
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      if (!slot.startTime || !timePattern.test(slot.startTime)) {
        throw new Error(`Valid start time is required for slot ${i + 1} (HH:MM)`);
      }
      if (!slot.endTime || !timePattern.test(slot.endTime)) {
        throw new Error(`Valid end time is required for slot ${i + 1} (HH:MM)`);
      }
    }
  }

  return true;
});

// Validation rules
const createBookingValidation = [
  body('turfId').notEmpty().withMessage('Turf ID is required'),
  body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
  validateTimeSlots,
  body('sport').notEmpty().withMessage('Sport is required')
];

const verifyPaymentValidation = [
  body('razorpayPaymentId').notEmpty().withMessage('Payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Payment signature is required')
];

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createBookingValidation, validate, createBooking);
router.post('/:id/verify-payment', verifyPaymentValidation, validate, verifyPayment);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);

// Owner routes
router.get('/owner/bookings', authorize('owner', 'admin'), getOwnerBookings);

module.exports = router;
