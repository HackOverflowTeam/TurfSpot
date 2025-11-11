const Booking = require('../models/Booking.model');
const Turf = require('../models/Turf.model');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

// Calculate pricing
const calculatePricing = (basePrice, paymentMethod = 'commission') => {
  if (paymentMethod === 'tier') {
    // For tier-based: owner gets full amount, no platform commission
    return {
      basePrice,
      platformFee: 0,
      ownerEarnings: basePrice,
      taxes: 0,
      totalAmount: basePrice
    };
  }
  
  // For commission-based: platform takes commission
  const platformCommission = 10; // 10% commission for platform
  const platformFee = (basePrice * platformCommission) / 100;
  const ownerEarnings = basePrice - platformFee;
  const totalAmount = basePrice; // Customer pays the base price only

  return {
    basePrice,
    platformFee: Math.round(platformFee * 100) / 100,
    ownerEarnings: Math.round(ownerEarnings * 100) / 100,
    taxes: 0,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};

// @desc    Create booking and initiate payment
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const {
      turfId,
      bookingDate,
      timeSlot,
      timeSlots,
      sport,
      playerDetails,
      notes,
      paymentMethod = 'online' // 'online' or 'cash_at_turf'
    } = req.body;

    // Support both single timeSlot and multiple timeSlots
    let slotsToBook = [];
    if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
      slotsToBook = timeSlots;
    } else if (timeSlot) {
      slotsToBook = [timeSlot];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Time slot(s) required'
      });
    }

    // Validate turf exists and is approved
    const turf = await Turf.findById(turfId);
    if (!turf || turf.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Turf not found or not available'
      });
    }

    // Check if any slot is already booked
    const bookingDateObj = new Date(bookingDate);
    for (const slot of slotsToBook) {
      const existingBooking = await Booking.findOne({
        turf: turfId,
        bookingDate: bookingDateObj,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          { 'timeSlot.startTime': slot.startTime },
          { 
            timeSlots: { 
              $elemMatch: { startTime: slot.startTime } 
            } 
          }
        ]
      });

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: `Slot ${slot.startTime} - ${slot.endTime} is already booked`
        });
      }
    }

    // Validate booking date is in future
    if (bookingDateObj < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    // Calculate pricing (multiply by number of slots)
    const isWeekend = [0, 6].includes(bookingDateObj.getDay());
    const basePricePerSlot = isWeekend ? turf.pricing.weekendRate : turf.pricing.hourlyRate;
    const totalBasePrice = basePricePerSlot * slotsToBook.length;
    const pricing = calculatePricing(totalBasePrice, turf.paymentMethod);

    // Handle Cash at Turf payment
    if (paymentMethod === 'cash_at_turf') {
      const booking = await Booking.create({
        turf: turfId,
        user: req.user._id,
        bookingDate: bookingDateObj,
        timeSlots: slotsToBook,
        timeSlot: {
          startTime: slotsToBook[0].startTime,
          endTime: slotsToBook[slotsToBook.length - 1].endTime
        },
        sport,
        pricing,
        payment: {
          method: 'cash_at_turf',
          status: 'pending_cash',
          cashCollected: false
        },
        playerDetails,
        notes,
        status: 'confirmed' // Confirmed but pending cash payment
      });

      await booking.populate([
        { path: 'turf', select: 'name address images pricing contactInfo' },
        { path: 'user', select: 'name email phone' }
      ]);

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed! Please pay cash at the turf.',
        data: {
          booking,
          paymentMethod: 'cash_at_turf',
          note: 'Remember to carry exact cash amount when you visit the turf.'
        }
      });
    }

    // For tier-based turfs, create booking without Razorpay
    if (turf.paymentMethod === 'tier') {
      const booking = await Booking.create({
        turf: turfId,
        user: req.user._id,
        bookingDate: bookingDateObj,
        timeSlots: slotsToBook,
        timeSlot: {
          startTime: slotsToBook[0].startTime,
          endTime: slotsToBook[slotsToBook.length - 1].endTime
        },
        sport,
        pricing,
        payment: {
          status: 'pending' // Will be marked completed after owner verification
        },
        tierPayment: {
          verificationStatus: 'pending'
        },
        playerDetails,
        notes,
        status: 'pending'
      });

      await booking.populate([
        { path: 'turf', select: 'name address images pricing upiQrCode' },
        { path: 'user', select: 'name email phone' }
      ]);

      return res.status(201).json({
        success: true,
        message: 'Booking created. Please upload payment screenshot.',
        data: {
          booking,
          paymentMethod: 'tier',
          upiQrCode: turf.upiQrCode
        }
      });
    }

    // For commission-based turfs: Create booking with platform payment (QR-based)
    const booking = await Booking.create({
      turf: turfId,
      user: req.user._id,
      bookingDate: bookingDateObj,
      timeSlots: slotsToBook,
      timeSlot: {
        startTime: slotsToBook[0].startTime,
        endTime: slotsToBook[slotsToBook.length - 1].endTime
      },
      sport,
      pricing,
      payment: {
        method: 'platform_qr',
        status: 'pending'
      },
      platformPayment: {
        verificationStatus: 'pending'
      },
      playerDetails,
      notes,
      status: 'pending'
    });

    // Populate booking data
    await booking.populate([
      { path: 'turf', select: 'name address images pricing owner' },
      { path: 'user', select: 'name email phone' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking created. Please complete payment via platform QR.',
      data: {
        booking,
        paymentMethod: 'platform_qr'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify payment and confirm booking
// @route   POST /api/bookings/:id/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, razorpaySignature } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${booking.payment.razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      booking.payment.status = 'failed';
      booking.status = 'cancelled';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update booking
    booking.payment.razorpayPaymentId = razorpayPaymentId;
    booking.payment.razorpaySignature = razorpaySignature;
    booking.payment.status = 'completed';
    booking.payment.paidAt = new Date();
    booking.status = 'confirmed';
    await booking.save();

    // Update turf booking count
    await Turf.findByIdAndUpdate(booking.turf, {
      $inc: { totalBookings: 1 }
    });

    await booking.populate([
      { path: 'turf', select: 'name address images' },
      { path: 'user', select: 'name email phone' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('turf', 'name address images pricing paymentMethod')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('turf', 'name address images pricing contactInfo')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization (user, turf owner, or admin)
    const turf = await Turf.findById(booking.turf._id);
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      turf.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel booking with QR-based refund verification
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { reason, qrImageUrl } = req.body;

    const booking = await Booking.findById(req.params.id).populate('turf');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled' || booking.status === 'pending_refund' || booking.status === 'refund_completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking already cancelled or refund already processed'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Check cancellation timing (e.g., at least 2 hours before)
    const bookingDateTime = new Date(booking.bookingDate);
    const [hours, minutes] = booking.timeSlot.startTime.split(':');
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes));

    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be cancelled at least 2 hours in advance'
      });
    }

    // Validate QR image and reason are provided
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    if (!qrImageUrl || !qrImageUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'QR code image is required for refund verification'
      });
    }

    // Calculate refund amount based on payment method
    // For tier-based (subscription): Full refund (100%)
    // For commission-based: 90% refund (10% cancellation fee)
    const isTierBased = booking.turf.paymentMethod === 'tier';
    const refundAmount = isTierBased 
      ? booking.pricing.totalAmount 
      : booking.pricing.totalAmount * 0.9;

    // Update booking with refund request
    booking.status = 'pending_refund';
    booking.cancellation = {
      cancelledBy: req.user._id,
      cancelledAt: new Date(),
      reason,
      refundAmount
    };
    
    booking.refundRequest = {
      qrImage: {
        url: qrImageUrl
      },
      reason,
      requestedAt: new Date(),
      requestedBy: req.user._id,
      status: 'pending',
      refundAmount
    };

    await booking.save();

    await booking.populate([
      { path: 'turf', select: 'name address owner' },
      { path: 'user', select: 'name email phone' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cancellation request sent. Awaiting refund confirmation from owner.',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get turf owner's bookings
// @route   GET /api/bookings/owner/bookings
// @access  Private (Owner only)
exports.getOwnerBookings = async (req, res) => {
  try {
    const { turfId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Get owner's turfs
    const ownerTurfs = await Turf.find({ owner: req.user._id }).select('_id');
    const turfIds = ownerTurfs.map(t => t._id);

    const query = { turf: { $in: turfIds } };

    if (turfId) {
      // Verify ownership
      if (!turfIds.some(id => id.toString() === turfId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
      query.turf = turfId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('turf', 'name address paymentMethod')
      .populate('user', 'name email phone')
      .sort({ bookingDate: -1, 'timeSlot.startTime': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload payment screenshot for tier-based booking
// @route   POST /api/bookings/:bookingId/tier-payment
// @access  Private (User)
exports.uploadTierPaymentScreenshot = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { screenshotUrl } = req.body;

    const booking = await Booking.findById(bookingId).populate('turf');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Verify this is a tier-based turf
    if (booking.turf.paymentMethod !== 'tier') {
      return res.status(400).json({
        success: false,
        message: 'This booking does not require payment screenshot'
      });
    }

    // Update booking with screenshot
    booking.tierPayment = {
      screenshot: {
        url: screenshotUrl
      },
      uploadedAt: new Date(),
      verificationStatus: 'pending'
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment screenshot uploaded. Waiting for owner verification.',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify tier payment by owner
// @route   PUT /api/bookings/:bookingId/verify-tier-payment
// @access  Private (Owner)
exports.verifyTierPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { approved, reason } = req.body;

    const booking = await Booking.findById(bookingId).populate('turf');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify owner owns this turf
    if (booking.turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Verify this is a tier-based turf
    if (booking.turf.paymentMethod !== 'tier') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not tier-based'
      });
    }

    if (approved) {
      booking.tierPayment.verificationStatus = 'approved';
      booking.tierPayment.verifiedBy = req.user._id;
      booking.tierPayment.verifiedAt = new Date();
      booking.payment.status = 'completed';
      booking.payment.paidAt = new Date();
      booking.status = 'confirmed';
    } else {
      booking.tierPayment.verificationStatus = 'rejected';
      booking.tierPayment.rejectionReason = reason;
      booking.status = 'cancelled';
      booking.cancellation = {
        cancelledBy: req.user._id,
        cancelledAt: new Date(),
        reason: 'Payment verification failed: ' + reason
      };
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: approved ? 'Booking confirmed successfully' : 'Booking rejected',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending tier payment verifications for owner
// @route   GET /api/bookings/owner/pending-verifications
// @access  Private (Owner)
exports.getPendingTierVerifications = async (req, res) => {
  try {
    // Get owner's tier-based turfs
    const ownerTurfs = await Turf.find({ 
      owner: req.user._id,
      paymentMethod: 'tier'
    }).select('_id');
    
    const turfIds = ownerTurfs.map(t => t._id);

    const bookings = await Booking.find({
      turf: { $in: turfIds },
      'tierPayment.verificationStatus': 'pending'
    })
      .populate('turf', 'name address')
      .populate('user', 'name email phone')
      .sort({ 'tierPayment.uploadedAt': 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending refund requests for owner
// @route   GET /api/bookings/owner/pending-refunds
// @access  Private (Owner)
exports.getPendingRefundRequests = async (req, res) => {
  try {
    // Get owner's turfs
    const ownerTurfs = await Turf.find({ 
      owner: req.user._id
    }).select('_id');
    
    const turfIds = ownerTurfs.map(t => t._id);

    const bookings = await Booking.find({
      turf: { $in: turfIds },
      status: 'pending_refund',
      'refundRequest.status': 'pending'
    })
      .populate('turf', 'name address pricing')
      .populate('user', 'name email phone')
      .populate('refundRequest.requestedBy', 'name')
      .sort({ 'refundRequest.requestedAt': 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Confirm or reject refund request
// @route   PUT /api/bookings/:bookingId/refund-decision
// @access  Private (Owner)
exports.processRefundDecision = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { approved, verificationNote } = req.body;

    const booking = await Booking.findById(bookingId).populate('turf');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify owner owns this turf
    if (booking.turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this refund'
      });
    }

    // Verify booking is in correct state
    if (booking.status !== 'pending_refund' || booking.refundRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Refund request is not pending or already processed'
      });
    }

    if (approved) {
      // Approve refund
      booking.refundRequest.status = 'approved';
      booking.refundRequest.verifiedBy = req.user._id;
      booking.refundRequest.verifiedAt = new Date();
      booking.refundRequest.verificationNote = verificationNote || 'Refund approved by owner';
      booking.status = 'refund_completed';
      
      // Process actual refund if payment was via Razorpay
      if (booking.payment.status === 'completed' && booking.payment.razorpayPaymentId) {
        try {
          const refund = await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
            amount: Math.round(booking.refundRequest.refundAmount * 100), // Amount in paise
            speed: 'normal'
          });

          booking.payment.refundId = refund.id;
          booking.payment.status = 'refunded';
          booking.payment.refundedAt = new Date();
        } catch (refundError) {
          console.error('Refund error:', refundError);
          // Continue even if Razorpay refund fails - owner confirmed manually
        }
      }
    } else {
      // Reject refund
      booking.refundRequest.status = 'rejected';
      booking.refundRequest.verifiedBy = req.user._id;
      booking.refundRequest.verifiedAt = new Date();
      booking.refundRequest.verificationNote = verificationNote || 'Refund request rejected by owner';
      booking.status = 'refund_denied';
    }

    await booking.save();

    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'refundRequest.verifiedBy', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: approved ? 'Refund confirmed successfully' : 'Refund request rejected',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Mark cash as collected (Owner only)
// @route   PATCH /api/bookings/:id/cash-collected
// @access  Private (Owner)
exports.markCashCollected = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const booking = await Booking.findById(req.params.id)
      .populate('turf', 'owner name')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify owner
    if (booking.turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Verify payment method is cash
    if (booking.payment.method !== 'cash_at_turf') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not cash payment'
      });
    }

    // Verify not already collected
    if (booking.payment.cashCollected) {
      return res.status(400).json({
        success: false,
        message: 'Cash already collected for this booking'
      });
    }

    // Mark as collected
    booking.payment.cashCollected = true;
    booking.payment.cashCollectedAt = new Date();
    booking.payment.cashCollectedBy = req.user._id;
    booking.payment.cashCollectionNotes = notes;
    booking.payment.status = 'completed';
    booking.payment.paidAt = new Date();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Cash collection confirmed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Mark cash collected error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark cash as collected'
    });
  }
};

// @desc    Get cash payment bookings for owner
// @route   GET /api/bookings/owner/cash-payments
// @access  Private (Owner)
exports.getCashPaymentBookings = async (req, res) => {
  try {
    const { status = 'all', turfId } = req.query;

    // Get owner's turfs
    const ownerTurfs = await Turf.find({ owner: req.user._id }).select('_id');
    const turfIds = ownerTurfs.map(t => t._id);

    // Build query
    const query = {
      turf: { $in: turfIds },
      'payment.method': 'cash_at_turf'
    };

    if (turfId) {
      query.turf = turfId;
    }

    if (status === 'pending') {
      query['payment.cashCollected'] = false;
    } else if (status === 'collected') {
      query['payment.cashCollected'] = true;
    }

    const bookings = await Booking.find(query)
      .populate('turf', 'name address images')
      .populate('user', 'name email phone')
      .populate('payment.cashCollectedBy', 'name')
      .sort({ bookingDate: -1, 'timeSlot.startTime': 1 });

    // Calculate stats
    const stats = {
      totalCashBookings: await Booking.countDocuments({
        turf: { $in: turfIds },
        'payment.method': 'cash_at_turf'
      }),
      pendingCollection: await Booking.countDocuments({
        turf: { $in: turfIds },
        'payment.method': 'cash_at_turf',
        'payment.cashCollected': false
      }),
      collectedToday: await Booking.countDocuments({
        turf: { $in: turfIds },
        'payment.method': 'cash_at_turf',
        'payment.cashCollected': true,
        'payment.cashCollectedAt': {
          $gte: new Date().setHours(0, 0, 0, 0)
        }
      })
    };

    res.status(200).json({
      success: true,
      data: {
        bookings,
        stats,
        count: bookings.length
      }
    });
  } catch (error) {
    console.error('Get cash payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cash payment bookings'
    });
  }
};
