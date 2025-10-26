const express = require('express');
const razorpay = require('../config/razorpay');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private
router.get('/:paymentId', protect, async (req, res) => {
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
