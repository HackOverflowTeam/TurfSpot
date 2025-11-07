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

    // Price range
    document.getElementById('priceRange').textContent = `₹${turf.pricing.hourlyRate} - ₹${turf.pricing.weekendRate}/hr`;
    
    // Operating time (general)
    if (turf.operatingHours?.monday) {
        const hours = turf.operatingHours.monday;
        document.getElementById('operatingTime').textContent = hours.isOpen ? 
            `${hours.open} - ${hours.close}` : 'Closed';
    }

    // Update rating stars
    const avgRating = turf.rating?.average || 0;
    const starsContainer = document.getElementById('ratingStars');
    starsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const starClass = i <= Math.round(avgRating) ? 'fas fa-star' : 'far fa-star';
        starsContainer.innerHTML += `<i class="${starClass}"></i>`;
    }

    // Images
    if (turf.images && turf.images.length > 0) {
        const primaryImage = turf.images.find(img => img.isPrimary) || turf.images[0];
        document.getElementById('mainImage').src = primaryImage.url;
        document.getElementById('mainImage').onerror = function() {
            this.src = 'https://placehold.co/800x500/34A87E/white?text=Turf+Image';
        };

        // Thumbnails
        const thumbnails = document.getElementById('thumbnails');
        thumbnails.innerHTML = turf.images.map((img, idx) => `
            <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" onclick="changeMainImage('${img.url}', this)">
                <img src="${img.url}" alt="Turf ${idx + 1}" onerror="this.src='https://placehold.co/140x90/34A87E/white?text=Image'">
            </div>
        `).join('');
    }

    // Sports with icons
    const sportsTags = document.getElementById('sportsTags');
    const sportIcons = {
        cricket: '🏏',
        football: '⚽',
        basketball: '🏀',
        tennis: '🎾',
        badminton: '🏸',
        volleyball: '🏐'
    };
    sportsTags.innerHTML = turf.sportsSupported.map(sport => {
        const icon = sportIcons[sport.toLowerCase()] || '⚽';
        return `<div class="sport-pill">${icon} ${sport}</div>`;
    }).join('');

    // Populate booking sport options
    const bookingSport = document.getElementById('bookingSport');
    bookingSport.innerHTML = '<option value="">Choose a sport</option>' + 
        turf.sportsSupported.map(sport => 
            `<option value="${sport}">${sport.charAt(0).toUpperCase() + sport.slice(1)}</option>`
        ).join('');

    // Amenities with icons
    const amenitiesList = document.getElementById('amenitiesList');
    const amenityIcons = {
        parking: 'fa-parking',
        floodlights: 'fa-lightbulb',
        washroom: 'fa-restroom',
        changing_room: 'fa-door-open',
        drinking_water: 'fa-tint',
        first_aid: 'fa-first-aid',
        shower: 'fa-shower',
        seating: 'fa-chair',
        cafeteria: 'fa-coffee',
        locker: 'fa-lock'
    };
    amenitiesList.innerHTML = turf.amenities.map(amenity => {
        const iconClass = amenityIcons[amenity.toLowerCase()] || 'fa-check-circle';
        return `
            <div class="amenity-item">
                <i class="fas ${iconClass}"></i>
                <span>${amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
        `;
    }).join('');

    // Operating hours - Table (Desktop)
    const operatingHoursTable = document.getElementById('operatingHoursTable');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    operatingHoursTable.innerHTML = days.map(day => {
        const hours = turf.operatingHours[day];
        return `
            <tr>
                <td>${day.charAt(0).toUpperCase() + day.slice(1)}</td>
                <td>${hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}</td>
            </tr>
        `;
    }).join('');

    // Operating hours - Cards (Mobile)
    const operatingHoursCards = document.getElementById('operatingHoursCards');
    operatingHoursCards.innerHTML = days.map(day => {
        const hours = turf.operatingHours[day];
        return `
            <div class="hour-card">
                <span class="day">${day.charAt(0).toUpperCase() + day.slice(1)}</span>
                <span class="time">${hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}</span>
            </div>
        `;
    }).join('');

    // Contact info with icons
    const contactInfo = document.getElementById('contactInfo');
    contactInfo.innerHTML = `
        <div class="contact-item">
            <div class="contact-icon">
                <i class="fas fa-phone"></i>
            </div>
            <div class="contact-info">
                <div class="contact-label">Phone</div>
                <div class="contact-value">${turf.contactInfo.phone}</div>
            </div>
        </div>
        ${turf.contactInfo.email ? `
        <div class="contact-item">
            <div class="contact-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="contact-info">
                <div class="contact-label">Email</div>
                <div class="contact-value">${turf.contactInfo.email}</div>
            </div>
        </div>
        ` : ''}
        <div class="contact-item">
            <div class="contact-icon">
                <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="contact-info">
                <div class="contact-label">Address</div>
                <div class="contact-value">${turf.address.street}, ${turf.address.city}, ${turf.address.state} - ${turf.address.pincode}</div>
            </div>
        </div>
    `;

    // Pricing
    document.getElementById('hourlyRate').textContent = turf.pricing.hourlyRate;
    document.getElementById('weekendRate').textContent = turf.pricing.weekendRate;

    // Initialize map if location coordinates are available
    if (turf.location && turf.location.coordinates && turf.location.coordinates.length === 2) {
        const [lng, lat] = turf.location.coordinates;
        
        // Show loading state
        const mapElement = document.getElementById('turfMap');
        if (mapElement) {
            mapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #F0FAF5; color: #34A87E;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                </div>
            `;
        }
        
        initTurfMap(lat, lng, turf.name);
        
        // Set Google Maps link
        const googleMapsLink = document.getElementById('googleMapsLink');
        if (googleMapsLink) {
            googleMapsLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
        }
    } else {
        // No location data available
        const mapElement = document.getElementById('turfMap');
        if (mapElement) {
            mapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #F0FAF5; color: #5B6B61; font-family: 'Inter', sans-serif;">
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: #34A87E; margin-bottom: 1rem;"></i>
                        <p>Location not available</p>
                    </div>
                </div>
            `;
        }
    }

    // Set min date for booking
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
}

