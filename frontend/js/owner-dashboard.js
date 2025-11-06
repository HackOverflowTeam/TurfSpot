import api, { formatCurrency, formatDateTime, formatTimeSlot, showToast } from './api.js';
import authManager from './auth.js';

let currentTab = 'turfs';
let myTurfs = [];
let selectedTurfId = null;
let map = null;
let marker = null;
let selectedLocation = null;

// Helper function to convert file to base64 with image optimization
async function fileToBase64(file, maxWidth = 1200, maxHeight = 1200) {
    return new Promise((resolve, reject) => {
        // Check file size (max 5MB)
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
                // Create canvas to resize image
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
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

                // Convert to base64 with compression
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                resolve(base64);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

// Helper function for QR code conversion (smaller size)
async function qrCodeToBase64(file) {
    return fileToBase64(file, 600, 600);
}

// Initialize Google Map
function initMap() {
    // Default location (India center)
    const defaultLocation = { lat: 20.5937, lng: 78.9629 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: selectedLocation || defaultLocation,
        zoom: selectedLocation ? 15 : 5,
        mapTypeControl: true,
        streetViewControl: false
    });

    // Add click listener to map
    map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarker(lat, lng);
    });

    // If location already selected, show marker
    if (selectedLocation) {
        setMarker(selectedLocation.lat, selectedLocation.lng);
    }

    // Try to get user's current location
    if (navigator.geolocation && !selectedLocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(userLocation);
            map.setZoom(12);
        });
    }
}

// Set marker on map
function setMarker(lat, lng) {
    // Remove existing marker
    if (marker) {
        marker.setMap(null);
    }

    // Create new marker
    marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    // Update marker position on drag
    marker.addListener('dragend', (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        updateSelectedLocation(newLat, newLng);
    });

    updateSelectedLocation(lat, lng);
}

