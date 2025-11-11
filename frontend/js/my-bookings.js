import api, { formatCurrency, formatDateTime, formatTimeSlot, showToast } from './api.js';
import authManager from './auth.js';

let currentStatus = 'all';
let currentBookingId = null;
let qrImageBase64 = null;

// Helper function to convert file to base64
async function fileToBase64(file, maxWidth = 800, maxHeight = 800) {
    return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('File size must be less than 5MB'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                resolve(base64);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

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
    const statusClass = booking.status.toLowerCase().replace(/_/g, '-');
    const canCancel = (booking.status === 'confirmed' || booking.status === 'pending') && 
                      booking.status !== 'pending_refund' && 
                      booking.status !== 'refund_completed' &&
                      booking.status !== 'refund_denied';
    
    // Format time slots - support both single and multiple
    let timeDisplay;
    if (booking.timeSlots && booking.timeSlots.length > 1) {
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

    // Determine status message
    let statusMessage = '';
    let statusMessageClass = '';
    
    // Handle refund statuses
    if (booking.status === 'pending_refund' && booking.refundRequest) {
        statusMessage = ' Cancellation request sent. Awaiting refund confirmation from owner.';
        statusMessageClass = 'pending-refund';
    } else if (booking.status === 'refund_completed' && booking.refundRequest) {
        const refundDate = new Date(booking.refundRequest.verifiedAt).toLocaleDateString('en-IN');
        const verifierName = booking.refundRequest.verifiedBy?.name || 'Owner';
        const isTierBased = booking.turf?.paymentMethod === 'tier';
        const refundType = isTierBased ? 'Full refund' : '90% refund';
        statusMessage = `💸 Refund Successful! Confirmed on ${refundDate} by ${verifierName}. ${refundType}: ${formatCurrency(booking.refundRequest.refundAmount)}`;
        statusMessageClass = 'refund-success';
    } else if (booking.status === 'refund_denied' && booking.refundRequest) {
        const reason = booking.refundRequest.verificationNote || 'No reason provided';
        statusMessage = ` Refund request rejected by owner. Reason: ${reason}`;
        statusMessageClass = 'refund-denied';
    } else if (booking.payment?.method === 'cash_at_turf' && !booking.payment?.cashCollected) {
        statusMessage = '💵 Please pay cash at the turf before your session starts';
        statusMessageClass = 'pending-cash';
    } else if (booking.payment?.method === 'cash_at_turf' && booking.payment?.cashCollected) {
        statusMessage = ' Cash payment collected by owner';
        statusMessageClass = 'confirmed';
    } else if (booking.tierPayment && booking.tierPayment.verificationStatus === 'pending' && booking.turf?.paymentMethod === 'tier') {
        statusMessage = ' Waiting for owner to verify your payment';
        statusMessageClass = 'pending';
    } else if (booking.status === 'pending' && booking.payment.status === 'pending' && !booking.tierPayment) {
        statusMessage = ' Payment pending - Please complete payment to confirm booking';
        statusMessageClass = 'pending';
    } else if (booking.status === 'confirmed' && booking.payment.status === 'completed') {
        statusMessage = ' Booking confirmed! Payment completed successfully.';
        statusMessageClass = 'confirmed';
    } else if (booking.tierPayment && booking.tierPayment.verificationStatus === 'approved') {
        statusMessage = ' Payment verified and booking confirmed!';
        statusMessageClass = 'confirmed';
    } else if (booking.tierPayment && booking.tierPayment.verificationStatus === 'rejected') {
        statusMessage = ` Payment verification failed${booking.tierPayment.rejectionReason ? ': ' + booking.tierPayment.rejectionReason : ''}`;
        statusMessageClass = 'cancelled';
    } else if (booking.status === 'cancelled' && booking.cancellation) {
        statusMessage = ` Cancelled: ${booking.cancellation.reason}`;
        statusMessageClass = 'cancelled';
    } else if (booking.status === 'completed') {
        statusMessage = '🎉 Booking completed successfully!';
        statusMessageClass = 'completed';
    }

    // Enhanced status badge text
    let statusBadgeText = booking.status;
    if (booking.status === 'pending_refund') {
        statusBadgeText = 'Pending Refund';
    } else if (booking.status === 'refund_completed') {
        statusBadgeText = 'Refund Completed';
    } else if (booking.status === 'refund_denied') {
        statusBadgeText = 'Refund Denied';
    }

    return `
        <div class="booking-card">
            <div class="booking-card-header">
                <div class="turf-info">
                    <h3>${booking.turf?.name || 'Unknown Turf'}</h3>
                    <div class="city">${booking.turf?.address?.city || 'N/A'}, ${booking.turf?.address?.state || 'N/A'}</div>
                </div>
                <span class="status-badge ${statusClass}">${statusBadgeText}</span>
            </div>

            <div class="booking-details">
                <div class="detail-item">
                    <span class="label date">Date</span>
                    <span class="value">${new Date(booking.bookingDate).toLocaleDateString('en-IN', { 
                        day: 'numeric',
                        month: 'short', 
                        year: 'numeric' 
                    })}</span>
                </div>
                <div class="detail-item">
                    <span class="label time">Time</span>
                    <span class="value">${timeDisplay}</span>
                </div>
                <div class="detail-item">
                    <span class="label sport">Sport</span>
                    <span class="value">${booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)}</span>
                </div>
                <div class="detail-item">
                    <span class="label amount">Amount</span>
                    <span class="value">${formatCurrency(booking.pricing?.totalAmount || 0)}</span>
                </div>
            </div>

            ${statusMessage ? `
                <div class="status-message ${statusMessageClass}">
                    ${statusMessage}
                </div>
            ` : ''}

            <div class="booking-actions">
                <a href="turf-details.html?id=${booking.turf._id}" class="btn-view-turf">
                    View Turf
                </a>
                ${canCancel ? `
                    <button class="btn-cancel-booking" onclick="openCancelModal('${booking._id}')">
                        Cancel Booking
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Open cancel modal
window.openCancelModal = function(bookingId) {
    currentBookingId = bookingId;
    qrImageBase64 = null;
    const modal = document.getElementById('cancelModal');
    if (modal) modal.classList.add('active');
};

// Close cancel modal
function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) modal.classList.remove('active');
    currentBookingId = null;
    qrImageBase64 = null;
    document.getElementById('cancelReason').value = '';
    document.getElementById('qrImageFile').value = '';
    document.getElementById('qrPreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'flex';
}

// Handle cancel booking
async function handleCancelBooking(e) {
    e.preventDefault();

    if (!currentBookingId) return;

    const reason = document.getElementById('cancelReason').value.trim();
    
    if (!reason) {
        showToast('Please provide a reason for cancellation', 'error');
        return;
    }

    if (!qrImageBase64) {
        showToast('Please upload QR code image for refund verification', 'error');
        return;
    }

    const confirmBtn = document.getElementById('confirmCancelBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        await api.cancelBooking(currentBookingId, reason, qrImageBase64);
        showToast('Cancellation request sent. Awaiting refund confirmation from owner.', 'success');
        closeCancelModal();
        loadBookings();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showToast(error.message || 'Failed to cancel booking', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
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

    // QR Upload handlers
    const qrUploadArea = document.getElementById('qrUploadArea');
    const qrImageFile = document.getElementById('qrImageFile');
    const removeQrBtn = document.getElementById('removeQrBtn');

    if (qrUploadArea) {
        qrUploadArea.addEventListener('click', (e) => {
            if (e.target.id !== 'removeQrBtn' && !e.target.closest('#removeQrBtn')) {
                qrImageFile.click();
            }
        });
    }

    if (qrImageFile) {
        qrImageFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                showToast('Please upload only JPG, JPEG, or PNG files', 'error');
                e.target.value = '';
                return;
            }

            try {
                showToast('Processing QR image...', 'info');
                qrImageBase64 = await fileToBase64(file);
                
                // Show preview
                document.getElementById('qrPreviewImg').src = qrImageBase64;
                document.getElementById('uploadPlaceholder').style.display = 'none';
                document.getElementById('qrPreview').style.display = 'flex';
                
                showToast('QR image uploaded successfully', 'success');
            } catch (error) {
                showToast('Failed to process image: ' + error.message, 'error');
                e.target.value = '';
            }
        });
    }

    if (removeQrBtn) {
        removeQrBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            qrImageBase64 = null;
            qrImageFile.value = '';
            document.getElementById('qrPreview').style.display = 'none';
            document.getElementById('uploadPlaceholder').style.display = 'flex';
            showToast('QR image removed', 'info');
        });
    }
});
