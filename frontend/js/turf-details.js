import api, { formatCurrency, formatTimeSlot, showToast } from './api.js';
import authManager, { openLoginModal } from './auth.js';

let currentTurf = null;
let selectedSlots = []; // Changed from selectedSlot to selectedSlots array

// Load turf details
async function loadTurfDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const turfId = urlParams.get('id');

    if (!turfId) {
        showToast('Invalid turf ID', 'error');
        window.location.href = 'turfs.html';
        return;
    }

    const loader = document.getElementById('turfLoader');
    const content = document.getElementById('turfContent');

    try {
        const response = await api.getTurfById(turfId);
        currentTurf = response.data;

        // Hide loader, show content
        if (loader) loader.style.display = 'none';
        if (content) content.style.display = 'block';

        // Populate turf details
        populateTurfDetails(currentTurf);
    } catch (error) {
        console.error('Error loading turf:', error);
        showToast('Failed to load turf details', 'error');
        setTimeout(() => window.location.href = 'turfs.html', 2000);
    }
}

// Populate turf details in UI
function populateTurfDetails(turf) {
    // Name and basic info
    document.getElementById('turfName').textContent = turf.name;
    document.getElementById('turfRating').textContent = (turf.rating?.average || 0).toFixed(1);
    document.getElementById('turfReviews').textContent = `(${turf.rating?.count || 0} reviews)`;
    document.getElementById('turfLocation').textContent = `${turf.address.city}, ${turf.address.state}`;
    document.getElementById('turfDescription').textContent = turf.description;

    // Images
    if (turf.images && turf.images.length > 0) {
        const primaryImage = turf.images.find(img => img.isPrimary) || turf.images[0];
        document.getElementById('mainImage').src = primaryImage.url;
        document.getElementById('mainImage').onerror = function() {
            this.src = 'https://placehold.co/800x400/10b981/white?text=Turf+Image';
        };

        // Thumbnails
        const thumbnails = document.getElementById('thumbnails');
        thumbnails.innerHTML = turf.images.map((img, idx) => `
            <div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="changeMainImage('${img.url}', this)">
                <img src="${img.url}" alt="Turf ${idx + 1}" onerror="this.src='https://placehold.co/100x80/10b981/white?text=Image'">
            </div>
        `).join('');
    }

    // Sports
    const sportsTags = document.getElementById('sportsTags');
    sportsTags.innerHTML = turf.sportsSupported.map(sport => 
        `<span class="sport-tag">${sport}</span>`
    ).join('');

    // Populate booking sport options
    const bookingSport = document.getElementById('bookingSport');
    bookingSport.innerHTML = '<option value="">Choose sport</option>' + 
        turf.sportsSupported.map(sport => 
            `<option value="${sport}">${sport.charAt(0).toUpperCase() + sport.slice(1)}</option>`
        ).join('');

    // Amenities
    const amenitiesList = document.getElementById('amenitiesList');
    const amenityIcons = {
        parking: 'fa-parking',
        floodlights: 'fa-lightbulb',
        washroom: 'fa-restroom',
        changing_room: 'fa-door-open',
        drinking_water: 'fa-tint',
        first_aid: 'fa-first-aid'
    };
    amenitiesList.innerHTML = turf.amenities.map(amenity => `
        <div class="amenity-item">
            <i class="fas ${amenityIcons[amenity] || 'fa-check'}"></i>
            ${amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
    `).join('');

    // Operating hours
    const operatingHours = document.getElementById('operatingHours');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    operatingHours.innerHTML = days.map(day => {
        const hours = turf.operatingHours[day];
        return `
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                <strong>${day.charAt(0).toUpperCase() + day.slice(1)}</strong>
                <span>${hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}</span>
            </div>
        `;
    }).join('');

    // Contact info
    const contactInfo = document.getElementById('contactInfo');
    contactInfo.innerHTML = `
        <div style="margin-bottom: 0.5rem;"><i class="fas fa-phone"></i> ${turf.contactInfo.phone}</div>
        ${turf.contactInfo.email ? `<div style="margin-bottom: 0.5rem;"><i class="fas fa-envelope"></i> ${turf.contactInfo.email}</div>` : ''}
        <div><i class="fas fa-map-marker-alt"></i> ${turf.address.street}, ${turf.address.city}, ${turf.address.state} - ${turf.address.pincode}</div>
    `;

    // Pricing
    document.getElementById('hourlyRate').textContent = turf.pricing.hourlyRate;
    document.getElementById('weekendRate').textContent = turf.pricing.weekendRate;

    // Initialize map if location coordinates are available
    if (turf.location && turf.location.coordinates && turf.location.coordinates.length === 2) {
        const [lng, lat] = turf.location.coordinates;
        initTurfMap(lat, lng, turf.name);
    }

    // Set min date for booking
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
}

