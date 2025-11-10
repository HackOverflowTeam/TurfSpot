const Booking = require('../models/Booking.model');
const Turf = require('../models/Turf.model');

// @desc    Get owner analytics
// @route   GET /api/analytics/owner
// @access  Private (Owner only)
exports.getOwnerAnalytics = async (req, res) => {
  try {
    const { turfId, period = '30' } = req.query; // period in days

    // Get owner's turfs
    const ownerTurfs = await Turf.find({ owner: req.user._id }).select('_id');
    const turfIds = ownerTurfs.map(t => t._id);

    if (turfIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          overview: {
            totalBookings: 0,
            completedBookings: 0,
            totalRevenue: 0,
            platformFees: 0
          },
          dailyBookings: [],
          popularSlots: [],
          sportBreakdown: []
        }
      });
    }

    // Build query
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

    // Date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    query.createdAt = { $gte: startDate };

    // Total bookings
    const totalBookings = await Booking.countDocuments(query);

    // Completed bookings
    const completedBookings = await Booking.countDocuments({
      ...query,
      status: 'completed'
    });

    // Revenue calculation
    const revenueData = await Booking.aggregate([
      { $match: { ...query, 'payment.status': 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.totalAmount' },
          platformFees: { $sum: '$pricing.platformFee' },
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
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      platformFees: 0,
      ownerEarnings: 0
    };

    // Daily bookings trend
    const dailyBookings = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.basePrice' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Most booked time slots
    const popularSlots = await Booking.aggregate([
      { $match: { ...query, status: { $in: ['confirmed', 'completed'] } } },
      {
        $group: {
          _id: '$timeSlot.startTime',
          bookings: { $sum: 1 }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 }
    ]);

    // Sport-wise breakdown
    const sportBreakdown = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$sport',
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.basePrice' }
        }
      },
      { $sort: { bookings: -1 } }
    ]);

    // Booking status breakdown
    const statusBreakdown = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Unique customers
    const uniqueCustomersData = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $count: 'total'
      }
    ]);
    const uniqueCustomers = uniqueCustomersData[0]?.total || 0;

    // Calculate yearly revenue (last 365 days)
    const yearStartDate = new Date();
    yearStartDate.setDate(yearStartDate.getDate() - 365);
    
    const yearlyQuery = {
      turf: { $in: turfIds },
      'payment.status': 'completed',
      createdAt: { $gte: yearStartDate }
    };
    
    const yearlyRevenueData = await Booking.aggregate([
      { $match: yearlyQuery },
      {
        $group: {
          _id: null,
          yearlyRevenue: { 
            $sum: { 
              $ifNull: [
                '$pricing.ownerEarnings', 
                { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              ] 
            } 
          }
        }
      }
    ]);
    const yearlyRevenue = yearlyRevenueData[0]?.yearlyRevenue || 0;

    // Calculate previous month earnings for growth comparison
    const prevMonthStartDate = new Date();
    prevMonthStartDate.setDate(prevMonthStartDate.getDate() - parseInt(period) - 30);
    const prevMonthEndDate = new Date();
    prevMonthEndDate.setDate(prevMonthEndDate.getDate() - parseInt(period));
    
    const prevMonthQuery = {
      turf: { $in: turfIds },
      'payment.status': 'completed',
      createdAt: { $gte: prevMonthStartDate, $lt: prevMonthEndDate }
    };
    
    const prevMonthData = await Booking.aggregate([
      { $match: prevMonthQuery },
      {
        $group: {
          _id: null,
          previousMonthEarnings: { 
            $sum: { 
              $ifNull: [
                '$pricing.ownerEarnings', 
                { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              ] 
            } 
          }
        }
      }
    ]);
    const previousMonthEarnings = prevMonthData[0]?.previousMonthEarnings || 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalBookings,
          completedBookings,
          totalRevenue: revenue.totalRevenue,
          platformFees: revenue.platformFees,
          ownerEarnings: revenue.ownerEarnings,
          uniqueCustomers,
          yearlyRevenue,
          previousMonthEarnings,
          previousYearRevenue: 0 // Can be calculated if needed
        },
        dailyBookings,
        popularSlots,
        sportBreakdown,
        statusBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get revenue report
// @route   GET /api/analytics/owner/revenue
// @access  Private (Owner only)
exports.getRevenueReport = async (req, res) => {
  try {
    const { turfId, startDate, endDate } = req.query;

    // Get owner's turfs
    const ownerTurfs = await Turf.find({ owner: req.user._id }).select('_id name');
    const turfIds = ownerTurfs.map(t => t._id);

    if (turfIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const query = {
      turf: { $in: turfIds },
      'payment.status': 'completed'
    };

    if (turfId) {
      if (!turfIds.some(id => id.toString() === turfId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
      query.turf = turfId;
    }

    if (startDate || endDate) {
      query['payment.paidAt'] = {};
      if (startDate) query['payment.paidAt'].$gte = new Date(startDate);
      if (endDate) query['payment.paidAt'].$lte = new Date(endDate);
    }

    const revenueReport = await Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            turf: '$turf',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' } }
          },
          bookings: { $sum: 1 },
          grossRevenue: { $sum: '$pricing.totalAmount' },
          platformFees: { $sum: '$pricing.platformFee' },
          ownerEarnings: { 
            $sum: { 
              $ifNull: [
                '$pricing.ownerEarnings', 
                { $subtract: ['$pricing.totalAmount', '$pricing.platformFee'] }
              ] 
            } 
          }
        }
      },
      {
        $lookup: {
          from: 'turfs',
          localField: '_id.turf',
          foreignField: '_id',
          as: 'turfDetails'
        }
      },
      { $unwind: '$turfDetails' },
      {
        $project: {
          date: '$_id.date',
          turfName: '$turfDetails.name',
          bookings: 1,
          grossRevenue: 1,
          platformFees: 1,
          ownerEarnings: 1
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: revenueReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get booking calendar
// @route   GET /api/analytics/owner/calendar
// @access  Private (Owner only)
exports.getBookingCalendar = async (req, res) => {
  try {
    const { turfId, month, year } = req.query;

    if (!turfId) {
      return res.status(400).json({
        success: false,
        message: 'Turf ID is required'
      });
    }

    // Verify ownership
    const turf = await Turf.findById(turfId);
    if (!turf || turf.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get month range
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const bookings = await Booking.find({
      turf: turfId,
      bookingDate: { $gte: startDate, $lte: endDate }
    })
      .select('bookingDate timeSlot status sport user pricing')
      .populate('user', 'name phone')
      .sort({ bookingDate: 1, 'timeSlot.startTime': 1 });

    // Group by date
    const calendar = {};
    bookings.forEach(booking => {
      const dateKey = booking.bookingDate.toISOString().split('T')[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      calendar[dateKey].push(booking);
    });

    res.status(200).json({
      success: true,
      data: calendar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
