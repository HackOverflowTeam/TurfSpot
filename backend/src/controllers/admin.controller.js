const Turf = require('../models/Turf.model');
const User = require('../models/User.model');
const Booking = require('../models/Booking.model');
const Payout = require('../models/Payout.model');

// @desc    Get all pending turfs for approval
// @route   GET /api/admin/turfs/pending
// @access  Private (Admin only)
exports.getPendingTurfs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const turfs = await Turf.find({ status: 'pending' })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Turf.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      count: turfs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: turfs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve turf
// @route   PUT /api/admin/turfs/:id/approve
// @access  Private (Admin only)
exports.approveTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: 'Turf not found'
      });
    }

    if (turf.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Turf is not pending approval'
      });
    }

    turf.status = 'approved';
    turf.approvalInfo = {
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    await turf.save();

    res.status(200).json({
      success: true,
      message: 'Turf approved successfully',
      data: turf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject turf
// @route   PUT /api/admin/turfs/:id/reject
// @access  Private (Admin only)
exports.rejectTurf = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: 'Turf not found'
      });
    }

    if (turf.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Turf is not pending approval'
      });
    }

    turf.status = 'rejected';
    turf.approvalInfo = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      rejectionReason: reason
    };

    await turf.save();

    res.status(200).json({
      success: true,
      message: 'Turf rejected',
      data: turf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Suspend turf
// @route   PUT /api/admin/turfs/:id/suspend
// @access  Private (Admin only)
exports.suspendTurf = async (req, res) => {
  try {
    const { reason } = req.body;

    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: 'Turf not found'
      });
    }

    turf.status = 'suspended';
    turf.isActive = false;
    turf.approvalInfo.rejectionReason = reason;

    await turf.save();

    res.status(200).json({
      success: true,
      message: 'Turf suspended',
      data: turf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own status'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const Subscription = require('../models/subscription.model');
    
    const [
      totalUsers,
      totalOwners,
      totalTurfs,
      approvedTurfs,
      pendingTurfs,
      totalBookings,
      completedBookings,
      revenueData,
      activeSubscriptions,
      pendingSubscriptions
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'owner' }),
      Turf.countDocuments(),
      Turf.countDocuments({ status: 'approved' }),
      Turf.countDocuments({ status: 'pending' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Booking.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { 
          $group: { 
            _id: null, 
            totalRevenue: { $sum: '$pricing.totalAmount' },
            platformEarnings: { $sum: '$pricing.platformFee' },
            ownerEarnings: { 
              $sum: { 
                $ifNull: [
                  '$pricing.ownerEarnings', 
                  { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
                ] 
              } 
            }
          } 
        }
      ]),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'pending' })
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('turf', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          'payment.paidAt': { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$payment.paidAt' },
            month: { $month: '$payment.paidAt' }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          platformEarnings: { $sum: '$pricing.platformFee' },
          ownerEarnings: { 
            $sum: { 
              $ifNull: [
                '$pricing.ownerEarnings', 
                { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              ] 
            } 
          },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      platformEarnings: 0,
      ownerEarnings: 0
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOwners,
          totalTurfs,
          approvedTurfs,
          pendingTurfs,
          totalBookings,
          completedBookings,
          totalRevenue: revenue.totalRevenue,
          platformEarnings: revenue.platformEarnings,
          ownerEarnings: revenue.ownerEarnings,
          activeSubscriptions,
          pendingSubscriptions
        },
        recentBookings,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin only)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('turf', 'name address')
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

// @desc    Get pending payouts to owners
// @route   GET /api/admin/payouts/pending
// @access  Private (Admin only)
exports.getPendingPayouts = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction.model');
    
    // Get all verified transactions with pending payout status
    const transactions = await Transaction.find({
      paymentStatus: 'verified',
      payoutStatus: 'pending'
    })
    .populate('turf', 'name')
    .populate('owner', 'name email phone upiId')
    .populate('user', 'name email phone')
    .populate('booking', 'bookingDate timeSlot')
    .sort({ verifiedAt: -1 });

    // Group by owner and turf for better organization
    const groupedByOwner = {};
    
    for (const transaction of transactions) {
      if (!transaction.owner) continue;
      
      const ownerId = transaction.owner._id.toString();
      const turfId = transaction.turf?._id.toString();
      
      if (!groupedByOwner[ownerId]) {
        groupedByOwner[ownerId] = {
          owner: {
            _id: transaction.owner._id,
            name: transaction.owner.name,
            email: transaction.owner.email,
            phone: transaction.owner.phone,
            upiId: transaction.owner.upiId
          },
          turfs: {},
          totalRevenue: 0,
          platformFees: 0,
          ownerEarnings: 0,
          totalBookings: 0
        };
      }

      // Group by turf within owner
      if (turfId && !groupedByOwner[ownerId].turfs[turfId]) {
        groupedByOwner[ownerId].turfs[turfId] = {
          turfName: transaction.turf?.name || 'Unknown Turf',
          transactions: [],
          totalAmount: 0,
          platformCommission: 0,
          ownerPayout: 0,
          count: 0
        };
      }

      // Add to owner totals
      groupedByOwner[ownerId].totalRevenue += transaction.totalAmount;
      groupedByOwner[ownerId].platformFees += transaction.platformCommission;
      groupedByOwner[ownerId].ownerEarnings += transaction.ownerPayout;
      groupedByOwner[ownerId].totalBookings += 1;

      // Add to turf totals
      if (turfId) {
        const turfData = groupedByOwner[ownerId].turfs[turfId];
        turfData.transactions.push({
          _id: transaction._id,
          transactionId: transaction.transactionId,
          user: transaction.user,
          booking: transaction.booking,
          bookingDate: transaction.bookingSnapshot?.date || transaction.booking?.bookingDate,
          timeSlot: transaction.bookingSnapshot?.timeSlot || transaction.booking?.timeSlot,
          totalAmount: transaction.totalAmount,
          platformCommission: transaction.platformCommission,
          ownerPayout: transaction.ownerPayout,
          verifiedAt: transaction.verifiedAt
        });
        turfData.totalAmount += transaction.totalAmount;
        turfData.platformCommission += transaction.platformCommission;
        turfData.ownerPayout += transaction.ownerPayout;
        turfData.count += 1;
      }
    }

    // Convert to array and format
    const payouts = Object.values(groupedByOwner).map(ownerData => ({
      owner: ownerData.owner,
      turfs: Object.values(ownerData.turfs),
      totalRevenue: ownerData.totalRevenue,
      platformFees: ownerData.platformFees,
      ownerEarnings: ownerData.ownerEarnings,
      totalBookings: ownerData.totalBookings
    }));

    // Calculate totals
    const totals = payouts.reduce((acc, payout) => ({
      totalOwners: acc.totalOwners + 1,
      totalBookings: acc.totalBookings + payout.totalBookings,
      totalRevenue: acc.totalRevenue + payout.totalRevenue,
      totalPlatformFees: acc.totalPlatformFees + payout.platformFees,
      totalOwnerEarnings: acc.totalOwnerEarnings + payout.ownerEarnings
    }), {
      totalOwners: 0,
      totalBookings: 0,
      totalRevenue: 0,
      totalPlatformFees: 0,
      totalOwnerEarnings: 0
    });

    res.status(200).json({
      success: true,
      data: {
        payouts,
        summary: totals
      }
    });
  } catch (error) {
    console.error('Error in getPendingPayouts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark transaction as paid
// @route   PUT /api/admin/transactions/:id/mark-paid
// @access  Private (Admin only)
exports.markTransactionAsPaid = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction.model');
    const { paymentMethod, notes, transactionReference } = req.body;

    const transaction = await Transaction.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('turf', 'name');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.payoutStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Transaction already paid out'
      });
    }

    // Update transaction payout status
    transaction.payoutStatus = 'completed';
    transaction.payoutCompletedAt = new Date();
    transaction.payoutCompletedBy = req.user._id;
    transaction.payoutMethod = paymentMethod || 'upi';
    transaction.payoutNotes = notes || '';
    transaction.payoutReference = transactionReference || '';

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction marked as paid',
      data: transaction
    });
  } catch (error) {
    console.error('Error marking transaction as paid:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark booking as paid (legacy support)
// @route   PUT /api/admin/bookings/:id/payout
// @access  Private (Admin only)
exports.markBookingAsPaid = async (req, res) => {
  try {
    const { transactionId, paymentMethod, notes } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('turf', 'name owner')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking payment not completed'
      });
    }

    if (booking.payoutStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking already paid out'
      });
    }

    // Update booking payout status
    booking.payoutStatus = 'paid';
    booking.payoutDetails = {
      paidAt: new Date(),
      paidBy: req.user._id,
      transactionId,
      paymentMethod,
      notes
    };

    await booking.save();

    await booking.populate('payoutDetails.paidBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Booking marked as paid',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payout history
// @route   GET /api/admin/payouts/history
// @access  Private (Admin only)
exports.getPayoutHistory = async (req, res) => {
  try {
    const { ownerId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      'payment.status': 'completed',
      payoutStatus: 'paid'
    };
    
    if (startDate || endDate) {
      query['payoutDetails.paidAt'] = {};
      if (startDate) query['payoutDetails.paidAt'].$gte = new Date(startDate);
      if (endDate) query['payoutDetails.paidAt'].$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('turf', 'name owner')
      .populate('user', 'name email phone')
      .populate('payoutDetails.paidBy', 'name email')
      .sort({ 'payoutDetails.paidAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate turf owner
    for (const booking of bookings) {
      if (booking.turf) {
        await booking.turf.populate('owner', 'name email phone');
      }
    }

    // Filter by owner if specified
    let filteredBookings = bookings;
    if (ownerId) {
      filteredBookings = bookings.filter(b => 
        b.turf && b.turf.owner && b.turf.owner._id.toString() === ownerId
      );
    }

    const total = await Booking.countDocuments(query);

    // Get summary
    const summary = filteredBookings.reduce((acc, booking) => {
      const ownerEarnings = booking.pricing.ownerEarnings || 
        (booking.pricing.totalAmount - booking.pricing.platformFee);
      
      return {
        totalPayouts: acc.totalPayouts + 1,
        totalAmount: acc.totalAmount + ownerEarnings,
        totalRevenue: acc.totalRevenue + booking.pricing.totalAmount,
        totalPlatformFee: acc.totalPlatformFee + booking.pricing.platformFee
      };
    }, {
      totalPayouts: 0,
      totalAmount: 0,
      totalRevenue: 0,
      totalPlatformFee: 0
    });

    res.status(200).json({
      success: true,
      count: filteredBookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      summary,
      data: filteredBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