// Initialize map for turf location
function initTurfMap(lat, lng, turfName) {
    const location = { lat, lng };
    
    const map = new google.maps.Map(document.getElementById('turfMap'), {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });

    // Add marker
    new google.maps.Marker({
        position: location,
        map: map,
        title: turfName,
        animation: google.maps.Animation.DROP
    });
}

// Change main image
window.changeMainImage = function(url, element) {
    document.getElementById('mainImage').src = url;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
};

// Check if a time slot is in the past
function isSlotPast(date, startTime) {
    const now = new Date();
    const slotDate = new Date(date);
    const [hours, minutes] = startTime.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    
    return slotDate < now;
}

// Load available slots
async function loadAvailableSlots(date) {
    const slotsContainer = document.getElementById('slotsContainer');
    slotsContainer.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading slots...</div>';

    // Clear selected slots when date changes
    selectedSlots = [];

    try {
        const response = await api.getAvailableSlots(currentTurf._id, date);
        const slots = response.data;

        if (slots && slots.length > 0) {
            slotsContainer.innerHTML = `
                <p class="text-muted" style="margin-bottom: 1rem;">
                    <i class="fas fa-info-circle"></i> Click to select one or more time slots
                </p>
                <div class="slots-grid">` + slots.map(slot => {
                    const isPast = isSlotPast(date, slot.startTime);
                    const isDisabled = !slot.isAvailable || isPast;
                    const disabledReason = isPast ? '(Time passed)' : '(Booked)';
                    
                    return `
                <button type="button" class="slot-btn" 
                    ${isDisabled ? 'disabled' : ''}
                    data-start="${slot.startTime}"
                    data-end="${slot.endTime}"
                    onclick="toggleSlot('${slot.startTime}', '${slot.endTime}', this)">
                    ${slot.startTime} - ${slot.endTime}
                    ${isDisabled ? `<br><small>${disabledReason}</small>` : ''}
                </button>
            `;
                }).join('') + '</div>';
        } else {
            slotsContainer.innerHTML = '<p class="text-muted">No slots available for this date</p>';
        }
    } catch (error) {
        console.error('Error loading slots:', error);
        slotsContainer.innerHTML = '<p class="text-muted" style="color: var(--danger);">Failed to load slots</p>';
    }
}

// Toggle slot selection (supports multiple slots)
window.toggleSlot = function(startTime, endTime, element) {
    const slotIndex = selectedSlots.findIndex(s => s.startTime === startTime);
    
    if (slotIndex > -1) {
        // Deselect
        selectedSlots.splice(slotIndex, 1);
        element.classList.remove('selected');
    } else {
        // Select
        selectedSlots.push({ startTime, endTime });
        element.classList.add('selected');
    }

    // Update UI based on selection
    if (selectedSlots.length > 0) {
        document.getElementById('playerDetailsGroup').style.display = 'block';
        document.getElementById('notesGroup').style.display = 'block';
        document.getElementById('bookingSummary').style.display = 'block';
        updateBookingSummary();
    } else {
        document.getElementById('playerDetailsGroup').style.display = 'none';
        document.getElementById('notesGroup').style.display = 'none';
        document.getElementById('bookingSummary').style.display = 'none';
    }
};

