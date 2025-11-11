const Transaction = require('../models/Transaction.model');
const Booking = require('../models/Booking.model');
const Settings = require('../models/Settings.model');
const Turf = require('../models/Turf.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Submit payment proof for a booking
// @route   POST /api/transactions/submit-proof/:bookingId
// @access  Private (User)
exports.submitPaymentProof = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { paymentProofUrl, transactionReference } = req.body;
    
    const booking = await Booking.findById(bookingId).populate('turf');
    
    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }
    
    // Verify user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to submit payment for this booking');
    }
    
    // Check if booking already has payment proof
    if (booking.platformPayment?.paymentProof?.url) {
        throw new ApiError(400, 'Payment proof already submitted for this booking');
    }
    
    // Update booking with payment proof
    booking.platformPayment = {
        paymentProof: {
            url: paymentProofUrl,
            publicId: req.body.publicId || null
        },
        uploadedAt: new Date(),
        transactionReference: transactionReference || '',
        verificationStatus: 'pending'
    };
    
    await booking.save();
    
    res.status(200).json(
        new ApiResponse(200, booking, 'Payment proof submitted successfully. Awaiting admin verification.')
    );
});

// @desc    Verify payment proof and create transaction
// @route   POST /api/transactions/verify/:bookingId
// @access  Private (Admin)
exports.verifyPaymentProof = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { isApproved, rejectionReason } = req.body;
    
    const booking = await Booking.findById(bookingId)
        .populate('turf')
        .populate('user', 'name email phone');
    
    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }
    
    if (!booking.platformPayment?.paymentProof?.url) {
        throw new ApiError(400, 'No payment proof found for this booking');
    }
    
    if (booking.platformPayment.verificationStatus !== 'pending') {
        throw new ApiError(400, `Payment already ${booking.platformPayment.verificationStatus}`);
    }
    
    if (isApproved) {
        // Get commission settings
        const settings = await Settings.getSettings();
        const platformPercentage = settings.commission.platformPercentage;
        const ownerPercentage = settings.commission.ownerPercentage;
        
        const totalAmount = booking.pricing.totalAmount;
        
        // Exact commission calculation with proper rounding to 2 decimal places
        const platformCommission = Math.round(totalAmount * (platformPercentage / 100) * 100) / 100;
        const ownerPayout = Math.round((totalAmount - platformCommission) * 100) / 100;
        
        // Create transaction record
        const transaction = await Transaction.create({
            booking: booking._id,
            user: booking.user._id,
            turf: booking.turf._id,
            owner: booking.turf.owner,
            totalAmount: totalAmount,
            platformCommission: platformCommission,
            ownerPayout: ownerPayout,
            paymentProof: {
                url: booking.platformPayment.paymentProof.url,
                uploadedAt: booking.platformPayment.uploadedAt
            },
            transactionReference: booking.platformPayment.transactionReference,
            paymentStatus: 'verified',
            verifiedBy: req.user._id,
            verifiedAt: new Date(),
            bookingSnapshot: {
                date: booking.bookingDate,
                timeSlot: `${booking.timeSlots[0]?.startTime} - ${booking.timeSlots[booking.timeSlots.length - 1]?.endTime}`,
                sport: booking.sport,
                duration: booking.timeSlots.length
            }
        });
        
        // Update booking
        booking.platformPayment.verificationStatus = 'verified';
        booking.platformPayment.verifiedBy = req.user._id;
        booking.platformPayment.verifiedAt = new Date();
        booking.platformPayment.transaction = transaction._id;
        booking.payment.status = 'completed';
        booking.status = 'confirmed';
        
        await booking.save();
        
        res.status(200).json(
            new ApiResponse(200, { transaction, booking }, 'Payment verified and transaction created successfully')
        );
    } else {
        // Reject payment
        booking.platformPayment.verificationStatus = 'rejected';
        booking.platformPayment.verifiedBy = req.user._id;
        booking.platformPayment.verifiedAt = new Date();
        booking.platformPayment.rejectionReason = rejectionReason || 'Payment proof rejected by admin';
        booking.payment.status = 'failed';
        booking.status = 'cancelled';
        
        await booking.save();
        
        res.status(200).json(
            new ApiResponse(200, booking, 'Payment proof rejected')
        );
    }
});