// Update selected location
function updateSelectedLocation(lat, lng) {
    selectedLocation = { lat, lng };
    document.getElementById('turfLatitude').value = lat;
    document.getElementById('turfLongitude').value = lng;
    document.getElementById('selectedCoordinates').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Get user's current location
function getUserLocation() {
    const btn = document.getElementById('getLocationBtn');
    const originalText = btn.innerHTML;
    
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Center map on user location
            map.setCenter({ lat, lng });
            map.setZoom(15);
            
            // Set marker at user location
            setMarker(lat, lng);
            
            showToast('Location detected successfully!', 'success');
            btn.disabled = false;
            btn.innerHTML = originalText;
        },
        (error) => {
            let errorMessage = 'Unable to get your location';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location permissions.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
            }
            
            showToast(errorMessage, 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Load owner data
async function loadOwnerData() {
    // Wait for auth to initialize first
    const hasAccess = await authManager.requireAuth('owner');
    if (!hasAccess) return;

    await Promise.all([
        loadMyTurfs(),
        loadAnalytics()
    ]);
}

// Load my turfs
async function loadMyTurfs() {
    const loader = document.getElementById('turfsLoader');
    const turfsList = document.getElementById('turfsList');

    if (loader) loader.style.display = 'block';

    try {
        const response = await api.getMyTurfs();
        myTurfs = response.data || [];

        if (loader) loader.style.display = 'none';

        if (myTurfs.length > 0) {
            turfsList.innerHTML = myTurfs.map(turf => createTurfManagementCard(turf)).join('');
            
            // Update turf filters
            updateTurfFilters();
        } else {
            turfsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-building"></i>
                    <h3>No Turfs Yet</h3>
                    <p>Start by adding your first turf</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addTurfBtn').click()">
                        Add Turf
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load turfs', 'error');
    }
}

// Create turf management card
function createTurfManagementCard(turf) {
    const statusBadges = {
        approved: '<span class="status-badge status-confirmed">Approved</span>',
        pending: '<span class="status-badge status-pending">Pending Approval</span>',
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
                    <strong>Sports:</strong>
                    <p>${turf.sportsSupported.join(', ')}</p>
                </div>
                <div>
                    <strong>Hourly Rate:</strong>
                    <p>${formatCurrency(turf.pricing.hourlyRate)}</p>
                </div>
                <div>
                    <strong>Rating:</strong>
                    <p><i class="fas fa-star" style="color: var(--warning);"></i> ${(turf.rating?.average || 0).toFixed(1)} (${turf.rating?.count || 0})</p>
                </div>
                <div>
                    <strong>Created:</strong>
                    <p>${formatDateTime(turf.createdAt)}</p>
                </div>
            </div>
            <div class="booking-actions">
                <button class="btn btn-outline" onclick="window.location.href='turf-details.html?id=${turf._id}'">
                    View Details
                </button>
                <button class="btn btn-primary" onclick="editTurf('${turf._id}')">
                    Edit
                </button>
                <button class="btn btn-danger" onclick="deleteTurf('${turf._id}')">
                    Delete
                </button>
            </div>
        </div>
    `;
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await api.getOwnerAnalytics({ period: 30 });
        const analytics = response.data;

        // Update stats
        document.getElementById('totalTurfs').textContent = myTurfs.length;
        document.getElementById('totalBookings').textContent = analytics.overview.totalBookings || 0;
        document.getElementById('totalRevenue').textContent = formatCurrency(analytics.overview.totalRevenue || 0);
        document.getElementById('ownerEarnings').textContent = formatCurrency(analytics.overview.ownerEarnings || 0);
        document.getElementById('platformFee').textContent = formatCurrency(analytics.overview.platformFees || 0);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Load bookings
async function loadOwnerBookings() {
    const loader = document.getElementById('bookingsLoader');
    const bookingsList = document.getElementById('bookingsList');

    if (loader) loader.style.display = 'block';

    try {
        const params = {};
        const turfFilter = document.getElementById('turfFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        if (turfFilter) params.turfId = turfFilter;
        if (statusFilter) params.status = statusFilter;

        const response = await api.getOwnerBookings(params);

        if (loader) loader.style.display = 'none';

        if (response.data && response.data.length > 0) {
            bookingsList.innerHTML = response.data.map(booking => createOwnerBookingCard(booking)).join('');
        } else {
            bookingsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Bookings Found</h3>
                    <p>No bookings match your filters</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        if (loader) loader.style.display = 'none';
        showToast('Failed to load bookings', 'error');
    }
}

// Create owner booking card
function createOwnerBookingCard(booking) {
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
                    <h3>${booking.user?.name || 'Unknown User'}</h3>
                    <p class="text-muted">${booking.user?.email}</p>
                </div>
                <span class="status-badge ${statusClass}">${booking.status.toUpperCase()}</span>
            </div>
            <div class="booking-details">
                <div>
                    <strong>Turf:</strong>
                    <p>${booking.turf?.name}</p>
                </div>
                <div>
                    <strong>Date:</strong>
                    <p>${new Date(booking.bookingDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                    <strong>Time:</strong>
                    <p>${timeDisplay}</p>
                </div>
                <div>
                    <strong>Sport:</strong>
                    <p>${booking.sport}</p>
                </div>
                <div>
                    <strong>Players:</strong>
                    <p>${booking.playerDetails?.numberOfPlayers || 'N/A'}</p>
                </div>
                <div>
                    <strong>Amount:</strong>
                    <p>${formatCurrency(booking.pricing?.totalAmount || 0)}</p>
                </div>
            </div>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        </div>
    `;
}

// Update turf filters
function updateTurfFilters() {
    const turfFilter = document.getElementById('turfFilter');
    const analyticsTurf = document.getElementById('analyticsTurf');

    const options = '<option value="">All Turfs</option>' + 
        myTurfs.map(turf => `<option value="${turf._id}">${turf.name}</option>`).join('');

    if (turfFilter) turfFilter.innerHTML = options;
    if (analyticsTurf) analyticsTurf.innerHTML = options;
}

// Add/Edit turf functions
window.editTurf = function(turfId) {
    const turf = myTurfs.find(t => t._id === turfId);
    if (!turf) return;

    selectedTurfId = turfId;
    document.getElementById('turfModalTitle').textContent = 'Edit Turf';
    
    // Populate form
    document.getElementById('turfName').value = turf.name;
    document.getElementById('turfDescription').value = turf.description;
    document.getElementById('turfStreet').value = turf.address.street;
    document.getElementById('turfCity').value = turf.address.city;
    document.getElementById('turfState').value = turf.address.state;
    document.getElementById('turfPincode').value = turf.address.pincode;
    document.getElementById('turfPhone').value = turf.contactInfo.phone;
    document.getElementById('turfEmail').value = turf.contactInfo.email || '';
    document.getElementById('hourlyRate').value = turf.pricing.hourlyRate;
    document.getElementById('weekendRate').value = turf.pricing.weekendRate;

    // Set location coordinates
    if (turf.location && turf.location.coordinates && turf.location.coordinates.length === 2) {
        const [lng, lat] = turf.location.coordinates;
        selectedLocation = { lat, lng };
        document.getElementById('turfLatitude').value = lat;
        document.getElementById('turfLongitude').value = lng;
        document.getElementById('selectedCoordinates').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    // Set sports (checkboxes)
    document.querySelectorAll('input[name="sports"]').forEach(checkbox => {
        checkbox.checked = turf.sportsSupported.includes(checkbox.value);
    });

    // Set amenities
    document.querySelectorAll('.checkbox-group input[type="checkbox"]:not([name="sports"])').forEach(cb => {
        cb.checked = turf.amenities.includes(cb.value);
    });

    document.getElementById('turfModal').classList.add('active');
    
    // Initialize map after modal is visible
    setTimeout(() => {
        initMap();
    }, 100);
};

window.deleteTurf = async function(turfId) {
    if (!confirm('Are you sure you want to delete this turf? This action cannot be undone.')) {
        return;
    }

    try {
        await api.deleteTurf(turfId);
        showToast('Turf deleted successfully', 'success');
        loadMyTurfs();
    } catch (error) {
        console.error('Error deleting turf:', error);
        showToast(error.message || 'Failed to delete turf', 'error');
    }
};

// Handle turf form submission
async function handleTurfSubmit(e) {
    e.preventDefault();

    // Get selected sports from checkboxes
    const sportsCheckboxes = document.querySelectorAll('input[name="sports"]:checked');
    const selectedSports = Array.from(sportsCheckboxes).map(cb => cb.value);

    // Validate at least one sport is selected
    if (selectedSports.length === 0) {
        showToast('Please select at least one sport', 'error');
        return;
    }

    // Validate location is selected
    const latitude = parseFloat(document.getElementById('turfLatitude').value);
    const longitude = parseFloat(document.getElementById('turfLongitude').value);
    
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        showToast('Please select location on the map', 'error');
        return;
    }

    const amenityCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked:not([name="sports"])');
    const selectedAmenities = Array.from(amenityCheckboxes).map(cb => cb.value);

    // Get payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const upiQrCodeUrl = document.getElementById('upiQrCodeUrl').value;
    const upiQrCodeFile = document.getElementById('upiQrCodeFile').files[0];

    // Validate UPI QR for tier-based
    if (paymentMethod === 'tier' && !upiQrCodeUrl && !upiQrCodeFile) {
        showToast('Please provide UPI QR code (file or URL) for tier-based payment', 'error');
        return;
    }

    // Convert UPI QR file to base64 if uploaded
    let upiQrBase64 = null;
    if (upiQrCodeFile) {
        try {
            showToast('Processing UPI QR code...', 'info');
            upiQrBase64 = await qrCodeToBase64(upiQrCodeFile);
        } catch (error) {
            showToast('Failed to process UPI QR code: ' + error.message, 'error');
            return;
        }
    }

    const turfData = {
        name: document.getElementById('turfName').value,
        description: document.getElementById('turfDescription').value,
        address: {
            street: document.getElementById('turfStreet').value,
            city: document.getElementById('turfCity').value,
            state: document.getElementById('turfState').value,
            pincode: document.getElementById('turfPincode').value
        },
        location: {
            type: 'Point',
            coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
        },
        contactInfo: {
            phone: document.getElementById('turfPhone').value,
            email: document.getElementById('turfEmail').value
        },
        sportsSupported: selectedSports,
        pricing: {
            hourlyRate: parseInt(document.getElementById('hourlyRate').value),
            weekendRate: parseInt(document.getElementById('weekendRate').value)
        },
        amenities: selectedAmenities,
        paymentMethod: paymentMethod,
        operatingHours: {
            monday: { open: '06:00', close: '22:00', isOpen: true },
            tuesday: { open: '06:00', close: '22:00', isOpen: true },
            wednesday: { open: '06:00', close: '22:00', isOpen: true },
            thursday: { open: '06:00', close: '22:00', isOpen: true },
            friday: { open: '06:00', close: '22:00', isOpen: true },
            saturday: { open: '06:00', close: '22:00', isOpen: true },
            sunday: { open: '06:00', close: '22:00', isOpen: true }
        }
    };

    // Add UPI QR code if tier-based
    if (paymentMethod === 'tier') {
        if (upiQrBase64) {
            turfData.upiQrCodeUrl = upiQrBase64; // Use base64 data
        } else if (upiQrCodeUrl) {
            turfData.upiQrCodeUrl = upiQrCodeUrl; // Use URL
        }
    }

    // Handle turf image upload
    const imageUrl = document.getElementById('turfImageUrl').value;
    const imageFile = document.getElementById('turfImageFile').files[0];
    
    if (imageFile) {
        try {
            showToast('Processing turf image...', 'info');
            const imageBase64 = await fileToBase64(imageFile);
            turfData.images = [{ url: imageBase64, isPrimary: true }];
        } catch (error) {
            showToast('Failed to process image: ' + error.message, 'error');
            return;
        }
    } else if (imageUrl) {
        turfData.images = [{ url: imageUrl, isPrimary: true }];
    }

    try {
        if (selectedTurfId) {
            await api.updateTurf(selectedTurfId, turfData);
            showToast('Turf updated successfully', 'success');
        } else {
            await api.createTurf(turfData);
            showToast('Turf created successfully! Pending admin approval.', 'success');
        }

        closeTurfModal();
        loadMyTurfs();
    } catch (error) {
        console.error('Error saving turf:', error);
        showToast(error.message || 'Failed to save turf', 'error');
    }
}

function closeTurfModal() {
    document.getElementById('turfModal').classList.remove('active');
    document.getElementById('turfForm').reset();
    // Uncheck all sports and amenities
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    selectedTurfId = null;
    selectedLocation = null;
    marker = null;
    document.getElementById('selectedCoordinates').textContent = 'Click on map to select location';
}

// Load subscription status
async function loadSubscription() {
    try {
        const response = await api.getMySubscription();
        const subscriptionInfo = document.getElementById('subscriptionInfo');
        
        if (!response.data || !response.data.subscription) {
            subscriptionInfo.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <i class="fas fa-crown fa-3x" style="color: var(--primary); margin-bottom: 1rem;"></i>
                    <h3>No Active Subscription</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Subscribe to a tier plan to list your turfs without paying commission on bookings
                    </p>
                    <a href="subscription.html" class="btn btn-primary">
                        <i class="fas fa-rocket"></i> View Plans
                    </a>
                </div>
            `;
            return;
        }
        
        const { subscription, currentTurfCount, canAddMoreTurfs } = response.data;
        const statusClass = subscription.status === 'active' ? 'success' : 
                           subscription.status === 'pending' ? 'warning' : 'danger';
        const statusColor = subscription.status === 'active' ? '#10b981' : 
                           subscription.status === 'pending' ? '#f59e0b' : '#ef4444';
        
        subscriptionInfo.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">
                            ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                        </h3>
                        <span style="display: inline-block; padding: 0.25rem 0.75rem; background: ${statusColor}; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">
                            ${subscription.status.toUpperCase()}
                        </span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">
                            ${formatCurrency(subscription.price)}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            per ${subscription.billingCycle}
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="padding: 1rem; background: var(--light-bg, #f3f4f6); border-radius: 8px;">
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">Turfs Listed</div>
                        <div style="font-size: 1.25rem; font-weight: bold;">${currentTurfCount} / ${subscription.maxTurfs === -1 ? '∞' : subscription.maxTurfs}</div>
                    </div>
                    ${subscription.startDate ? `
                    <div style="padding: 1rem; background: var(--light-bg, #f3f4f6); border-radius: 8px;">
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">Started</div>
                        <div style="font-size: 1rem; font-weight: bold;">${new Date(subscription.startDate).toLocaleDateString()}</div>
                    </div>
                    ` : ''}
                    ${subscription.endDate ? `
                    <div style="padding: 1rem; background: var(--light-bg, #f3f4f6); border-radius: 8px;">
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">Expires</div>
                        <div style="font-size: 1rem; font-weight: bold;">${new Date(subscription.endDate).toLocaleDateString()}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div style="padding: 1rem; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <strong>No Commission:</strong> Users pay directly to you via UPI. Zero platform fees!
                </div>
                
                ${!canAddMoreTurfs ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
                    You've reached the maximum turfs for your plan. Upgrade to add more!
                </div>
                ` : ''}
                
                ${subscription.status === 'pending' ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <i class="fas fa-clock" style="color: #f59e0b;"></i>
                    Your subscription is awaiting admin verification
                </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Error loading subscription:', error);
    }
}

// Load pending verifications
async function loadPendingVerifications() {
    const loader = document.getElementById('verificationsLoader');
    const list = document.getElementById('verificationsList');
    const badge = document.getElementById('pendingCount');
    
    try {
        loader.style.display = 'block';
        const response = await api.getPendingTierVerifications();
        loader.style.display = 'none';
        
        if (!response.data || response.data.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-check-circle fa-3x" style="margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No pending payment verifications</p>
                </div>
            `;
            badge.style.display = 'none';
            return;
        }
        
        badge.textContent = response.data.length;
        badge.style.display = 'inline-block';
        
        list.innerHTML = response.data.map(booking => `
            <div class="verification-card" style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin-bottom: 0.5rem;">${booking.turf.name}</h4>
                        <p style="color: var(--text-secondary); margin-bottom: 0.25rem;">
                            <i class="fas fa-user"></i> ${booking.user.name}
                        </p>
                        <p style="color: var(--text-secondary); margin-bottom: 0.25rem;">
                            <i class="fas fa-phone"></i> ${booking.user.phone}
                        </p>
                        <p style="color: var(--text-secondary);">
                            <i class="fas fa-calendar"></i> ${new Date(booking.bookingDate).toLocaleDateString()} | 
                            <i class="fas fa-clock"></i> ${formatTimeSlot(booking.timeSlots[0].startTime, booking.timeSlots[booking.timeSlots.length - 1].endTime)}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">
                            ${formatCurrency(booking.pricing.totalAmount)}
                        </div>
                        <small style="color: var(--text-secondary);">Total Amount</small>
                    </div>
                </div>
                
                ${booking.tierPayment && booking.tierPayment.screenshot ? `
                    <div style="margin: 1rem 0;">
                        <strong style="display: block; margin-bottom: 0.5rem;">Payment Screenshot:</strong>
                        <img src="${booking.tierPayment.screenshot.url}" 
                             alt="Payment Screenshot" 
                             style="max-width: 100%; max-height: 300px; border-radius: 8px; cursor: pointer;"
                             onclick="window.open('${booking.tierPayment.screenshot.url}', '_blank')">
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.5rem;">
                            <i class="fas fa-clock"></i> Uploaded ${new Date(booking.tierPayment.uploadedAt).toLocaleString()}
                        </p>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="verifyPayment('${booking._id}', true)" style="flex: 1;">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-outline" onclick="verifyPayment('${booking._id}', false)" style="flex: 1; color: #ef4444; border-color: #ef4444;">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        loader.style.display = 'none';
        showToast('Failed to load pending verifications', 'error');
        console.error('Error loading verifications:', error);
    }
}

// Verify tier payment
window.verifyPayment = async function(bookingId, approved) {
    let reason = '';
    
    if (!approved) {
        reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
    }
    
    if (!confirm(`Are you sure you want to ${approved ? 'approve' : 'reject'} this payment?`)) {
        return;
    }
    
    try {
        await api.verifyTierPayment(bookingId, approved, reason);
        showToast(approved ? 'Payment approved successfully' : 'Payment rejected', approved ? 'success' : 'info');
        loadPendingVerifications();
        loadOwnerBookings(); // Refresh bookings list
    } catch (error) {
        showToast(error.message || 'Failed to verify payment', 'error');
    }
};

// Check subscription status for tier-based payment
async function checkSubscriptionForTier() {
    try {
        const response = await api.getMySubscription();
        const tierMethod = document.getElementById('tierMethod');
        const warning = document.getElementById('subscriptionWarning');
        const warningText = document.getElementById('subscriptionWarningText');
        
        if (!response.data || !response.data.subscription) {
            tierMethod.disabled = true;
            warning.style.display = 'block';
            warningText.innerHTML = '<strong>No subscription found.</strong> <a href="subscription.html" style="color: var(--primary); text-decoration: underline;">Subscribe now</a> to use tier-based payment.';
            return false;
        }
        
        const { subscription, canAddMoreTurfs } = response.data;
        
        if (subscription.status !== 'active') {
            tierMethod.disabled = true;
            warning.style.display = 'block';
            warningText.innerHTML = `<strong>Subscription ${subscription.status}.</strong> Please wait for admin approval or <a href="subscription.html" style="color: var(--primary); text-decoration: underline;">check status</a>.`;
            return false;
        }
        
        if (!canAddMoreTurfs) {
            tierMethod.disabled = true;
            warning.style.display = 'block';
            warningText.innerHTML = `<strong>Turf limit reached.</strong> <a href="subscription.html" style="color: var(--primary); text-decoration: underline;">Upgrade your plan</a> to add more turfs.`;
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to initialize
    await authManager.init();
    
    const hasAccess = await authManager.requireAuth('owner');
    if (!hasAccess) return;

    loadOwnerData();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');

            if (tabName === 'bookings') {
                loadOwnerBookings();
            } else if (tabName === 'analytics') {
                loadAnalytics();
            } else if (tabName === 'verifications') {
                loadPendingVerifications();
            } else if (tabName === 'subscription') {
                loadSubscription();
            }
        });
    });

    // Add turf button
    document.getElementById('addTurfBtn').addEventListener('click', async () => {
        selectedTurfId = null;
        selectedLocation = null;
        document.getElementById('turfModalTitle').textContent = 'Add New Turf';
        document.getElementById('turfForm').reset();
        document.getElementById('selectedCoordinates').textContent = 'Click on map to select location';
        document.getElementById('turfModal').classList.add('active');
        
        // Check subscription status
        await checkSubscriptionForTier();
        
        // Initialize map after modal is visible
        setTimeout(() => {
            initMap();
        }, 100);
    });

    // Payment method change listeners
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const upiSection = document.getElementById('upiQrSection');
            const warning = document.getElementById('subscriptionWarning');
            
            if (e.target.value === 'tier') {
                upiSection.style.display = 'block';
                checkSubscriptionForTier();
            } else {
                upiSection.style.display = 'none';
                warning.style.display = 'none';
            }
        });
    });

    // Image file preview
    document.getElementById('turfImageFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be less than 5MB', 'error');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('previewImg').src = e.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            // Clear URL input if file is selected
            document.getElementById('turfImageUrl').value = '';
        }
    });

    // UPI QR file preview
    document.getElementById('upiQrCodeFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('QR code image must be less than 5MB', 'error');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('previewQr').src = e.target.result;
                document.getElementById('qrPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            // Clear URL input if file is selected
            document.getElementById('upiQrCodeUrl').value = '';
        }
    });

    // Clear file preview when URL is entered
    document.getElementById('turfImageUrl').addEventListener('input', function() {
        if (this.value) {
            document.getElementById('turfImageFile').value = '';
            document.getElementById('imagePreview').style.display = 'none';
        }
    });

    document.getElementById('upiQrCodeUrl').addEventListener('input', function() {
        if (this.value) {
            document.getElementById('upiQrCodeFile').value = '';
            document.getElementById('qrPreview').style.display = 'none';
        }
    });

    // Turf form
    document.getElementById('turfForm').addEventListener('submit', handleTurfSubmit);
    document.getElementById('cancelTurfBtn').addEventListener('click', closeTurfModal);
    document.getElementById('closeTurfModal').addEventListener('click', closeTurfModal);
    
    // Get location button
    document.getElementById('getLocationBtn').addEventListener('click', getUserLocation);

    // Filters
    document.getElementById('turfFilter').addEventListener('change', loadOwnerBookings);
    document.getElementById('statusFilter').addEventListener('change', loadOwnerBookings);
    document.getElementById('analyticsPeriod').addEventListener('change', loadAnalytics);
});