// Update booking summary
function updateBookingSummary() {
    if (selectedSlots.length === 0) return;

    const bookingDate = new Date(document.getElementById('bookingDate').value);
    const isWeekend = bookingDate.getDay() === 0 || bookingDate.getDay() === 6;
    
    const basePricePerSlot = isWeekend ? currentTurf.pricing.weekendRate : currentTurf.pricing.hourlyRate;
    const basePrice = basePricePerSlot * selectedSlots.length;
    const total = basePrice; // No GST

    // Sort slots by start time for display
    const sortedSlots = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    let slotsText;
    if (selectedSlots.length === 1) {
        slotsText = formatTimeSlot(sortedSlots[0].startTime, sortedSlots[0].endTime);
    } else {
        // Show all individual slots
        const slotsList = sortedSlots.map(slot => formatTimeSlot(slot.startTime, slot.endTime)).join(', ');
        slotsText = `${selectedSlots.length} slots: ${slotsList}`;
    }

    document.getElementById('selectedSlotText').textContent = slotsText;
    document.getElementById('basePrice').textContent = formatCurrency(basePrice);
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

// Handle booking form submission
async function handleBooking(e) {
    e.preventDefault();

    if (!authManager.isAuthenticated()) {
        showToast('Please login to book a turf', 'info');
        openLoginModal();
        return;
    }

    if (selectedSlots.length === 0) {
        showToast('Please select at least one time slot', 'error');
        return;
    }

    const bookingData = {
        turfId: currentTurf._id,
        bookingDate: document.getElementById('bookingDate').value,
        timeSlots: selectedSlots, // Send array of slots
        sport: document.getElementById('bookingSport').value,
        playerDetails: {
            name: authManager.user.name,
            phone: authManager.user.phone,
            numberOfPlayers: parseInt(document.getElementById('numberOfPlayers').value) || 1
        },
        notes: document.getElementById('bookingNotes').value
    };

    const bookNowBtn = document.getElementById('bookNowBtn');
    bookNowBtn.disabled = true;
    bookNowBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        const response = await api.createBooking(bookingData);
        const { booking, paymentMethod, upiQrCode, razorpayOrder } = response.data;

        // Handle tier-based payment
        if (paymentMethod === 'tier') {
            bookNowBtn.disabled = false;
            bookNowBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';
            
            // Show UPI payment modal
            showTierPaymentModal(booking, upiQrCode);
            return;
        }

        // Handle commission-based payment (Razorpay)
        const options = {
            key: razorpayOrder.keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order_id: razorpayOrder.orderId,
            name: 'TurfSpot',
            description: `Booking for ${currentTurf.name}`,
            handler: async function(paymentResponse) {
                try {
                    await api.verifyPayment(booking._id, {
                        razorpayPaymentId: paymentResponse.razorpay_payment_id,
                        razorpaySignature: paymentResponse.razorpay_signature
                    });
                    
                    showToast('Booking confirmed successfully!', 'success');
                    setTimeout(() => window.location.href = 'my-bookings.html', 2000);
                } catch (error) {
                    showToast('Payment verification failed', 'error');
                    console.error('Payment verification error:', error);
                }
            },
            prefill: {
                name: authManager.user.name,
                email: authManager.user.email,
                contact: authManager.user.phone
            },
            theme: {
                color: '#10b981'
            }
        };

        const razorpay = new Razorpay(options);
        razorpay.open();

        razorpay.on('payment.failed', function(response) {
            showToast('Payment failed. Please try again.', 'error');
            console.error('Payment failed:', response);
        });

    } catch (error) {
        console.error('Booking error:', error);
        showToast(error.message || 'Failed to create booking', 'error');
    } finally {
        bookNowBtn.disabled = false;
        bookNowBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';
    }
}

// Show tier payment modal
let currentBookingForPayment = null;