// @desc    Get all transactions (Admin view)
// @route   GET /api/transactions
// @access  Private (Admin)
exports.getAllTransactions = asyncHandler(async (req, res) => {
    const { paymentStatus, payoutStatus, startDate, endDate, limit = 100 } = req.query;
    
    const query = {};
    
    // Build query filters
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (payoutStatus) query.payoutStatus = payoutStatus;
    
    if (startDate || endDate) {
        query.verifiedAt = {};
        if (startDate) query.verifiedAt.$gte = new Date(startDate);
        if (endDate) query.verifiedAt.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
        .populate('turf', 'name address')
        .populate('user', 'name email phone')
        .populate('owner', 'name email phone upiId')
        .populate('booking', 'bookingDate timeSlot')
        .sort({ verifiedAt: -1 })
        .limit(parseInt(limit));
    
    // Calculate summary
    const summary = {
        totalTransactions: transactions.length,
        totalRevenue: 0,
        totalCommission: 0,
        totalOwnerPayout: 0,
        pendingPayouts: 0,
        completedPayouts: 0
    };
    
    transactions.forEach(txn => {
        summary.totalRevenue += txn.totalAmount;
        summary.totalCommission += txn.platformCommission;
        summary.totalOwnerPayout += txn.ownerPayout;
        
        if (txn.payoutStatus === 'completed') {
            summary.completedPayouts += txn.ownerPayout;
        } else {
            summary.pendingPayouts += txn.ownerPayout;
        }
    });
    
    res.status(200).json(
        new ApiResponse(200, transactions, 'All transactions retrieved successfully')
    );
});

// @desc    Get all transactions by turf (Admin view)
// @route   GET /api/transactions/turf/:turfId
// @access  Private (Admin)
exports.getTransactionsByTurf = asyncHandler(async (req, res) => {
    const { turfId } = req.params;
    const { paymentStatus, payoutStatus, startDate, endDate } = req.query;
    
    const filters = {};
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (payoutStatus) filters.payoutStatus = payoutStatus;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const transactions = await Transaction.getByTurf(turfId, filters);
    
    // Calculate summary
    const summary = {
        totalTransactions: transactions.length,
        totalRevenue: 0,
        totalCommission: 0,
        totalOwnerPayout: 0,
        pendingPayouts: 0,
        completedPayouts: 0
    };
    
    transactions.forEach(txn => {
        summary.totalRevenue += txn.totalAmount;
        summary.totalCommission += txn.platformCommission;
        summary.totalOwnerPayout += txn.ownerPayout;
        
        if (txn.payoutStatus === 'completed') {
            summary.completedPayouts += txn.ownerPayout;
        } else {
            summary.pendingPayouts += txn.ownerPayout;
        }
    });
    
    res.status(200).json(
        new ApiResponse(200, { transactions, summary }, 'Transactions retrieved successfully')
    );
});

// @desc    Get all pending payment verifications
// @route   GET /api/transactions/pending-verifications
// @access  Private (Admin)
exports.getPendingVerifications = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({
        'platformPayment.verificationStatus': 'pending',
        'platformPayment.paymentProof.url': { $exists: true }
    })
    .populate('turf', 'name location sport')
    .populate('user', 'name email phone')
    .sort({ 'platformPayment.uploadedAt': 1 });
    
    res.status(200).json(
        new ApiResponse(200, bookings, 'Pending verifications retrieved successfully')
    );
});

// @desc    Get all pending payouts
// @route   GET /api/transactions/pending-payouts
// @access  Private (Admin)
exports.getPendingPayouts = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({
        paymentStatus: 'verified',
        payoutStatus: { $in: ['pending', 'processing'] }
    })
    .populate('owner', 'name email phone upiId')
    .populate('turf', 'name location')
    .populate('booking', 'bookingDate timeSlots')
    .sort({ createdAt: 1 });
    
    // Group by owner
    const payoutsByOwner = {};
    
    transactions.forEach(txn => {
        const ownerId = txn.owner._id.toString();
        
        if (!payoutsByOwner[ownerId]) {
            payoutsByOwner[ownerId] = {
                owner: txn.owner,
                totalPayout: 0,
                transactionCount: 0,
                transactions: []
            };
        }
        
        payoutsByOwner[ownerId].totalPayout += txn.ownerPayout;
        payoutsByOwner[ownerId].transactionCount++;
        payoutsByOwner[ownerId].transactions.push(txn);
    });
    
    res.status(200).json(
        new ApiResponse(200, Object.values(payoutsByOwner), 'Pending payouts retrieved successfully')
    );
});

