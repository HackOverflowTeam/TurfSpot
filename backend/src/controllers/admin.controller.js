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
    const [
      totalUsers,
      totalOwners,
      totalTurfs,
      approvedTurfs,
      pendingTurfs,
      totalBookings,
      completedBookings,
      revenueData
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
      ])
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
          ownerEarnings: revenue.ownerEarnings
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
    // Get all completed bookings that haven't been paid out yet
    const bookings = await Booking.find({
      'payment.status': 'completed',
      status: { $in: ['confirmed', 'completed'] },
      payoutStatus: 'pending'
    })
    .populate('turf', 'name')
    .populate('user', 'name email phone')
    .sort({ 'payment.paidAt': -1 });

    // Group by owner
    const groupedByOwner = {};
    
    for (const booking of bookings) {
      if (!booking.turf || !booking.turf.owner) continue;
      
      // Fetch turf with owner details
      const turfWithOwner = await Turf.findById(booking.turf._id).populate('owner', 'name email phone');
      if (!turfWithOwner) continue;

      const ownerId = turfWithOwner.owner._id.toString();
      
      if (!groupedByOwner[ownerId]) {
        groupedByOwner[ownerId] = {
          owner: turfWithOwner.owner,
          bookings: [],
          totalRevenue: 0,
          platformFees: 0,
          ownerEarnings: 0,
          totalBookings: 0
        };
      }

      const ownerEarnings = booking.pricing.ownerEarnings || 
        (booking.pricing.totalAmount - booking.pricing.platformFee);

      groupedByOwner[ownerId].bookings.push(booking);
      groupedByOwner[ownerId].totalRevenue += booking.pricing.totalAmount;
      groupedByOwner[ownerId].platformFees += booking.pricing.platformFee;
      groupedByOwner[ownerId].ownerEarnings += ownerEarnings;
      groupedByOwner[ownerId].totalBookings += 1;
    }

    // Convert to array
    const payouts = Object.values(groupedByOwner);

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark booking as paid
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

