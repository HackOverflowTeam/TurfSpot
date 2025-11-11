const express = require('express');
const { body } = require('express-validator');
const {
  createTurf,
  getTurfs,
  getTurf,
  updateTurf,
  deleteTurf,
  getMyTurfs,
  getAvailableSlots,
  searchTurfs
} = require('../controllers/turf.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

// Validation rules
const createTurfValidation = [
  body('name').notEmpty().trim().withMessage('Turf name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.pincode').matches(/^[0-9]{6}$/).withMessage('Valid 6-digit pincode is required'),
  body('contactInfo.phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('sportsSupported').isArray({ min: 1 }).withMessage('At least one sport must be supported'),
  body('pricing.hourlyRate').isNumeric().withMessage('Hourly rate must be a number')
];

// Public routes (with optional auth for getTurf to allow owners/admins to see pending turfs)
router.get('/', getTurfs);
router.get('/:id/available-slots', getAvailableSlots);

// Admin search route (for autocomplete) - must be before /:id route to avoid conflicts
router.get('/admin/search', protect, authorize('admin'), searchTurfs);

// Continue with other routes
router.get('/:id', optionalAuth, getTurf);

// Protected routes
router.use(protect);

// Owner routes
router.post('/', authorize('owner', 'admin'), createTurfValidation, validate, createTurf);
router.put('/:id', authorize('owner', 'admin'), updateTurf);
router.delete('/:id', authorize('owner', 'admin'), deleteTurf);
router.get('/owner/my-turfs', authorize('owner', 'admin'), getMyTurfs);

module.exports = router;
