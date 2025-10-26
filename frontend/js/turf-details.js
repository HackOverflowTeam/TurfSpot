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
            this.src = 'https://via.placeholder.com/800x400?text=Turf+Image';
        };

        // Thumbnails
        const thumbnails = document.getElementById('thumbnails');
        thumbnails.innerHTML = turf.images.map((img, idx) => `
            <div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="changeMainImage('${img.url}', this)">
                <img src="${img.url}" alt="Turf ${idx + 1}" onerror="this.src='https://via.placeholder.com/100x80?text=Image'">
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
                <div class="slots-grid">` + slots.map(slot => `
                <button type="button" class="slot-btn" 
                    ${!slot.isAvailable ? 'disabled' : ''}
                    data-start="${slot.startTime}"
                    data-end="${slot.endTime}"
                    onclick="toggleSlot('${slot.startTime}', '${slot.endTime}', this)">
                    ${slot.startTime} - ${slot.endTime}
                    ${!slot.isAvailable ? '<br><small>(Booked)</small>' : ''}
                </button>
            `).join('') + '</div>';
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
        const { booking, razorpayOrder } = response.data;

        // Initialize Razorpay payment
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
