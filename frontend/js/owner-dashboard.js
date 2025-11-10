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
        loadOwnerStats()
    ]);
}

// Load and update top stats cards
async function loadOwnerStats() {
    try {
        // Get owner analytics for overall stats
        const response = await api.getOwnerAnalytics({ period: 365 }); // Last year data
        const analytics = response.data;
        const overview = analytics.overview || {};

        // Update top stats cards
        document.getElementById('totalTurfs').textContent = myTurfs.length || 0;
        document.getElementById('totalBookings').textContent = overview.totalBookings || 0;
        document.getElementById('totalRevenue').textContent = formatCurrency(overview.totalRevenue || 0);
        document.getElementById('ownerEarnings').textContent = formatCurrency(overview.ownerEarnings || 0);
        document.getElementById('platformFee').textContent = formatCurrency(overview.platformFees || 0);
    } catch (error) {
        console.error('Error loading owner stats:', error);
        // Set default values
        document.getElementById('totalTurfs').textContent = myTurfs.length || 0;
        document.getElementById('totalBookings').textContent = '0';
        document.getElementById('totalRevenue').textContent = '₹0';
        document.getElementById('ownerEarnings').textContent = '₹0';
        document.getElementById('platformFee').textContent = '₹0';
    }
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
let analyticsCharts = {
    earningsLine: null,
    customersBar: null,
    revenueDonut: null
};

async function loadAnalytics() {
    try {
        const period = document.getElementById('analyticsPeriod')?.value || '30';
        const turfId = document.getElementById('analyticsTurf')?.value || '';
        
        const params = { period: parseInt(period) };
        if (turfId) params.turfId = turfId;
        
        console.log('Loading analytics with params:', params);
        
        const response = await api.getOwnerAnalytics(params);
        const analytics = response.data;
        
        console.log('Analytics data received:', analytics);

        // Update Key Metrics Cards
        updateMetricsCards(analytics);
        
        // Generate Charts
        generateEarningsLineChart(analytics);
        generateCustomersBarChart(analytics);
        generateRevenueDonutChart(analytics);
        
        // Populate Insights Table
        populateInsightsTable(analytics);
        
        showToast('Analytics updated successfully', 'success');
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Failed to load analytics: ' + (error.message || 'Unknown error'), 'error');
    }
}

// Update Metrics Cards with Animation
function updateMetricsCards(analytics) {
    const overview = analytics.overview || {};
    
    // Monthly Earnings
    const monthlyEarnings = overview.ownerEarnings || 0;
    const monthlyGrowth = calculateGrowth(monthlyEarnings, overview.previousMonthEarnings || 0);
    
    animateValue('monthlyEarnings', 0, monthlyEarnings, 1500, true);
    updateGrowthIndicator('monthlyGrowth', monthlyGrowth);
    
    // Unique Customers
    const uniqueCustomers = overview.uniqueCustomers || 0;
    animateValue('uniqueCustomers', 0, uniqueCustomers, 1500);
    
    // Avg Bookings per Turf
    const avgBookings = myTurfs.length > 0 
        ? Math.round(overview.totalBookings / myTurfs.length) 
        : 0;
    animateValue('avgBookings', 0, avgBookings, 1500);
    
    // Set bar width for visual indicator
    const barWidth = Math.min((avgBookings / 50) * 100, 100); // Max 50 bookings = 100%
    document.documentElement.style.setProperty('--bar-width', `${barWidth}%`);
    
    // Yearly Revenue
    const yearlyRevenue = overview.yearlyRevenue || 0;
    const yearlyGrowth = calculateGrowth(yearlyRevenue, overview.previousYearRevenue || 0);
    
    animateValue('yearlyRevenue', 0, yearlyRevenue, 1500, true);
    updateGrowthIndicator('yearlyGrowth', yearlyGrowth);
}

// Animate number counter
function animateValue(id, start, end, duration, isCurrency = false) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = isCurrency 
            ? formatCurrency(Math.round(current))
            : Math.round(current);
    }, 16);
}

// Update growth indicator
function updateGrowthIndicator(id, growth) {
    const element = document.getElementById(id);
    if (!element) return;
    
    element.className = 'metric-growth';
    
    if (growth > 0) {
        element.classList.add('positive');
        element.innerHTML = `<span class="growth-indicator">+${growth}%</span>`;
    } else if (growth < 0) {
        element.classList.add('negative');
        element.innerHTML = `<span class="growth-indicator">${growth}%</span>`;
    } else {
        element.innerHTML = `<span class="growth-indicator" style="color: var(--text-secondary);">0%</span>`;
    }
}

