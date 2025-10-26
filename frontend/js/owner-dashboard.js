import api, { formatCurrency, formatDateTime, formatTimeSlot, showToast } from './api.js';
import authManager from './auth.js';

let currentTab = 'turfs';
let myTurfs = [];
let selectedTurfId = null;
let map = null;
let marker = null;
let selectedLocation = null;

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

    const imageUrl = document.getElementById('turfImageUrl').value;
    if (imageUrl) {
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
            }
        });
    });

    // Add turf button
    document.getElementById('addTurfBtn').addEventListener('click', () => {
        selectedTurfId = null;
        selectedLocation = null;
        document.getElementById('turfModalTitle').textContent = 'Add New Turf';
        document.getElementById('turfForm').reset();
        document.getElementById('selectedCoordinates').textContent = 'Click on map to select location';
        document.getElementById('turfModal').classList.add('active');
        
        // Initialize map after modal is visible
        setTimeout(() => {
            initMap();
        }, 100);
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