// Initialize map for turf location
function initTurfMap(lat, lng, turfName) {
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.log('Waiting for Google Maps to load...');
        // Retry after a short delay
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
            retryCount++;
            if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                clearInterval(retryInterval);
                initTurfMap(lat, lng, turfName);
            } else if (retryCount >= maxRetries) {
                clearInterval(retryInterval);
                console.error('Google Maps failed to load');
                showMapFallback(lat, lng);
            }
        }, 500);
        return;
    }

    try {
        const location = { lat, lng };
        
        const mapElement = document.getElementById('turfMap');
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }
        
        const map = new google.maps.Map(mapElement, {
            center: location,
            zoom: 15,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                }
            ]
        });

        // Add marker with custom styling
        const marker = new google.maps.Marker({
            position: location,
            map: map,
            title: turfName,
            animation: google.maps.Animation.DROP,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#34A87E',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3
            }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 10px; font-family: 'Inter', sans-serif;">
                <h3 style="margin: 0 0 5px 0; color: #1A2E22; font-size: 1rem;">${turfName}</h3>
                <p style="margin: 0; color: #5B6B61; font-size: 0.9rem;">Click marker for directions</p>
            </div>`
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        console.log('Map initialized successfully at:', lat, lng);
    } catch (error) {
        console.error('Error initializing map:', error);
        showMapFallback(lat, lng);
    }
}

// Show map fallback
function showMapFallback(lat, lng) {
    const mapElement = document.getElementById('turfMap');
    if (mapElement) {
        mapElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #F0FAF5; color: #5B6B61; font-family: 'Inter', sans-serif;">
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: #34A87E; margin-bottom: 1rem;"></i>
                    <p style="margin-bottom: 1rem;">Map temporarily unavailable</p>
                    <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" 
                       style="display: inline-flex; align-items: center; gap: 0.5rem; color: #34A87E; font-weight: 600; text-decoration: none; padding: 0.75rem 1.5rem; background: white; border: 2px solid #34A87E; border-radius: 8px; transition: all 0.3s ease;">
                        <i class="fas fa-external-link-alt"></i>
                        Open in Google Maps
                    </a>
                </div>
            </div>
        `;
    }
}

// Change main image
window.changeMainImage = function(url, element) {
    document.getElementById('mainImage').src = url;
    document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
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
    slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--primary-green); padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading slots...</p>';

    // Clear selected slots when date changes
    selectedSlots = [];

    try {
        const response = await api.getAvailableSlots(currentTurf._id, date);
        const slots = response.data;

        if (slots && slots.length > 0) {
            slotsContainer.innerHTML = slots.map(slot => {
                const isPast = isSlotPast(date, slot.startTime);
                const isDisabled = !slot.isAvailable || isPast;
                const disabledReason = isPast ? 'Time passed' : 'Booked';
                
                return `
                    <button type="button" class="slot-button" 
                        ${isDisabled ? 'disabled' : ''}
                        data-start="${slot.startTime}"
                        data-end="${slot.endTime}"
                        onclick="toggleSlot('${slot.startTime}', '${slot.endTime}', this)">
                        ${slot.startTime} - ${slot.endTime}
                        ${isDisabled ? `<br><small style="font-size: 0.75rem; opacity: 0.7;">${disabledReason}</small>` : ''}
                    </button>
                `;
            }).join('');
        } else {
            slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No slots available for this date</p>';
        }
    } catch (error) {
        console.error('Error loading slots:', error);
        slotsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e74c3c; padding: 2rem;">Failed to load slots</p>';
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
    // Initialize auth
    authManager.init();
    
    loadTurfDetails();

    // Date change listener
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        bookingDate.addEventListener('change', (e) => {
            if (e.target.value) {
                loadAvailableSlots(e.target.value);
                selectedSlots = [];
                document.getElementById('bookingSummary').style.display = 'none';
            }
        });
    }

    // Booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
    }
    
    // Show/hide mobile CTA on scroll
    const mobileCTA = document.querySelector('.mobile-booking-cta');
    if (mobileCTA) {
        const handleScroll = () => {
            // Only show on mobile/tablet
            if (window.innerWidth > 768) {
                mobileCTA.style.display = 'none';
                return;
            }

            const bookingSidebar = document.querySelector('.booking-sidebar');
            const slotsGrid = document.querySelector('.slots-grid');
            const bookingFormElement = document.getElementById('bookingForm');
            
            if (bookingSidebar && slotsGrid) {
                const sidebarRect = bookingSidebar.getBoundingClientRect();
                const slotsRect = slotsGrid.getBoundingClientRect();
                const formRect = bookingFormElement ? bookingFormElement.getBoundingClientRect() : null;
                
                // Hide CTA when we've scrolled to or past the booking form
                if (formRect && formRect.top <= window.innerHeight) {
                    mobileCTA.style.display = 'none';
                    return;
                }
                
                // Hide CTA when we've scrolled past the slots section
                if (slotsRect.bottom < 0) {
                    mobileCTA.style.display = 'none';
                    return;
                }
                
                // Show CTA when booking sidebar is not visible but we haven't passed slots
                if (sidebarRect.top < -100 || sidebarRect.bottom > window.innerHeight + 100) {
                    mobileCTA.style.display = 'block';
                } else {
                    mobileCTA.style.display = 'none';
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        
        // Initial check
        handleScroll();
    }
});