// Calculate growth percentage
function calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

// Generate Monthly Earnings Line Chart
function generateEarningsLineChart(analytics) {
    const ctx = document.getElementById('earningsLineChart');
    if (!ctx) {
        console.error('earningsLineChart canvas not found');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }
    
    // Destroy existing chart
    if (analyticsCharts.earningsLine) {
        analyticsCharts.earningsLine.destroy();
    }
    
    // Generate monthly data for the year
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = analytics.monthlyEarnings || [];
    
    console.log('Monthly earnings data:', monthlyData);
    
    // Fill missing months with 0
    const earnings = months.map((month, index) => {
        const data = monthlyData.find(m => m.month === index + 1);
        return data ? data.earnings : 0;
    });
    
    console.log('Processed earnings array:', earnings);
    
    analyticsCharts.earningsLine = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Earnings (₹)',
                data: earnings,
                borderColor: '#2CC997',
                backgroundColor: 'rgba(44, 201, 151, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#2CC997',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#2CC997',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Earnings: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 1000) + 'k';
                        },
                        color: '#6B7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#6B7280'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Generate Customer Growth Bar Chart
function generateCustomersBarChart(analytics) {
    const ctx = document.getElementById('customersBarChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (analyticsCharts.customersBar) {
        analyticsCharts.customersBar.destroy();
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const customerData = analytics.monthlyCustomers || [];
    
    // Fill missing months with 0
    const customers = months.map((month, index) => {
        const data = customerData.find(m => m.month === index + 1);
        return data ? data.count : 0;
    });
    
    analyticsCharts.customersBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'New Customers',
                data: customers,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                    gradient.addColorStop(0, '#27AE60');
                    gradient.addColorStop(1, '#2CC997');
                    return gradient;
                },
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    borderColor: '#2CC997',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' new customers';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5,
                        color: '#6B7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#6B7280'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutBounce'
            }
        }
    });
}

// Generate Revenue Distribution Donut Chart
function generateRevenueDonutChart(analytics) {
    const ctx = document.getElementById('revenueDonutChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (analyticsCharts.revenueDonut) {
        analyticsCharts.revenueDonut.destroy();
    }
    
    const turfPerformance = analytics.turfPerformance || [];
    
    if (turfPerformance.length === 0) {
        // Show "No Data" message
        const totalElement = document.getElementById('donutTotalValue');
        if (totalElement) totalElement.textContent = '₹0';
        return;
    }
    
    const labels = turfPerformance.map(t => t.name || 'Unknown');
    const data = turfPerformance.map(t => t.earnings || 0);
    const totalRevenue = data.reduce((a, b) => a + b, 0);
    
    // Update center text
    const totalElement = document.getElementById('donutTotalValue');
    if (totalElement) totalElement.textContent = formatCurrency(totalRevenue);
    
    // Generate color palette (shades of green and blue)
    const colors = [
        '#2CC997', '#27AE60', '#16A085', '#1ABC9C', '#48C9B0',
        '#3498DB', '#5DADE2', '#85C1E9', '#AED6F1', '#D6EAF8'
    ];
    
    analyticsCharts.revenueDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        color: '#1A2E22',
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    borderColor: '#2CC997',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = ((context.parsed / totalRevenue) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500
            }
        }
    });
}

