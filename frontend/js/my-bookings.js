import api, { formatCurrency, formatDateTime, formatTimeSlot, showToast } from './api.js';
import authManager from './auth.js';

let currentStatus = 'all';
let currentBookingId = null;

// Load user bookings
async function loadBookings() {
    // Wait for auth to initialize first
    const hasAccess = await authManager.requireAuth();
    if (!hasAccess) return;

    const loader = document.getElementById('bookingsLoader');
    const container = document.getElementById('bookingsContainer');
    const noBookings = document.getElementById('noBookings');

    if (loader) loader.style.display = 'block';
    if (container) container.style.display = 'none';
    if (noBookings) noBookings.style.display = 'none';

    try {
        const params = currentStatus !== 'all' ? { status: currentStatus } : {};
        const response = await api.getMyBookings(params);

        if (loader) loader.style.display = 'none';

        if (response.data && response.data.length > 0) {
            if (container) {
                container.style.display = 'block';
                container.innerHTML = response.data.map(booking => createBookingCard(booking)).join('');
            }
        } else {
            if (noBookings) noBookings.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load bookings', 'error');
    }
}

// Create booking card
function createBookingCard(booking) {
    const statusClass = `status-${booking.status}`;
    const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
    
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
                    <h3>${booking.turf?.name || 'Unknown Turf'}</h3>
                    <p class="text-muted">${booking.turf?.address?.city}, ${booking.turf?.address?.state}</p>
                </div>
                <span class="status-badge ${statusClass}">${booking.status.toUpperCase()}</span>
            </div>
            <div class="booking-details">
                <div>
                    <strong>Date:</strong>
                    <p>${new Date(booking.bookingDate).toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>
                <div>
                    <strong>Time:</strong>
                    <p>${timeDisplay}</p>
                </div>
                <div>
                    <strong>Sport:</strong>
                    <p>${booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)}</p>
                </div>
                <div>
                    <strong>Amount:</strong>
                    <p>${formatCurrency(booking.pricing?.totalAmount || 0)}</p>
                </div>
                <div>
                    <strong>Payment:</strong>
                    <p class="${booking.payment.status === 'completed' ? 'text-success' : 'text-warning'}">
                        ${booking.payment.status.toUpperCase()}
                    </p>
                </div>
                ${booking.tierPayment && booking.tierPayment.verificationStatus ? `
                <div>
                    <strong>Verification:</strong>
                    <p class="${
                        booking.tierPayment.verificationStatus === 'approved' ? 'text-success' : 
                        booking.tierPayment.verificationStatus === 'rejected' ? 'text-danger' : 
                        'text-warning'
                    }">
                        ${booking.tierPayment.verificationStatus.toUpperCase()}
                    </p>
                </div>
                ` : ''}
                <div>
                    <strong>Booked on:</strong>
                    <p>${formatDateTime(booking.createdAt)}</p>
                </div>
            </div>
            ${booking.playerDetails ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong>Players:</strong> ${booking.playerDetails.numberOfPlayers}
                    ${booking.notes ? `<br><strong>Notes:</strong> ${booking.notes}` : ''}
                </div>
            ` : ''}
            ${booking.tierPayment && booking.tierPayment.verificationStatus === 'pending' ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <i class="fas fa-clock" style="color: #f59e0b;"></i>
                    <strong>Waiting for owner to verify your payment</strong>
                    ${booking.tierPayment.screenshot ? `
                        <div style="margin-top: 0.5rem;">
                            <small>Screenshot uploaded on ${new Date(booking.tierPayment.uploadedAt).toLocaleString()}</small>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            ${booking.tierPayment && booking.tierPayment.verificationStatus === 'rejected' ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px;">
                    <i class="fas fa-times-circle" style="color: #ef4444;"></i>
                    <strong>Payment verification failed</strong>
                    ${booking.tierPayment.rejectionReason ? `
                        <div style="margin-top: 0.5rem;">
                            <small>Reason: ${booking.tierPayment.rejectionReason}</small>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            ${booking.tierPayment && booking.tierPayment.verificationStatus === 'approved' ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <strong>Payment verified and booking confirmed!</strong>
                </div>
            ` : ''}
            ${canCancel ? `
                <div class="booking-actions">
                    <button class="btn btn-outline" onclick="window.location.href='turf-details.html?id=${booking.turf._id}'">
                        View Turf
                    </button>
                    <button class="btn btn-danger" onclick="openCancelModal('${booking._id}')">
                        Cancel Booking
                    </button>
                </div>
            ` : ''}
            ${booking.status === 'cancelled' && booking.cancellation ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fee2e2; border-radius: 0.5rem;">
                    <strong>Cancellation Reason:</strong> ${booking.cancellation.reason}<br>
                    <small>Cancelled on: ${formatDateTime(booking.cancellation.cancelledAt)}</small>
                </div>
            ` : ''}
        </div>
    `;
}

// Open cancel modal
window.openCancelModal = function(bookingId) {
    currentBookingId = bookingId;
    const modal = document.getElementById('cancelModal');
    if (modal) modal.classList.add('active');
};

// Close cancel modal
function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) modal.classList.remove('active');
    currentBookingId = null;
    document.getElementById('cancelReason').value = '';
}

// Handle cancel booking
async function handleCancelBooking(e) {
    e.preventDefault();

    if (!currentBookingId) return;

    const reason = document.getElementById('cancelReason').value;

    try {
        await api.cancelBooking(currentBookingId, reason);
        showToast('Booking cancelled successfully', 'success');
        closeCancelModal();
        loadBookings();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showToast(error.message || 'Failed to cancel booking', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to initialize
    await authManager.init();
    
    const hasAccess = await authManager.requireAuth();
    if (!hasAccess) return;

    // Load bookings
    loadBookings();

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatus = btn.dataset.status;
            loadBookings();
        });
    });

    // Cancel modal
    const cancelForm = document.getElementById('cancelForm');
    if (cancelForm) {
        cancelForm.addEventListener('submit', handleCancelBooking);
    }

    const closeCancelBtn = document.getElementById('closeCancelBtn');
    if (closeCancelBtn) {
        closeCancelBtn.addEventListener('click', closeCancelModal);
    }

    const closeCancelModalBtn = document.getElementById('closeCancelModal');
    if (closeCancelModalBtn) {
        closeCancelModalBtn.addEventListener('click', closeCancelModal);
    }
});
