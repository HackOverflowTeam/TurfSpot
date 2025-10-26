const Turf = require('../models/Turf.model');
const Booking = require('../models/Booking.model');

// @desc    Create new turf
// @route   POST /api/turfs
// @access  Private (Owner only)
exports.createTurf = async (req, res) => {
  try {
    const turfData = {
      ...req.body,
      owner: req.user._id,
      status: 'pending' // All new turfs need admin approval
    };

    const turf = await Turf.create(turfData);

    res.status(201).json({
      success: true,
      message: 'Turf created successfully. Pending admin approval.',
      data: turf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all approved turfs (with filters)
// @route   GET /api/turfs
// @access  Public
exports.getTurfs = async (req, res) => {
  try {
    const {
      city,
      sport,
      minPrice,
      maxPrice,
      amenities,
      latitude,
      longitude,
      maxDistance = 10000, // 10km default
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = { status: 'approved', isActive: true };

    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    if (sport) {
      query.sportsSupported = sport;
    }

    if (minPrice || maxPrice) {
      query['pricing.hourlyRate'] = {};
      if (minPrice) query['pricing.hourlyRate'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.hourlyRate'].$lte = Number(maxPrice);
    }

    if (amenities) {
      const amenitiesArray = amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    // Location-based search
    if (latitude && longitude) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    const turfs = await Turf.find(query)
      .populate('owner', 'name email phone')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Turf.countDocuments(query);

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

// @desc    Get single turf by ID
// @route   GET /api/turfs/:id
// @access  Public
exports.getTurf = async (req, res) => {
  try {
    // Validate ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid turf ID'
      });
    }

    const turf = await Turf.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: 'Turf not found'
      });
    }

    // Only show approved turfs to non-owners/non-admins
    if (turf.status !== 'approved') {
      // Allow access if user is the owner or admin
      if (req.user) {
        const isOwner = req.user._id.toString() === turf.owner._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Turf not available'
          });
        }
      } else {
        // No user logged in and turf is not approved
        return res.status(403).json({
          success: false,
          message: 'Turf not available'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: turf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update turf
// @route   PUT /api/turfs/:id
// @access  Private (Owner only)
exports.updateTurf = async (req, res) => {
  try {
    // Validate ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid turf ID'
      });
    }

    let turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: 'Turf not found'
      });
    }

    // Check ownership
    if (turf.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this turf'
      });
    }

    // Don't allow changing owner or status through this route
    delete req.body.owner;
    delete req.body.status;
    delete req.body.approvalInfo;

    turf = await Turf.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Turf updated successfully',
      data: turf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete turf
// @route   DELETE /api/turfs/:id
// @access  Private (Owner only)
exports.deleteTurf = async (req, res) => {
  try {
    // Validate ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid turf ID'
      });
    }

    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: 'Turf not found'
      });
    }

    // Check ownership
    if (turf.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this turf'
      });
    }

    // Check for future bookings
    const futureBookings = await Booking.countDocuments({
      turf: turf._id,
      bookingDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (futureBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete turf with active future bookings'
      });
    }

    await turf.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Turf deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get owner's turfs
// @route   GET /api/turfs/owner/my-turfs
// @access  Private (Owner only)
exports.getMyTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: turfs.length,
      data: turfs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available slots for a turf
// @route   GET /api/turfs/:id/available-slots
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    // Validate ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid turf ID'
      });
    }

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const turf = await Turf.findById(req.params.id);

    if (!turf || turf.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Turf not found'
      });
    }

    // Get day of week
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const operatingHours = turf.operatingHours[dayOfWeek];

    if (!operatingHours || !operatingHours.isOpen) {
      return res.status(200).json({
        success: true,
        message: 'Turf is closed on this day',
        data: []
      });
    }

    // Generate all possible slots
    const slots = [];
    const [openHour, openMinute] = operatingHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = operatingHours.close.split(':').map(Number);
    
    let currentTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    while (currentTime + turf.slotDuration <= closeTime) {
      const startHour = Math.floor(currentTime / 60);
      const startMinute = currentTime % 60;
      const endTime = currentTime + turf.slotDuration;
      const endHour = Math.floor(endTime / 60);
      const endMinute = endTime % 60;

      slots.push({
        startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
        endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
      });

      currentTime += turf.slotDuration;
    }

    // Get booked slots - updated to check both timeSlot and timeSlots
    const bookedSlots = await Booking.find({
      turf: turf._id,
      bookingDate: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot timeSlots');

    // Collect all booked start times
    const bookedStartTimes = new Set();
    bookedSlots.forEach(booking => {
      // Check old single timeSlot format
      if (booking.timeSlot && booking.timeSlot.startTime) {
        bookedStartTimes.add(booking.timeSlot.startTime);
      }
      // Check new multiple timeSlots format
      if (booking.timeSlots && booking.timeSlots.length > 0) {
        booking.timeSlots.forEach(slot => {
          bookedStartTimes.add(slot.startTime);
        });
      }
    });

    // Mark available slots
    const availableSlots = slots.map(slot => {
      const isBooked = bookedStartTimes.has(slot.startTime);

      return {
        ...slot,
        isAvailable: !isBooked
      };
    });

    res.status(200).json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