// Populate Turf-wise Insights Table
function populateInsightsTable(analytics) {
    const tbody = document.getElementById('insightsTableBody');
    if (!tbody) return;
    
    const turfPerformance = analytics.turfPerformance || [];
    
    if (turfPerformance.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-loading">
                    No turf data available
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = turfPerformance.map((turf, index) => {
        const sportIcon = '🏟️'; // Default icon since we don't have sport info
        const trendClass = 'table-trend-up'; // Default to up
        const trendIcon = '📈';
        const trend = index === 0 ? 15 : 5; // Mock trend data
        
        return `
            <tr>
                <td>
                    <div class="turf-name-cell">
                        <span class="turf-sport-badge">${sportIcon}</span>
                        <strong>${turf.name || 'Unknown Turf'}</strong>
                    </div>
                </td>
                <td><strong>${turf.totalBookings || 0}</strong></td>
                <td>${Math.round(turf.monthlyAvg || 0)}</td>
                <td class="table-earnings">${formatCurrency(turf.earnings || 0)}</td>
                <td>${turf.uniqueCustomers || 0}</td>
                <td class="${trendClass}">
                    <span>${trendIcon} +${trend}%</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Get sport icon emoji
function getSportIcon(sport) {
    const icons = {
        'cricket': '🏏',
        'football': '⚽',
        'badminton': '🏸',
        'tennis': '🎾',
        'basketball': '🏀',
        'volleyball': '🏐',
        'hockey': '🏑'
    };
    return icons[sport?.toLowerCase()] || '🏟️';
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
                    <a href="owner-subscription.html" class="btn btn-primary">
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
            <div class="verification-card" onclick="openVerificationDetail('${booking._id}')" style="cursor: pointer;">
                <div class="verification-header">
                    <div class="verification-turf-info">
                        <div class="turf-name-badge">
                            <span class="icon-badge">🏟️</span>
                            <h3>${booking.turf.name}</h3>
                        </div>
                        <div class="verification-amount">
                            ${formatCurrency(booking.pricing.totalAmount)}
                        </div>
                    </div>
                </div>
                
                <div class="verification-details-grid">
                    <div class="detail-item">
                        <span class="detail-icon">👤</span>
                        <div class="detail-content">
                            <span class="detail-label">Customer</span>
                            <span class="detail-value">${booking.user.name}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-icon">📧</span>
                        <div class="detail-content">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${booking.user.email || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-icon">📞</span>
                        <div class="detail-content">
                            <span class="detail-label">Phone</span>
                            <span class="detail-value">${booking.user.phone}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <div class="detail-content">
                            <span class="detail-label">Booking Date</span>
                            <span class="detail-value">${new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-icon">⏰</span>
                        <div class="detail-content">
                            <span class="detail-label">Time Slot</span>
                            <span class="detail-value">${formatTimeSlot(booking.timeSlots[0].startTime, booking.timeSlots[booking.timeSlots.length - 1].endTime)}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-icon">🏆</span>
                        <div class="detail-content">
                            <span class="detail-label">Sport</span>
                            <span class="detail-value">${booking.turf.sport}</span>
                        </div>
                    </div>
                </div>
                
                ${booking.tierPayment && booking.tierPayment.screenshot ? `
                    <div class="payment-screenshot-section">
                        <div class="screenshot-label">
                            <span class="detail-icon">💳</span>
                            <span>Payment Screenshot</span>
                        </div>
                        <div class="screenshot-preview">
                            <img src="${booking.tierPayment.screenshot.url}" alt="Payment Screenshot">
                            <div class="screenshot-overlay">
                                <i class="fas fa-expand"></i>
                                <span>Click to view details</span>
                            </div>
                        </div>
                        <p class="upload-time">
                            <i class="fas fa-clock"></i> 
                            Uploaded ${new Date(booking.tierPayment.uploadedAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                ` : ''}
                
                <div class="verification-quick-preview">
                    <small style="color: var(--text-secondary); font-size: 0.875rem;">
                        <i class="fas fa-hand-pointer"></i> Click to view full details and take action
                    </small>
                </div>
            </div>
        `).join('');
        
        // Store verifications data for detail view
        window.verificationsData = response.data;
    } catch (error) {
        loader.style.display = 'none';
        showToast('Failed to load pending verifications', 'error');
        console.error('Error loading verifications:', error);
    }
}

// Load pending refund requests
async function loadPendingRefunds() {
    const loader = document.getElementById('refundsLoader');
    const list = document.getElementById('refundsList');
    const badge = document.getElementById('refundsCount');
    
    try {
        loader.style.display = 'block';
        const response = await api.getOwnerPendingRefunds();
        loader.style.display = 'none';
        
        if (!response.data || response.data.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-check-circle fa-3x" style="margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No pending refund requests</p>
                </div>
            `;
            badge.style.display = 'none';
            return;
        }
        
        badge.textContent = response.data.length;
        badge.style.display = 'inline-block';
        
        list.innerHTML = response.data.map(booking => {
            // Determine refund percentage based on payment method
            const isTierBased = booking.turf.paymentMethod === 'tier';
            const refundPercentage = isTierBased ? 100 : 90;
            const refundLabel = isTierBased ? 'Full Refund' : 'Refund Amount (90%)';
            
            return `
            <div class="refund-card" onclick="openRefundDetail('${booking._id}')" style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #FFC107;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">
                            <i class="fas fa-building" style="color: var(--primary);"></i> ${booking.turf.name}
                        </h4>
                        <div style="display: grid; gap: 0.5rem; margin-top: 0.75rem;">
                            <p style="color: var(--text-secondary); margin: 0;">
                                <i class="fas fa-user"></i> <strong>User:</strong> ${booking.user.name}
                            </p>
                            <p style="color: var(--text-secondary); margin: 0;">
                                <i class="fas fa-calendar"></i> <strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p style="color: var(--text-secondary); margin: 0;">
                                <i class="fas fa-clock"></i> <strong>Time:</strong> ${formatTimeSlot(booking.timeSlots[0].startTime, booking.timeSlots[booking.timeSlots.length - 1].endTime)}
                            </p>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.75rem; font-weight: bold; color: #FFC107; margin-bottom: 0.25rem;">
                            ${formatCurrency(booking.refundRequest.refundAmount)}
                        </div>
                        <small style="color: var(--text-secondary); font-weight: 600;">${refundLabel}</small>
                        ${isTierBased ? `
                        <p style="color: #10b981; font-size: 0.8rem; margin-top: 0.25rem; font-weight: 600;">
                            <i class="fas fa-crown"></i> Subscription Plan
                        </p>
                        ` : ''}
                    </div>
                </div>
                
                ${booking.refundRequest.reason ? `
                    <div style="background: #FFF8E1; padding: 0.75rem; border-radius: 8px; margin: 0.75rem 0; border-left: 3px solid #FFC107;">
                        <p style="color: #8B6914; margin: 0; font-size: 0.9rem; line-height: 1.5;">
                            <i class="fas fa-comment-alt" style="margin-right: 6px;"></i>
                            <strong>Reason:</strong> ${booking.refundRequest.reason}
                        </p>
                    </div>
                ` : ''}
                
                ${booking.refundRequest.qrImage && booking.refundRequest.qrImage.url ? `
                    <div style="margin: 0.75rem 0; text-align: center;">
                        <small style="color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">
                            <i class="fas fa-qrcode"></i> QR Code attached
                        </small>
                    </div>
                ` : ''}
                
                <div class="refund-quick-hint">
                    <small>
                        <i class="fas fa-hand-pointer"></i> Click to view details and process refund
                    </small>
                </div>
            </div>
        `;
        }).join('');
        
        // Store refunds data for detail view
        window.refundsData = response.data;
    } catch (error) {
        loader.style.display = 'none';
        showToast('Failed to load pending refunds', 'error');
        console.error('Error loading refunds:', error);
    }
}

// Process refund decision
window.processRefund = async function(bookingId, approved) {
    let verificationNote = '';
    
    if (!approved) {
        verificationNote = prompt('Please provide a reason for rejection:');
        if (!verificationNote || !verificationNote.trim()) {
            showToast('Rejection reason is required', 'error');
            return;
        }
    } else {
        const confirmed = confirm('Are you sure you want to confirm this refund? The user will be notified.');
        if (!confirmed) return;
    }
    
    try {
        await api.processRefundDecision(bookingId, approved, verificationNote);
        showToast(approved ? 'Refund confirmed successfully!' : 'Refund request rejected', approved ? 'success' : 'info');
        loadPendingRefunds();
        loadOwnerBookings(); // Refresh bookings list
    } catch (error) {
        showToast(error.message || 'Failed to process refund', 'error');
    }
};

// Verify tier payment
window.verifyPayment = async function(bookingId, approved, reason = '') {
    // If called from new modal, skip prompts (reason already provided)
    if (!reason && !approved) {
        reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
    }
    
    // Skip confirmation if called from new modal (already has explicit approve/reject buttons)
    const isFromModal = currentVerificationId === bookingId;
    if (!isFromModal) {
        if (!confirm(`Are you sure you want to ${approved ? 'approve' : 'reject'} this payment?`)) {
            return;
        }
    }
    
    try {
        await api.verifyTierPayment(bookingId, approved, reason);
        
        // Only show toast if not from modal (modal has its own success toast)
        if (!isFromModal) {
            showToast(approved ? 'Payment approved successfully' : 'Payment rejected', approved ? 'success' : 'info');
        }
        
        loadPendingVerifications();
        loadOwnerBookings(); // Refresh bookings list
    } catch (error) {
        throw error; // Re-throw for modal to handle
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
            warningText.innerHTML = '<strong>No subscription found.</strong> <a href="owner-subscription.html" style="color: var(--primary); text-decoration: underline;">Subscribe now</a> to use tier-based payment.';
            return false;
        }
        
        const { subscription, canAddMoreTurfs } = response.data;
        
        if (subscription.status !== 'active') {
            tierMethod.disabled = true;
            warning.style.display = 'block';
            warningText.innerHTML = `<strong>Subscription ${subscription.status}.</strong> Please wait for admin approval or <a href="owner-subscription.html" style="color: var(--primary); text-decoration: underline;">check status</a>.`;
            return false;
        }
        
        if (!canAddMoreTurfs) {
            tierMethod.disabled = true;
            warning.style.display = 'block';
            warningText.innerHTML = `<strong>Turf limit reached.</strong> <a href="owner-subscription.html" style="color: var(--primary); text-decoration: underline;">Upgrade your plan</a> to add more turfs.`;
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
            } else if (tabName === 'refunds') {
                loadPendingRefunds();
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
    document.getElementById('analyticsTurf').addEventListener('change', loadAnalytics);
    
    // Image Preview Modal
    const modal = document.getElementById('imagePreviewModal');
    const closeModalBtn = document.getElementById('closeImageModal');
    
    // Close modal when clicking the close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeImageModal);
    }
    
    // Close modal when clicking outside the image
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
            closeVerificationDetailModal();
            closeRejectionModal();
            closeRefundDetailModal();
        }
    });
    
    // Verification Detail Modal
    const verificationDetailModal = document.getElementById('verificationDetailModal');
    const closeVerificationDetailBtn = document.getElementById('closeVerificationDetail');
    
    if (closeVerificationDetailBtn) {
        closeVerificationDetailBtn.addEventListener('click', closeVerificationDetailModal);
    }
    
    if (verificationDetailModal) {
        verificationDetailModal.addEventListener('click', function(e) {
            if (e.target === verificationDetailModal) {
                closeVerificationDetailModal();
            }
        });
    }
    
    // View Full Image button in detail modal
    const viewFullImageBtn = document.getElementById('viewFullImageBtn');
    if (viewFullImageBtn) {
        viewFullImageBtn.addEventListener('click', function() {
            const imageUrl = document.getElementById('proofThumbnail').src;
            const bookingInfo = {
                turfName: document.getElementById('detailTurfName').textContent,
                amount: document.getElementById('detailAmount').textContent,
                date: document.getElementById('detailDate').textContent
            };
            openImageModal(imageUrl, bookingInfo);
        });
    }
    
    // Rejection Modal
    const cancelRejectionBtn = document.getElementById('cancelRejectionBtn');
    if (cancelRejectionBtn) {
        cancelRejectionBtn.addEventListener('click', closeRejectionModal);
    }
    
    // Refund Detail Modal
    const refundDetailModal = document.getElementById('refundDetailModal');
    const closeRefundDetailBtn = document.getElementById('closeRefundDetail');
    
    if (closeRefundDetailBtn) {
        closeRefundDetailBtn.addEventListener('click', closeRefundDetailModal);
    }
    
    if (refundDetailModal) {
        refundDetailModal.addEventListener('click', function(e) {
            if (e.target === refundDetailModal) {
                closeRefundDetailModal();
            }
        });
    }
    
    // View Full QR button in refund modal
    const viewFullQrBtn = document.getElementById('viewFullQrBtn');
    if (viewFullQrBtn) {
        viewFullQrBtn.addEventListener('click', function() {
            const qrUrl = document.getElementById('refundQrThumbnail').src;
            window.open(qrUrl, '_blank');
        });
    }
});

// Image Modal Functions
function openImageModal(imageUrl, bookingInfo) {
    const modal = document.getElementById('imagePreviewModal');
    const modalImage = document.getElementById('modalImage');
    const modalBookingInfo = document.getElementById('modalBookingInfo');
    
    if (modal && modalImage) {
        modalImage.src = imageUrl;
        
        if (modalBookingInfo && bookingInfo) {
            modalBookingInfo.innerHTML = `
                <p><strong>Turf:</strong> ${bookingInfo.turfName}</p>
                <p><strong>Amount:</strong> ${bookingInfo.amount}</p>
                <p><strong>Date:</strong> ${bookingInfo.date}</p>
            `;
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function closeImageModal() {
    const modal = document.getElementById('imagePreviewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Make functions global
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

// Verification Detail Modal Functions
let currentVerificationId = null;

function openVerificationDetail(bookingId) {
    if (!window.verificationsData) {
        showToast('Verification data not available', 'error');
        return;
    }
    
    const booking = window.verificationsData.find(b => b._id === bookingId);
    if (!booking) {
        showToast('Booking not found', 'error');
        return;
    }
    
    currentVerificationId = bookingId;
    
    // Populate modal with booking data
    document.getElementById('detailTurfName').textContent = booking.turf.name;
    document.getElementById('detailAmount').textContent = formatCurrency(booking.pricing.totalAmount);
    document.getElementById('detailUserName').textContent = booking.user.name;
    document.getElementById('detailSport').textContent = booking.turf.sport;
    document.getElementById('detailEmail').textContent = booking.user.email || 'N/A';
    document.getElementById('detailAmountText').textContent = formatCurrency(booking.pricing.totalAmount);
    document.getElementById('detailPhone').textContent = booking.user.phone;
    document.getElementById('detailDate').textContent = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    document.getElementById('detailTimeSlot').textContent = formatTimeSlot(
        booking.timeSlots[0].startTime,
        booking.timeSlots[booking.timeSlots.length - 1].endTime
    );
    
    // Handle payment proof
    const paymentProofSection = document.getElementById('paymentProofSection');
    const proofThumbnail = document.getElementById('proofThumbnail');
    
    if (booking.tierPayment && booking.tierPayment.screenshot) {
        proofThumbnail.src = booking.tierPayment.screenshot.url;
        paymentProofSection.style.display = 'block';
    } else {
        paymentProofSection.style.display = 'none';
    }
    
    // Setup action buttons
    const approveBtn = document.getElementById('approvePaymentBtn');
    const rejectBtn = document.getElementById('rejectPaymentBtn');
    
    approveBtn.onclick = () => handleVerificationAction(bookingId, true);
    rejectBtn.onclick = () => openRejectionModal(bookingId);
    
    // Show modal
    const modal = document.getElementById('verificationDetailModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVerificationDetailModal() {
    const modal = document.getElementById('verificationDetailModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        currentVerificationId = null;
    }
}

function openRejectionModal(bookingId) {
    currentVerificationId = bookingId;
    const rejectionModal = document.getElementById('rejectionReasonModal');
    const rejectionReason = document.getElementById('rejectionReason');
    
    rejectionReason.value = '';
    rejectionModal.style.display = 'flex';
    
    // Setup confirm button
    const confirmBtn = document.getElementById('confirmRejectionBtn');
    confirmBtn.onclick = () => {
        const reason = rejectionReason.value.trim();
        if (!reason) {
            showToast('Please provide a rejection reason', 'error');
            return;
        }
        closeRejectionModal();
        handleVerificationAction(bookingId, false, reason);
    };
}

function closeRejectionModal() {
    const rejectionModal = document.getElementById('rejectionReasonModal');
    if (rejectionModal) {
        rejectionModal.style.display = 'none';
    }
}

async function handleVerificationAction(bookingId, isApproved, reason = '') {
    const approveBtn = document.getElementById('approvePaymentBtn');
    const rejectBtn = document.getElementById('rejectPaymentBtn');
    
    // Disable buttons to prevent double-click
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;
    
    try {
        await verifyPayment(bookingId, isApproved, reason);
        
        // Show success toast
        showSuccessToast(isApproved ? '✅ Payment approved successfully!' : '❌ Payment rejected');
        
        // Close detail modal
        closeVerificationDetailModal();
        
        // Reload verifications list
        await loadPendingVerifications();
    } catch (error) {
        console.error('Error handling verification:', error);
        showToast(error.message || 'Failed to process verification', 'error');
        
        // Re-enable buttons
        if (approveBtn) approveBtn.disabled = false;
        if (rejectBtn) rejectBtn.disabled = false;
    }
}

function showSuccessToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 1.25rem;"></i>
        <span style="font-weight: 600;">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 400);
    }, 3000);
}

// Make functions global
window.openVerificationDetail = openVerificationDetail;
window.closeVerificationDetailModal = closeVerificationDetailModal;
window.openRejectionModal = openRejectionModal;
window.closeRejectionModal = closeRejectionModal;

// Refund Detail Modal Functions
let currentRefundBookingId = null;

function openRefundDetail(bookingId) {
    if (!window.refundsData) {
        showToast('Refund data not available', 'error');
        return;
    }
    
    const booking = window.refundsData.find(b => b._id === bookingId);
    if (!booking) {
        showToast('Booking not found', 'error');
        return;
    }
    
    currentRefundBookingId = bookingId;
    
    // Determine refund details
    const isTierBased = booking.turf.paymentMethod === 'tier';
    const refundLabel = isTierBased ? 'Full Refund (100%)' : `Refund Amount (90%) | Total: ${formatCurrency(booking.pricing.totalAmount)}`;
    
    // Populate modal with booking data
    document.getElementById('refundTurfName').textContent = booking.turf.name;
    document.getElementById('refundAmount').textContent = formatCurrency(booking.refundRequest.refundAmount);
    document.getElementById('refundSublabel').textContent = refundLabel;
    document.getElementById('refundUserName').textContent = booking.user.name;
    document.getElementById('refundEmail').textContent = booking.user.email;
    document.getElementById('refundPhone').textContent = booking.user.phone;
    document.getElementById('refundBookingDate').textContent = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('refundTimeSlot').textContent = formatTimeSlot(
        booking.timeSlots[0].startTime,
        booking.timeSlots[booking.timeSlots.length - 1].endTime
    );
    document.getElementById('refundSport').textContent = booking.turf.sport || 'N/A';
    
    // Handle cancellation reason
    const reasonSection = document.getElementById('cancellationReasonSection');
    const reasonText = document.getElementById('cancellationReasonText');
    
    if (booking.refundRequest.reason) {
        reasonText.textContent = booking.refundRequest.reason;
        reasonSection.style.display = 'block';
    } else {
        reasonSection.style.display = 'none';
    }
    
    // Handle QR code
    const qrSection = document.getElementById('refundQrSection');
    const qrThumbnail = document.getElementById('refundQrThumbnail');
    const qrUploadTimeText = document.getElementById('qrUploadTimeText');
    
    if (booking.refundRequest.qrImage && booking.refundRequest.qrImage.url) {
        qrThumbnail.src = booking.refundRequest.qrImage.url;
        qrUploadTimeText.textContent = `Uploaded on ${new Date(booking.refundRequest.requestedAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        qrSection.style.display = 'block';
    } else {
        qrSection.style.display = 'none';
    }
    
    // Setup action buttons
    const confirmBtn = document.getElementById('confirmRefundBtn');
    const rejectBtn = document.getElementById('rejectRefundBtn');
    
    confirmBtn.onclick = () => handleRefundAction(bookingId, true);
    rejectBtn.onclick = () => handleRefundAction(bookingId, false);
    
    // Show modal
    const modal = document.getElementById('refundDetailModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeRefundDetailModal() {
    const modal = document.getElementById('refundDetailModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        currentRefundBookingId = null;
    }
}

async function handleRefundAction(bookingId, approved) {
    const confirmBtn = document.getElementById('confirmRefundBtn');
    const rejectBtn = document.getElementById('rejectRefundBtn');
    
    // Disable buttons to prevent double-click
    if (confirmBtn) confirmBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;
    
    const action = approved ? 'confirm' : 'reject';
    
    if (!confirm(`Are you sure you want to ${action} this refund request?`)) {
        // Re-enable buttons if cancelled
        if (confirmBtn) confirmBtn.disabled = false;
        if (rejectBtn) rejectBtn.disabled = false;
        return;
    }
    
    try {
        await processRefund(bookingId, approved);
        
        // Show success toast
        const message = approved 
            ? '✅ Refund confirmed successfully!' 
            : '❌ Refund request rejected';
        showSuccessToast(message);
        
        // Close detail modal
        closeRefundDetailModal();
        
        // Reload refunds list
        await loadPendingRefunds();
    } catch (error) {
        console.error('Error handling refund:', error);
        showToast(error.message || 'Failed to process refund', 'error');
        
        // Re-enable buttons
        if (confirmBtn) confirmBtn.disabled = false;
        if (rejectBtn) rejectBtn.disabled = false;
    }
}

// Make functions global
window.openRefundDetail = openRefundDetail;
window.closeRefundDetailModal = closeRefundDetailModal;

