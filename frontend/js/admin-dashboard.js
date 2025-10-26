import api, { formatCurrency, formatDateTime, formatTimeSlot, showToast } from './api.js';
import authManager from './auth.js';

let currentTab = 'pending';
let selectedTurfId = null;
let selectedPayoutData = null;

// Load admin dashboard
async function loadAdminDashboard() {
    // Wait for auth to initialize first
    const hasAccess = await authManager.requireAuth('admin');
    if (!hasAccess) return;

    await Promise.all([
        loadDashboardStats(),
        loadPendingTurfs()
    ]);
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const response = await api.getDashboardStats();
        const stats = response.data.overview;

        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalOwners').textContent = stats.totalOwners || 0;
        document.getElementById('totalTurfs').textContent = stats.totalTurfs || 0;
        document.getElementById('pendingTurfs').textContent = stats.pendingTurfs || 0;
        document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
        document.getElementById('platformRevenue').textContent = formatCurrency(stats.platformEarnings || 0);
        document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue || 0);
        document.getElementById('ownerEarnings').textContent = formatCurrency(stats.ownerEarnings || 0);
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load dashboard stats', 'error');
    }
}

// Load pending turfs
async function loadPendingTurfs() {
    const loader = document.getElementById('pendingLoader');
    const pendingList = document.getElementById('pendingTurfsList');

    if (loader) loader.style.display = 'block';

    try {
        const response = await api.getPendingTurfs();

        if (loader) loader.style.display = 'none';

        if (response.data && response.data.length > 0) {
            pendingList.innerHTML = response.data.map(turf => createPendingTurfCard(turf)).join('');
        } else {
            pendingList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>No Pending Approvals</h3>
                    <p>All turfs have been reviewed</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading pending turfs:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load pending turfs', 'error');
    }
}

// Create pending turf card
function createPendingTurfCard(turf) {
    const primaryImage = turf.images && turf.images.length > 0 
        ? turf.images.find(img => img.isPrimary)?.url || turf.images[0].url
        : 'https://via.placeholder.com/100x80?text=Turf';

    return `
        <div class="booking-card-item">
            <div style="display: flex; gap: 1.5rem;">
                <img src="${primaryImage}" alt="${turf.name}" 
                     style="width: 150px; height: 120px; object-fit: cover; border-radius: 0.5rem;"
                     onerror="this.src='https://via.placeholder.com/150x120?text=Turf'">
                <div style="flex: 1;">
                    <div class="booking-header">
                        <div>
                            <h3>${turf.name}</h3>
                            <p class="text-muted">${turf.address.city}, ${turf.address.state}</p>
                        </div>
                        <span class="status-badge status-pending">PENDING</span>
                    </div>
                    <div class="booking-details">
                        <div>
                            <strong>Owner:</strong>
                            <p>${turf.owner?.name}</p>
                        </div>
                        <div>
                            <strong>Sports:</strong>
                            <p>${turf.sportsSupported.join(', ')}</p>
                        </div>
                        <div>
                            <strong>Price:</strong>
                            <p>${formatCurrency(turf.pricing.hourlyRate)}/hr</p>
                        </div>
                        <div>
                            <strong>Submitted:</strong>
                            <p>${formatDateTime(turf.createdAt)}</p>
                        </div>
                    </div>
                    <div class="booking-actions">
                        <button class="btn btn-outline" onclick="viewTurfDetails('${turf._id}')">
                            View Details
                        </button>
                        <button class="btn btn-primary" onclick="approveTurf('${turf._id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger" onclick="openRejectModal('${turf._id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load all turfs
async function loadAllTurfs() {
    const loader = document.getElementById('turfsLoader');
    const turfsList = document.getElementById('turfsList');

    if (loader) loader.style.display = 'block';

    try {
        const response = await api.getTurfs({ limit: 50 });

        if (loader) loader.style.display = 'none';

        if (response.data && response.data.length > 0) {
            turfsList.innerHTML = response.data.map(turf => createAdminTurfCard(turf)).join('');
        } else {
            turfsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-building"></i>
                    <h3>No Turfs Found</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load turfs', 'error');
    }
}

// Create admin turf card
function createAdminTurfCard(turf) {
    const statusBadges = {
        approved: '<span class="status-badge status-confirmed">Approved</span>',
        pending: '<span class="status-badge status-pending">Pending</span>',
        rejected: '<span class="status-badge status-cancelled">Rejected</span>',
        suspended: '<span class="status-badge status-cancelled">Suspended</span>'
    };

    return `
        <div class="booking-card-item">
            <div class="booking-header">
                <div>
                    <h3>${turf.name}</h3>
                    <p class="text-muted">${turf.address.city}, ${turf.address.state}</p>
                </div>
                ${statusBadges[turf.status] || ''}
            </div>
            <div class="booking-details">
                <div>
                    <strong>Owner:</strong>
                    <p>${turf.owner?.name}</p>
                </div>
                <div>
                    <strong>Sports:</strong>
                    <p>${turf.sportsSupported.join(', ')}</p>
                </div>
                <div>
                    <strong>Rating:</strong>
                    <p><i class="fas fa-star" style="color: var(--warning);"></i> ${(turf.rating?.average || 0).toFixed(1)}</p>
                </div>
                <div>
                    <strong>Created:</strong>
                    <p>${formatDateTime(turf.createdAt)}</p>
                </div>
            </div>
            <div class="booking-actions">
                <button class="btn btn-outline" onclick="viewTurfDetails('${turf._id}')">
                    View Details
                </button>
                ${turf.status === 'approved' ? `
                    <button class="btn btn-danger" onclick="openSuspendModal('${turf._id}')">
                        Suspend
                    </button>
                ` : ''}
                ${turf.status === 'pending' ? `
                    <button class="btn btn-primary" onclick="approveTurf('${turf._id}')">
                        Approve
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Load users
async function loadUsers() {
    const loader = document.getElementById('usersLoader');
    const usersList = document.getElementById('usersList');

    if (loader) loader.style.display = 'block';

    try {
        const roleFilter = document.getElementById('roleFilter').value;
        const params = roleFilter ? { role: roleFilter } : {};
        
        const response = await api.getAllUsers(params);

        if (loader) loader.style.display = 'none';

        if (response.data && response.data.length > 0) {
            usersList.innerHTML = response.data.map(user => createUserCard(user)).join('');
        } else {
            usersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Users Found</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load users', 'error');
    }
}

// Create user card
function createUserCard(user) {
    return `
        <div class="booking-card-item">
            <div class="booking-header">
                <div>
                    <h3>${user.name}</h3>
                    <p class="text-muted">${user.email}</p>
                </div>
                <span class="status-badge ${user.isActive ? 'status-confirmed' : 'status-cancelled'}">
                    ${user.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>
            <div class="booking-details">
                <div>
                    <strong>Role:</strong>
                    <p>${user.role.toUpperCase()}</p>
                </div>
                <div>
                    <strong>Phone:</strong>
                    <p>${user.phone || 'N/A'}</p>
                </div>
                <div>
                    <strong>Joined:</strong>
                    <p>${formatDateTime(user.createdAt)}</p>
                </div>
                <div>
                    <strong>Last Login:</strong>
                    <p>${user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}</p>
                </div>
            </div>
            <div class="booking-actions">
                <button class="btn ${user.isActive ? 'btn-danger' : 'btn-primary'}" 
                        onclick="toggleUserStatus('${user._id}', ${!user.isActive})">
                    ${user.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `;
}

// Load all bookings
async function loadAllBookings() {
    const loader = document.getElementById('bookingsLoader');
    const bookingsList = document.getElementById('bookingsList');

    if (loader) loader.style.display = 'block';

    try {
        const statusFilter = document.getElementById('bookingStatusFilter').value;
        const params = statusFilter ? { status: statusFilter } : {};
        
        const response = await api.getAllBookings(params);

        if (loader) loader.style.display = 'none';

        if (response.data && response.data.length > 0) {
            bookingsList.innerHTML = response.data.map(booking => createAdminBookingCard(booking)).join('');
        } else {
            bookingsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar"></i>
                    <h3>No Bookings Found</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load bookings', 'error');
    }
}

// Create admin booking card
function createAdminBookingCard(booking) {
    const statusClass = `status-${booking.status}`;
    
    // Format time slots - support both single and multiple
    let timeDisplay;
    if (booking.timeSlots && booking.timeSlots.length > 1) {
        // Show all individual slots in 12-hour format
        const slotsList = booking.timeSlots
            .map(slot => formatTimeSlot(slot.startTime, slot.endTime))
            .join(', ');
        timeDisplay = slotsList;
    } else if (booking.timeSlots && booking.timeSlots.length === 1) {
        timeDisplay = formatTimeSlot(booking.timeSlots[0].startTime, booking.timeSlots[0].endTime);
    } else if (booking.timeSlot) {
        timeDisplay = formatTimeSlot(booking.timeSlot.startTime, booking.timeSlot.endTime);
    } else {
        timeDisplay = 'N/A';
    }

    return `
        <div class="booking-card-item">
            <div class="booking-header">
                <div>
                    <h3>${booking.turf?.name}</h3>
                    <p class="text-muted">User: ${booking.user?.name}</p>
                </div>
                <span class="status-badge ${statusClass}">${booking.status.toUpperCase()}</span>
            </div>
            <div class="booking-details">
                <div>
                    <strong>Date:</strong>
                    <p>${new Date(booking.bookingDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                    <strong>Time:</strong>
                    <p>${timeDisplay}</p>
                </div>
                <div>
                    <strong>Amount:</strong>
                    <p>${formatCurrency(booking.pricing?.totalAmount || 0)}</p>
                </div>
                <div>
                    <strong>Platform Fee:</strong>
                    <p>${formatCurrency(booking.pricing?.platformFee || 0)}</p>
                </div>
            </div>
        </div>
    `;
}

// Action functions
window.viewTurfDetails = async function(turfId) {
    try {
        const response = await api.getTurfById(turfId);
        const turf = response.data;

        const detailsContent = document.getElementById('turfDetailsContent');
        detailsContent.innerHTML = `
            <h2>${turf.name}</h2>
            <p><strong>Location:</strong> ${turf.address.street}, ${turf.address.city}, ${turf.address.state} - ${turf.address.pincode}</p>
            <p><strong>Owner:</strong> ${turf.owner?.name} (${turf.owner?.email})</p>
            <p><strong>Description:</strong> ${turf.description}</p>
            <p><strong>Sports:</strong> ${turf.sportsSupported.join(', ')}</p>
            <p><strong>Amenities:</strong> ${turf.amenities.join(', ')}</p>
            <p><strong>Pricing:</strong> ₹${turf.pricing.hourlyRate}/hr (Weekday), ₹${turf.pricing.weekendRate}/hr (Weekend)</p>
            <p><strong>Contact:</strong> ${turf.contactInfo.phone}${turf.contactInfo.email ? `, ${turf.contactInfo.email}` : ''}</p>
        `;

        document.getElementById('turfDetailsModal').classList.add('active');
    } catch (error) {
        console.error('Error loading turf details:', error);
        showToast('Failed to load turf details', 'error');
    }
};

window.approveTurf = async function(turfId) {
    if (!confirm('Are you sure you want to approve this turf?')) return;

    try {
        await api.approveTurf(turfId);
        showToast('Turf approved successfully', 'success');
        loadPendingTurfs();
        loadDashboardStats();
    } catch (error) {
        console.error('Error approving turf:', error);
        showToast(error.message || 'Failed to approve turf', 'error');
    }
};

// Load pending payouts
async function loadPendingPayouts() {
    const loader = document.getElementById('payoutsLoader');
    const summaryDiv = document.getElementById('payoutsSummary');
    const payoutsList = document.getElementById('payoutsList');

    if (loader) loader.style.display = 'block';

    try {
        const response = await api.getPendingPayouts();
        const { payouts, summary } = response.data;

        if (loader) loader.style.display = 'none';

        // Display summary
        summaryDiv.innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <h3>${summary.totalOwners}</h3>
                        <p>Total Owners</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="stat-info">
                        <h3>${summary.totalBookings}</h3>
                        <p>Total Bookings</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-rupee-sign"></i></div>
                    <div class="stat-info">
                        <h3>${formatCurrency(summary.totalRevenue)}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                    <div class="stat-icon" style="background: rgba(255,255,255,0.2);"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="stat-info" style="color: white;">
                        <h3 style="color: white;">${formatCurrency(summary.totalOwnerEarnings)}</h3>
                        <p style="color: rgba(255,255,255,0.9);">Pending Payouts</p>
                    </div>
                </div>
            </div>
        `;

        if (payouts && payouts.length > 0) {
            payoutsList.innerHTML = payouts.map(ownerGroup => `
                <div class="booking-card-item" style="margin-bottom: 2rem;">
                    <div class="booking-header" style="background: var(--light-bg); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                        <div>
                            <h3>${ownerGroup.owner.name}</h3>
                            <p class="text-muted">${ownerGroup.owner.email} | ${ownerGroup.owner.phone || 'N/A'}</p>
                        </div>
                        <div style="text-align: right;">
                            <strong style="color: var(--danger); font-size: 1.5rem;">${formatCurrency(ownerGroup.ownerEarnings)}</strong>
                            <p class="text-muted">${ownerGroup.totalBookings} bookings</p>
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; background: white;">
                            <thead style="background: var(--dark-bg); color: white;">
                                <tr>
                                    <th style="padding: 0.75rem; text-align: left;">Booking ID</th>
                                    <th style="padding: 0.75rem; text-align: left;">Turf</th>
                                    <th style="padding: 0.75rem; text-align: left;">Customer</th>
                                    <th style="padding: 0.75rem; text-align: left;">Date</th>
                                    <th style="padding: 0.75rem; text-align: right;">Revenue</th>
                                    <th style="padding: 0.75rem; text-align: right;">Platform Fee</th>
                                    <th style="padding: 0.75rem; text-align: right;">Owner Amount</th>
                                    <th style="padding: 0.75rem; text-align: center;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ownerGroup.bookings.map(booking => {
                                    const ownerAmount = booking.pricing.ownerEarnings || 
                                        (booking.pricing.totalAmount - booking.pricing.platformFee);
                                    return `
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td style="padding: 0.75rem;">
                                                <code style="font-size: 0.75rem;">${booking._id.toString().slice(-8)}</code>
                                            </td>
                                            <td style="padding: 0.75rem;">${booking.turf?.name || 'N/A'}</td>
                                            <td style="padding: 0.75rem;">
                                                ${booking.user?.name || 'N/A'}<br>
                                                <small class="text-muted">${booking.user?.email || ''}</small>
                                            </td>
                                            <td style="padding: 0.75rem;">${formatDateTime(booking.bookingDate)}</td>
                                            <td style="padding: 0.75rem; text-align: right;">${formatCurrency(booking.pricing.totalAmount)}</td>
                                            <td style="padding: 0.75rem; text-align: right; color: var(--success);">${formatCurrency(booking.pricing.platformFee)}</td>
                                            <td style="padding: 0.75rem; text-align: right;">
                                                <strong style="color: var(--danger);">${formatCurrency(ownerAmount)}</strong>
                                            </td>
                                            <td style="padding: 0.75rem; text-align: center;">
                                                <button class="btn btn-primary btn-sm" onclick='markAsPaid("${booking._id}")'>
                                                    <i class="fas fa-check"></i> Mark Paid
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                            <tfoot style="background: var(--light-bg); font-weight: bold;">
                                <tr>
                                    <td colspan="4" style="padding: 1rem;">Total for ${ownerGroup.owner.name}</td>
                                    <td style="padding: 1rem; text-align: right;">${formatCurrency(ownerGroup.totalRevenue)}</td>
                                    <td style="padding: 1rem; text-align: right; color: var(--success);">${formatCurrency(ownerGroup.platformFees)}</td>
                                    <td style="padding: 1rem; text-align: right; color: var(--danger); font-size: 1.1rem;">${formatCurrency(ownerGroup.ownerEarnings)}</td>
                                    <td style="padding: 1rem;"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `).join('');
        } else {
            payoutsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-money-bill-wave"></i>
                    <h3>No Pending Payouts</h3>
                    <p>There are no pending payouts to owners at this time</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading payouts:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load pending payouts', 'error');
    }
}

window.openRejectModal = function(turfId) {
    selectedTurfId = turfId;
    document.getElementById('rejectModal').classList.add('active');
};

window.openSuspendModal = function(turfId) {
    selectedTurfId = turfId;
    document.getElementById('suspendModal').classList.add('active');
};

window.toggleUserStatus = async function(userId, isActive) {
    try {
        await api.updateUserStatus(userId, isActive);
        showToast(`User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
        loadUsers();
    } catch (error) {
        console.error('Error updating user status:', error);
        showToast(error.message || 'Failed to update user status', 'error');
    }
};

// Handle reject form
async function handleRejectForm(e) {
    e.preventDefault();

    const reason = document.getElementById('rejectReason').value;

    try {
        await api.rejectTurf(selectedTurfId, reason);
        showToast('Turf rejected', 'success');
        closeRejectModal();
        loadPendingTurfs();
        loadDashboardStats();
    } catch (error) {
        console.error('Error rejecting turf:', error);
        showToast(error.message || 'Failed to reject turf', 'error');
    }
}

// Handle suspend form
async function handleSuspendForm(e) {
    e.preventDefault();

    const reason = document.getElementById('suspendReason').value;

    try {
        await api.suspendTurf(selectedTurfId, reason);
        showToast('Turf suspended', 'success');
        closeSuspendModal();
        loadAllTurfs();
    } catch (error) {
        console.error('Error suspending turf:', error);
        showToast(error.message || 'Failed to suspend turf', 'error');
    }
}

// Modal functions
function closeRejectModal() {
    document.getElementById('rejectModal').classList.remove('active');
    document.getElementById('rejectReason').value = '';
    selectedTurfId = null;
}

function closeSuspendModal() {
    document.getElementById('suspendModal').classList.remove('active');
    document.getElementById('suspendReason').value = '';
    selectedTurfId = null;
}

function closeTurfDetailsModal() {
    document.getElementById('turfDetailsModal').classList.remove('active');
}

// Payout modal functions
let selectedBookingId = null;

window.markAsPaid = function(bookingId) {
    selectedBookingId = bookingId;
    document.getElementById('payoutModal').classList.add('active');
    
    // Clear form
    document.getElementById('payoutForm').reset();
    document.getElementById('payoutOwnerInfo').innerHTML = '<p>Processing booking: <code>' + bookingId + '</code></p>';
};

function closePayoutModal() {
    document.getElementById('payoutModal').classList.remove('active');
    document.getElementById('payoutForm').reset();
    selectedBookingId = null;
}

// Handle payout form
async function handlePayoutForm(e) {
    e.preventDefault();

    if (!selectedBookingId) return;

    const payoutData = {
        transactionId: document.getElementById('transactionId').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        notes: document.getElementById('payoutNotes').value
    };

    try {
        await api.markBookingAsPaid(selectedBookingId, payoutData);
        showToast('Booking marked as paid!', 'success');
        closePayoutModal();
        loadPendingPayouts();
        loadDashboardStats();
    } catch (error) {
        console.error('Error marking booking as paid:', error);
        showToast(error.message || 'Failed to mark booking as paid', 'error');
    }
}

// Load payout history
async function loadPayoutHistory() {
    const loader = document.getElementById('historyLoader');
    const summaryDiv = document.getElementById('historySummary');
    const historyList = document.getElementById('historyList');

    if (loader) loader.style.display = 'block';

    try {
        const response = await api.getPayoutHistory();
        const { data: bookings, summary } = response;

        if (loader) loader.style.display = 'none';

        // Display summary
        summaryDiv.innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                    <div class="stat-info">
                        <h3>${summary.totalPayouts}</h3>
                        <p>Total Payouts</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-rupee-sign"></i></div>
                    <div class="stat-info">
                        <h3>${formatCurrency(summary.totalRevenue)}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <div class="stat-icon" style="background: rgba(255,255,255,0.2);"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="stat-info" style="color: white;">
                        <h3 style="color: white;">${formatCurrency(summary.totalAmount)}</h3>
                        <p style="color: rgba(255,255,255,0.9);">Total Paid to Owners</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-percentage"></i></div>
                    <div class="stat-info">
                        <h3>${formatCurrency(summary.totalPlatformFee)}</h3>
                        <p>Platform Earnings</p>
                    </div>
                </div>
            </div>
        `;

        if (bookings && bookings.length > 0) {
            historyList.innerHTML = `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 0.5rem; overflow: hidden;">
                        <thead style="background: var(--dark-bg); color: white;">
                            <tr>
                                <th style="padding: 1rem; text-align: left;">Paid Date</th>
                                <th style="padding: 1rem; text-align: left;">Booking ID</th>
                                <th style="padding: 1rem; text-align: left;">Owner</th>
                                <th style="padding: 1rem; text-align: left;">Turf</th>
                                <th style="padding: 1rem; text-align: left;">Customer</th>
                                <th style="padding: 1rem; text-align: right;">Amount Paid</th>
                                <th style="padding: 1rem; text-align: left;">Method</th>
                                <th style="padding: 1rem; text-align: left;">Transaction ID</th>
                                <th style="padding: 1rem; text-align: left;">Paid By</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookings.map(booking => {
                                const ownerAmount = booking.pricing.ownerEarnings || 
                                    (booking.pricing.totalAmount - booking.pricing.platformFee);
                                return `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 1rem;">
                                            ${formatDateTime(booking.payoutDetails?.paidAt)}
                                        </td>
                                        <td style="padding: 1rem;">
                                            <code style="font-size: 0.75rem;">${booking._id.toString().slice(-8)}</code>
                                        </td>
                                        <td style="padding: 1rem;">
                                            <strong>${booking.turf?.owner?.name || 'N/A'}</strong><br>
                                            <small class="text-muted">${booking.turf?.owner?.email || ''}</small>
                                        </td>
                                        <td style="padding: 1rem;">${booking.turf?.name || 'N/A'}</td>
                                        <td style="padding: 1rem;">
                                            ${booking.user?.name || 'N/A'}<br>
                                            <small class="text-muted">${booking.user?.email || ''}</small>
                                        </td>
                                        <td style="padding: 1rem; text-align: right;">
                                            <strong style="color: var(--success);">${formatCurrency(ownerAmount)}</strong>
                                        </td>
                                        <td style="padding: 1rem;">
                                            <span class="status-badge" style="background: var(--info); color: white;">
                                                ${booking.payoutDetails?.paymentMethod || 'N/A'}
                                            </span>
                                        </td>
                                        <td style="padding: 1rem;">
                                            <code>${booking.payoutDetails?.transactionId || 'N/A'}</code>
                                        </td>
                                        <td style="padding: 1rem;">
                                            ${booking.payoutDetails?.paidBy?.name || 'N/A'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Payout History</h3>
                    <p>No payouts have been processed yet</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading payout history:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load payout history', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to initialize
    await authManager.init();
    
    const hasAccess = await authManager.requireAuth('admin');
    if (!hasAccess) return;

    loadAdminDashboard();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');

            if (tabName === 'turfs') {
                loadAllTurfs();
            } else if (tabName === 'users') {
                loadUsers();
            } else if (tabName === 'bookings') {
                loadAllBookings();
            } else if (tabName === 'payouts') {
                loadPendingPayouts();
            } else if (tabName === 'history') {
                loadPayoutHistory();
            }
        });
    });

    // Forms
    document.getElementById('rejectForm').addEventListener('submit', handleRejectForm);
    document.getElementById('suspendForm').addEventListener('submit', handleSuspendForm);
    document.getElementById('payoutForm').addEventListener('submit', handlePayoutForm);

    // Modal close buttons
    document.getElementById('closeRejectModal').addEventListener('click', closeRejectModal);
    document.getElementById('cancelRejectBtn').addEventListener('click', closeRejectModal);
    document.getElementById('closeSuspendModal').addEventListener('click', closeSuspendModal);
    document.getElementById('cancelSuspendBtn').addEventListener('click', closeSuspendModal);
    document.getElementById('closeTurfDetailsModal').addEventListener('click', closeTurfDetailsModal);
    document.getElementById('closePayoutModal').addEventListener('click', closePayoutModal);
    document.getElementById('cancelPayoutBtn').addEventListener('click', closePayoutModal);

    // Filters
    document.getElementById('roleFilter').addEventListener('change', loadUsers);
    document.getElementById('bookingStatusFilter').addEventListener('change', loadAllBookings);
});