// @desc    Mark payout as completed
// @route   POST /api/transactions/complete-payout/:transactionId
// @access  Private (Admin)
exports.completePayout = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { payoutReference, notes } = req.body;
    
    if (!payoutReference) {
        throw new ApiError(400, 'Payout reference (UTR/Transaction ID) is required');
    }
    
    const transaction = await Transaction.findById(transactionId)
        .populate('owner', 'name email phone')
        .populate('turf', 'name');
    
    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }
    
    if (transaction.paymentStatus !== 'verified') {
        throw new ApiError(400, 'Payment must be verified before completing payout');
    }
    
    if (transaction.payoutStatus === 'completed') {
        throw new ApiError(400, 'Payout already completed for this transaction');
    }
    
    await transaction.completePayout(req.user._id, payoutReference, notes);
    
    res.status(200).json(
        new ApiResponse(200, transaction, 'Payout marked as completed successfully')
    );
});

// @desc    Bulk complete payouts for an owner
// @route   POST /api/transactions/bulk-payout/:ownerId
// @access  Private (Admin)
exports.bulkCompletePayout = asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    const { payoutReference, notes, transactionIds } = req.body;
    
    if (!payoutReference) {
        throw new ApiError(400, 'Payout reference (UTR/Transaction ID) is required');
    }
    
    const query = {
        owner: ownerId,
        paymentStatus: 'verified',
        payoutStatus: { $in: ['pending', 'processing'] }
    };
    
    // If specific transaction IDs provided, use those
    if (transactionIds && transactionIds.length > 0) {
        query._id = { $in: transactionIds };
    }
    
    const transactions = await Transaction.find(query);
    
    if (transactions.length === 0) {
        throw new ApiError(404, 'No pending transactions found for this owner');
    }
    
    // Update all transactions
    const updatePromises = transactions.map(txn => 
        txn.completePayout(req.user._id, payoutReference, notes)
    );
    
    await Promise.all(updatePromises);
    
    const totalPayout = transactions.reduce((sum, txn) => sum + txn.ownerPayout, 0);
    
    res.status(200).json(
        new ApiResponse(200, {
            transactionsUpdated: transactions.length,
            totalPayout,
            transactions
        }, `Bulk payout completed for ${transactions.length} transactions`)
    );
});

// @desc    Get platform commission summary
// @route   GET /api/transactions/platform-summary
// @access  Private (Admin)
exports.getPlatformSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const summary = await Transaction.getPlatformCommissionSummary(filters);
    
    res.status(200).json(
        new ApiResponse(200, summary, 'Platform commission summary retrieved successfully')
    );
});

// @desc    Get owner earnings summary
// @route   GET /api/transactions/owner-earnings/:ownerId
// @access  Private (Admin/Owner)
exports.getOwnerEarnings = asyncHandler(async (req, res) => {
    const { ownerId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check authorization
    if (req.user.role !== 'admin' && req.user._id.toString() !== ownerId) {
        throw new ApiError(403, 'Not authorized to view these earnings');
    }
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const summary = await Transaction.getOwnerEarnings(ownerId, filters);
    
    // Get detailed transactions
    const transactions = await Transaction.find({
        owner: ownerId,
        paymentStatus: 'verified',
        ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { ...{}, $lte: new Date(endDate) } })
    })
    .populate('turf', 'name')
    .populate('booking', 'bookingDate timeSlots')
    .sort({ createdAt: -1 });
    
    res.status(200).json(
        new ApiResponse(200, { summary, transactions }, 'Owner earnings retrieved successfully')
    );
});

// @desc    Get platform payment QR
// @route   GET /api/transactions/platform-qr
// @access  Public
exports.getPlatformQR = asyncHandler(async (req, res) => {
    const settings = await Settings.getSettings();
    
    if (!settings.platformPaymentQR?.url) {
        throw new ApiError(404, 'Platform payment QR not configured');
    }
    
    res.status(200).json(
        new ApiResponse(200, settings.platformPaymentQR, 'Platform QR retrieved successfully')
    );
});