function showTierPaymentModal(booking, upiQrCode) {
    currentBookingForPayment = booking;
    
    // Create modal if doesn't exist
    let modal = document.getElementById('tierPaymentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'tierPaymentModal';
        modal.className = 'modal';
        modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;';
        
        modal.innerHTML = `
            <div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 1rem;">Complete Payment</h2>
                <p style="margin-bottom: 1rem;">Please pay via UPI and upload payment screenshot</p>
                
                <div style="background: var(--light-bg, #f3f4f6); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong>Amount to Pay:</strong>
                    <div style="font-size: 2rem; color: var(--primary); font-weight: bold;">${formatCurrency(booking.pricing.totalAmount)}</div>
                </div>
                
                <div style="text-align: center; margin: 1.5rem 0;">
                    <strong style="display: block; margin-bottom: 0.5rem;">Scan QR Code to Pay</strong>
                    ${upiQrCode && upiQrCode.url ? `
                        <img src="${upiQrCode.url}" alt="UPI QR Code" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 2px solid var(--border-color);">
                    ` : '<p style="color: var(--danger);">UPI QR code not available</p>'}
                </div>
                
                <div style="margin: 1.5rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Upload Payment Screenshot*</label>
                    <div id="uploadArea" style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s;">
                        <i class="fas fa-cloud-upload-alt fa-2x" style="color: var(--primary); display: block; margin-bottom: 0.5rem;"></i>
                        <p>Click or drag to upload screenshot</p>
                        <input type="file" id="paymentScreenshotInput" accept="image/*" style="display: none;">
                    </div>
                    <img id="screenshotPreview" style="display: none; max-width: 100%; max-height: 200px; margin-top: 1rem; border-radius: 8px;">
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button onclick="closeTierPaymentModal()" class="btn btn-outline" style="flex: 1;">Cancel</button>
                    <button onclick="submitTierPayment()" class="btn btn-primary" style="flex: 1;">
                        <i class="fas fa-check"></i> Submit Payment
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup file upload
        const uploadArea = modal.querySelector('#uploadArea');
        const fileInput = modal.querySelector('#paymentScreenshotInput');
        const preview = modal.querySelector('#screenshotPreview');
        
        uploadArea.onclick = () => fileInput.click();
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
            uploadArea.style.background = 'var(--light-bg, #f3f4f6)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'white';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'white';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleScreenshotSelect(file, preview);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleScreenshotSelect(file, preview);
            }
        });
    }
    
    modal.style.display = 'flex';
}

let uploadedScreenshotFile = null;

function handleScreenshotSelect(file, preview) {
    uploadedScreenshotFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

window.closeTierPaymentModal = function() {
    const modal = document.getElementById('tierPaymentModal');
    if (modal) {
        modal.style.display = 'none';
        uploadedScreenshotFile = null;
        currentBookingForPayment = null;
    }
};

window.submitTierPayment = async function() {
    if (!uploadedScreenshotFile) {
        showToast('Please upload payment screenshot', 'error');
        return;
    }
    
    if (!currentBookingForPayment) {
        showToast('Booking information not found', 'error');
        return;
    }
    
    try {
        // Convert to base64 (in production, upload to cloud storage)
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target.result;
            
            await api.uploadTierPaymentScreenshot(currentBookingForPayment._id, base64Image);
            
            showToast('Payment screenshot uploaded! Waiting for owner verification.', 'success');
            closeTierPaymentModal();
            setTimeout(() => window.location.href = 'my-bookings.html', 2000);
        };
        reader.readAsDataURL(uploadedScreenshotFile);
    } catch (error) {
        showToast(error.message || 'Failed to upload screenshot', 'error');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTurfDetails();

    // Date change listener
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        bookingDate.addEventListener('change', (e) => {
            if (e.target.value) {
                loadAvailableSlots(e.target.value);
                selectedSlot = null;
                document.getElementById('bookingSummary').style.display = 'none';
            }
        });
    }

    // Booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
    }
});
