import api, { showToast, formatCurrency, formatDate, formatTimeSlot } from './api.js';
import authManager from './auth.js';

let allBookings = [];
let currentFilter = 'all';

// Load bookings from API
async function loadBookings() {
    // Check authentication
    if (!await authManager.requireAuth()) {
        return;
    }

    const bookingsList = document.querySelector('.bookings-list');
    const emptyState = document.getElementById('emptyState');
    
    bookingsList.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading bookings...</div>';

    try {
        const response = await api.getMyBookings();
        allBookings = response.data || [];
        
        displayBookings();
        updateStats();
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Error loading bookings</h3><p>Please try again later</p></div>';
    }
}

// Display bookings
function displayBookings() {
    const bookingsList = document.querySelector('.bookings-list');
    const emptyState = document.getElementById('emptyState');
    
    // Filter bookings
    let filteredBookings = allBookings;
    if (currentFilter !== 'all') {
        filteredBookings = allBookings.filter(b => b.status === currentFilter);
    }
    
    if (filteredBookings.length === 0) {
        bookingsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    bookingsList.style.display = 'block';
    emptyState.style.display = 'none';
    
    bookingsList.innerHTML = filteredBookings.map(booking => createBookingCard(booking)).join('');
}

// Create booking card HTML
function createBookingCard(booking) {
    const statusClass = booking.status;
    const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
    
    const primaryImage = booking.turf.images?.find(img => img.isPrimary)?.url || 
                                     booking.turf.images?.[0]?.url || 
                                     'https://placehold.co/300x200/10b981/white?text=Turf+Image';
    
    return `
        <div class="booking-card" data-status="${booking.status}">
            <div class="booking-image">
                <img src="${turfImage}" alt="${booking.turf.name}" 
                     onerror="this.src='https://placehold.co/300x200/10b981/white?text=Turf+Image'">
                <span class="booking-status ${statusClass}">${statusText}</span>
            </div>
            <div class="booking-details">
                <h3>${booking.turf.name}</h3>
                <div class="booking-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${booking.turf.address.city}, ${booking.turf.address.state}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formatDate(booking.bookingDate)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${formatTimeSlot(booking.timeSlot.startTime, booking.timeSlot.endTime)}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-futbol"></i>
                        <span>${booking.sport}</span>
                    </div>
                </div>
                <div class="booking-footer">
                    <div class="booking-price">
                        <span class="price-label">Total Amount</span>
                        <span class="price">${formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div class="booking-actions">
                        <button class="btn-view" onclick="viewBooking('${booking._id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${booking.status === 'confirmed' || booking.status === 'pending' ? `
                            <button class="btn-cancel" onclick="cancelBooking('${booking._id}')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                        ${booking.status === 'completed' ? `
                            <button class="btn-review" onclick="addReview('${booking._id}')">
                                <i class="fas fa-star"></i> Review
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update stats
function updateStats() {
    const stats = {
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        pending: allBookings.filter(b => b.status === 'pending').length,
        completed: allBookings.filter(b => b.status === 'completed').length,
        total: allBookings.length
    };
    
    document.getElementById('confirmedCount').textContent = stats.confirmed;
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('completedCount').textContent = stats.completed;
    document.getElementById('totalCount').textContent = stats.total;
}

// Filter bookings by status
function filterBookings(status) {
    currentFilter = status;
    
    // Update active filter tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === status) {
            tab.classList.add('active');
        }
    });
    
    displayBookings();
}

// View booking details
function viewBooking(bookingId) {
    window.location.href = `booking-details.html?id=${bookingId}`;
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) {
        return;
    }

    try {
        await api.cancelBooking(bookingId, reason);
        showToast('Booking cancelled successfully', 'success');
        loadBookings(); // Reload bookings
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showToast(error.message || 'Failed to cancel booking', 'error');
    }
}

// Add review
function addReview(bookingId) {
    // Navigate to review page or open review modal
    showToast('Review feature coming soon!', 'info');
}

// Logout function
function logout() {
    authManager.logout();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!await authManager.requireAuth()) {
        return;
    }
    
    // Setup filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filterBookings(tab.dataset.filter);
        });
    });
    
    // Load bookings
    loadBookings();
});

// Export functions for global access
window.viewBooking = viewBooking;
window.cancelBooking = cancelBooking;
window.addReview = addReview;
window.logout = logout;