// @desc    Update platform payment QR
// @route   POST /api/transactions/platform-qr
// @access  Private (Admin)
exports.updatePlatformQR = asyncHandler(async (req, res) => {
    const { url, publicId, upiId } = req.body;
    
    if (!url) {
        throw new ApiError(400, 'QR code URL is required');
    }
    
    const settings = await Settings.updatePlatformQR(
        { url, publicId, upiId },
        req.user._id
    );
    
    res.status(200).json(
        new ApiResponse(200, settings.platformPaymentQR, 'Platform QR updated successfully')
    );
});

// @desc    Get transaction details
// @route   GET /api/transactions/:transactionId
// @access  Private (Admin/Owner)
exports.getTransactionDetails = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId)
        .populate('user', 'name email phone')
        .populate('owner', 'name email phone upiId')
        .populate('turf', 'name location sport')
        .populate('booking')
        .populate('verifiedBy', 'name')
        .populate('payoutCompletedBy', 'name');
    
    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && req.user._id.toString() !== transaction.owner._id.toString()) {
        throw new ApiError(403, 'Not authorized to view this transaction');
    }
    
    res.status(200).json(
        new ApiResponse(200, transaction, 'Transaction details retrieved successfully')
    );
});

// @desc    Get daily payouts grouped by turf and owner
// @route   GET /api/transactions/daily-payouts
// @access  Private (Admin)
exports.getDailyPayouts = asyncHandler(async (req, res) => {
    const { date } = req.query;
    
    // Default to today if no date provided
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    // Get all verified transactions for the date
    const transactions = await Transaction.find({
        paymentStatus: 'verified',
        verifiedAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    })
    .populate('turf', 'name')
    .populate('owner', 'name email phone upiId')
    .populate('booking', 'bookingDate timeSlot sport')
    .sort({ verifiedAt: -1 });
    
    // Group by owner and turf
    const payoutsByOwner = {};
    
    transactions.forEach(txn => {
        const ownerId = txn.owner._id.toString();
        
        if (!payoutsByOwner[ownerId]) {
            payoutsByOwner[ownerId] = {
                owner: {
                    id: txn.owner._id,
                    name: txn.owner.name,
                    email: txn.owner.email,
                    phone: txn.owner.phone,
                    upiId: txn.owner.upiId
                },
                turfs: {},
                totalAmount: 0,
                totalCommission: 0,
                totalOwnerPayout: 0,
                transactionCount: 0,
                pendingPayoutCount: 0
            };
        }
        
        const turfId = txn.turf._id.toString();
        
        if (!payoutsByOwner[ownerId].turfs[turfId]) {
            payoutsByOwner[ownerId].turfs[turfId] = {
                turfId: txn.turf._id,
                turfName: txn.turf.name,
                transactions: [],
                totalAmount: 0,
                totalCommission: 0,
                totalOwnerPayout: 0,
                transactionCount: 0,
                pendingPayoutCount: 0
            };
        }
        
        // Add transaction to turf
        payoutsByOwner[ownerId].turfs[turfId].transactions.push({
            transactionId: txn._id,
            bookingDate: txn.booking?.bookingDate,
            timeSlot: txn.booking?.timeSlot,
            sport: txn.booking?.sport,
            amount: txn.totalAmount,
            commission: txn.platformCommission,
            ownerPayout: txn.ownerPayout,
            payoutStatus: txn.payoutStatus,
            verifiedAt: txn.verifiedAt
        });
        
        // Update turf totals
        payoutsByOwner[ownerId].turfs[turfId].totalAmount += txn.totalAmount;
        payoutsByOwner[ownerId].turfs[turfId].totalCommission += txn.platformCommission;
        payoutsByOwner[ownerId].turfs[turfId].totalOwnerPayout += txn.ownerPayout;
        payoutsByOwner[ownerId].turfs[turfId].transactionCount += 1;
        
        if (txn.payoutStatus === 'pending') {
            payoutsByOwner[ownerId].turfs[turfId].pendingPayoutCount += 1;
        }
        
        // Update owner totals
        payoutsByOwner[ownerId].totalAmount += txn.totalAmount;
        payoutsByOwner[ownerId].totalCommission += txn.platformCommission;
        payoutsByOwner[ownerId].totalOwnerPayout += txn.ownerPayout;
        payoutsByOwner[ownerId].transactionCount += 1;
        
        if (txn.payoutStatus === 'pending') {
            payoutsByOwner[ownerId].pendingPayoutCount += 1;
        }
    });
    
    // Convert turfs object to array
    Object.keys(payoutsByOwner).forEach(ownerId => {
        payoutsByOwner[ownerId].turfs = Object.values(payoutsByOwner[ownerId].turfs);
    });
    
    const payoutsArray = Object.values(payoutsByOwner);
    
    res.status(200).json(
        new ApiResponse(200, {
            date: targetDate,
            payouts: payoutsArray,
            summary: {
                totalOwners: payoutsArray.length,
                totalTransactions: transactions.length,
                totalRevenue: payoutsArray.reduce((sum, p) => sum + p.totalAmount, 0),
                totalCommission: payoutsArray.reduce((sum, p) => sum + p.totalCommission, 0),
                totalOwnerPayouts: payoutsArray.reduce((sum, p) => sum + p.totalOwnerPayout, 0),
                pendingPayouts: payoutsArray.reduce((sum, p) => sum + p.pendingPayoutCount, 0)
            }
        }, 'Daily payouts retrieved successfully')
    );
});

