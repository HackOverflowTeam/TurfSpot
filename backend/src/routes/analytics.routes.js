const express = require('express');
const {
  getOwnerAnalytics,
  getRevenueReport,
  getBookingCalendar
} = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require owner/admin authentication
router.use(protect);
router.use(authorize('owner', 'admin'));

router.get('/owner', getOwnerAnalytics);
router.get('/owner/revenue', getRevenueReport);
router.get('/owner/calendar', getBookingCalendar);

module.exports = router;