// @desc    Get owner's today's earnings
// @route   GET /api/transactions/owner-daily-earnings
// @access  Private (Owner)
exports.getOwnerDailyEarnings = asyncHandler(async (req, res) => {
    const ownerId = req.user._id;
    
    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all verified transactions for owner today
    const transactions = await Transaction.find({
        owner: ownerId,
        paymentStatus: 'verified',
        verifiedAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    })
    .populate('turf', 'name')
    .populate('booking', 'bookingDate timeSlot sport user')
    .populate('user', 'name')
    .sort({ verifiedAt: -1 });
    
    // Calculate totals
    const totalBookings = transactions.length;
    const totalRevenue = transactions.reduce((sum, txn) => sum + txn.totalAmount, 0);
    const platformCommission = transactions.reduce((sum, txn) => sum + txn.platformCommission, 0);
    const ownerEarnings = transactions.reduce((sum, txn) => sum + txn.ownerPayout, 0);
    const pendingPayout = transactions
        .filter(txn => txn.payoutStatus === 'pending')
        .reduce((sum, txn) => sum + txn.ownerPayout, 0);
    const completedPayout = transactions
        .filter(txn => txn.payoutStatus === 'completed')
        .reduce((sum, txn) => sum + txn.ownerPayout, 0);
    
    // Group by turf
    const turfBreakdown = {};
    transactions.forEach(txn => {
        const turfId = txn.turf._id.toString();
        if (!turfBreakdown[turfId]) {
            turfBreakdown[turfId] = {
                turfId: txn.turf._id,
                turfName: txn.turf.name,
                bookings: 0,
                revenue: 0,
                earnings: 0,
                commission: 0
            };
        }
        turfBreakdown[turfId].bookings += 1;
        turfBreakdown[turfId].revenue += txn.totalAmount;
        turfBreakdown[turfId].earnings += txn.ownerPayout;
        turfBreakdown[turfId].commission += txn.platformCommission;
    });
    
    res.status(200).json(
        new ApiResponse(200, {
            date: new Date(),
            summary: {
                totalBookings,
                totalRevenue,
                platformCommission,
                ownerEarnings,
                commissionPercentage: 10,
                earningsPercentage: 90,
                pendingPayout,
                completedPayout
            },
            turfBreakdown: Object.values(turfBreakdown),
            recentTransactions: transactions.slice(0, 10).map(txn => ({
                transactionId: txn._id,
                turfName: txn.turf.name,
                customerName: txn.user?.name,
                amount: txn.totalAmount,
                earnings: txn.ownerPayout,
                commission: txn.platformCommission,
                payoutStatus: txn.payoutStatus,
                verifiedAt: txn.verifiedAt,
                bookingDate: txn.booking?.bookingDate,
                timeSlot: txn.booking?.timeSlot
            }))
        }, 'Today\'s earnings retrieved successfully')
    );
});

module.exports = exports;
