// Dashboard JavaScript for TurfSpot Owner Dashboard
// Advanced analytics and interactive features

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    setupSidebar();
    setupCharts();
    setupFilters();
    setupModals();
    setupAnimations();
    loadDashboardData();
}

// Sidebar Navigation
function setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuItems = document.querySelectorAll('.menu-item a');
    
    // Toggle sidebar on mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Handle menu item clicks
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            document.querySelectorAll('.menu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            
            // Add active class to clicked item
            item.parentElement.classList.add('active');
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('open');
            }
        });
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// Show Section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update page title
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = getSectionTitle(sectionId);
        }
        
        // Load section-specific data
        loadSectionData(sectionId);
    }
}

// Get Section Title
function getSectionTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'turfs': 'My Turfs',
        'bookings': 'Bookings',
        'analytics': 'Analytics',
        'earnings': 'Earnings',
        'settings': 'Settings'
    };
    return titles[sectionId] || 'Dashboard';
}

// Setup Charts
function setupCharts() {
    // Initialize Chart.js with custom colors
    Chart.defaults.color = '#666666';
    Chart.defaults.font.family = 'Poppins, sans-serif';
    
    // Create booking trends chart
    createBookingChart();
    createRevenueChart();
    createAnalyticsCharts();
    createEarningsChart();
}

// Create Booking Chart
function createBookingChart() {
    const ctx = document.getElementById('bookingChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Bookings',
                data: [12, 19, 8, 15, 22, 18, 25],
                borderColor: '#14b8a6',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#14b8a6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

// Create Revenue Chart
function createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [2400, 3800, 1600, 3000, 4400, 3600, 5000],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create Analytics Charts
function createAnalyticsCharts() {
    // Booking Trends Chart
    const bookingCtx = document.getElementById('analyticsBookingChart');
    if (bookingCtx) {
        new Chart(bookingCtx, {
            type: 'doughnut',
            data: {
                labels: ['Football', 'Cricket', 'Basketball', 'Tennis'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: [
                        '#14b8a6',
                        '#10b981',
                        '#06b6d4',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Revenue Analysis Chart
    const revenueCtx = document.getElementById('analyticsRevenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 15000, 18000, 16000, 20000, 25000],
                    borderColor: '#14b8a6',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Time Slot Chart
    const timeSlotCtx = document.getElementById('timeSlotChart');
    if (timeSlotCtx) {
        new Chart(timeSlotCtx, {
            type: 'bar',
            data: {
                labels: ['6-8 AM', '8-10 AM', '10-12 PM', '12-2 PM', '2-4 PM', '4-6 PM', '6-8 PM', '8-10 PM'],
                datasets: [{
                    label: 'Bookings',
                    data: [2, 5, 8, 12, 15, 20, 18, 10],
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Rating Chart
    const ratingCtx = document.getElementById('ratingChart');
    if (ratingCtx) {
        new Chart(ratingCtx, {
            type: 'radar',
            data: {
                labels: ['Facility Quality', 'Pricing', 'Location', 'Service', 'Cleanliness', 'Availability'],
                datasets: [{
                    label: 'Ratings',
                    data: [4.8, 4.5, 4.9, 4.7, 4.6, 4.4],
                    backgroundColor: 'rgba(46, 139, 87, 0.2)',
                    borderColor: '#2E8B57',
                    borderWidth: 2,
                    pointBackgroundColor: '#2E8B57',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Create Earnings Chart
function createEarningsChart() {
    const ctx = document.getElementById('earningsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Monthly Earnings',
                data: [8000, 12000, 15000, 18000, 22000, 25000, 28000, 30000, 32000, 35000, 38000, 45600],
                borderColor: '#2E8B57',
                backgroundColor: 'rgba(46, 139, 87, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2E8B57',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + (value / 1000) + 'k';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Setup Filters
function setupFilters() {
    // Chart period filters
    const chartBtns = document.querySelectorAll('.chart-btn');
    chartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons in the same group
            btn.parentElement.querySelectorAll('.chart-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update chart data based on period
            updateChartData(btn.getAttribute('data-period'));
        });
    });
    
    // Booking filters
    const bookingFilter = document.querySelector('.filter-select');
    if (bookingFilter) {
        bookingFilter.addEventListener('change', (e) => {
            filterBookings(e.target.value);
        });
    }
    
    // Analytics filters
    const analyticsFilter = document.querySelector('.analytics-controls .filter-select');
    if (analyticsFilter) {
        analyticsFilter.addEventListener('change', (e) => {
            updateAnalyticsData(e.target.value);
        });
    }
}

// Update Chart Data
function updateChartData(period) {
    // This would typically fetch new data from the server
    console.log('Updating chart data for period:', period);
    
    // Simulate data update
    const bookingData = {
        '7d': [12, 19, 8, 15, 22, 18, 25],
        '30d': [45, 52, 38, 48, 65, 58, 72, 68, 75, 82, 78, 85, 92, 88, 95, 102, 98, 105, 112, 108, 115, 122, 118, 125, 132, 128, 135, 142, 138, 145],
        '90d': [120, 135, 142, 158, 165, 172, 188, 195, 202, 218, 225, 232, 248, 255, 262, 278, 285, 292, 308, 315, 322, 338, 345, 352, 368, 375, 382, 398, 405, 412]
    };
    
    // Update charts with new data
    // This is a simplified example - in a real app, you'd update the actual chart instances
}

// Filter Bookings
function filterBookings(status) {
    const bookingItems = document.querySelectorAll('.table-row');
    
    bookingItems.forEach(item => {
        const statusBadge = item.querySelector('.status-badge');
        if (status === 'all' || statusBadge.textContent.toLowerCase() === status) {
            item.style.display = 'grid';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update Analytics Data
function updateAnalyticsData(period) {
    console.log('Updating analytics data for period:', period);
    // This would typically fetch new analytics data from the server
}

// Setup Modals
function setupModals() {
    // Add turf modal
    const addTurfModal = document.getElementById('addTurfModal');
    if (addTurfModal) {
        // Handle form submission
        const form = addTurfModal.querySelector('.turf-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleAddTurf(form);
            });
        }
    }
}

// Show Add Turf Modal
function showAddTurfModal() {
    const modal = document.getElementById('addTurfModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

// Handle Add Turf
function handleAddTurf(form) {
    const formData = new FormData(form);
    const turfData = {
        name: formData.get('name') || form.querySelector('input[type="text"]').value,
        sport: formData.get('sport') || form.querySelector('select').value,
        address: formData.get('address') || form.querySelector('textarea').value,
        city: formData.get('city') || form.querySelectorAll('input[type="text"]')[1].value,
        price: formData.get('price') || form.querySelector('input[type="number"]').value,
        description: formData.get('description') || form.querySelectorAll('textarea')[1].value
    };
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<div class="loading"></div> Adding Turf...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        submitBtn.textContent = 'Turf Added Successfully!';
        submitBtn.style.background = '#2ecc71';
        
        setTimeout(() => {
            closeModal('addTurfModal');
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            
            // Refresh turfs section
            if (document.getElementById('turfs').classList.contains('active')) {
                loadSectionData('turfs');
            }
        }, 2000);
    }, 2000);
}

// Close Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// Setup Animations
function setupAnimations() {
    // Animate stats cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.stat-card, .chart-container, .booking-item').forEach(el => {
        observer.observe(el);
    });
}

// Load Dashboard Data
function loadDashboardData() {
    // Simulate loading dashboard data
    console.log('Loading dashboard data...');
    
    // Animate stat numbers
    animateStatNumbers();
}

// Animate Stat Numbers
function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.textContent.replace(/[^\d]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = stat.textContent.replace(/\d+/, target);
                clearInterval(timer);
            } else {
                stat.textContent = stat.textContent.replace(/\d+/, Math.floor(current));
            }
        }, 16);
    });
}

// Load Section Data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'turfs':
            loadTurfsData();
            break;
        case 'bookings':
            loadBookingsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'earnings':
            loadEarningsData();
            break;
    }
}

// Load Turfs Data
function loadTurfsData() {
    console.log('Loading turfs data...');
    // This would typically fetch data from the server
}

// Load Bookings Data
function loadBookingsData() {
    console.log('Loading bookings data...');
    // This would typically fetch data from the server
}

// Load Analytics Data
function loadAnalyticsData() {
    console.log('Loading analytics data...');
    // This would typically fetch data from the server
}

// Load Earnings Data
function loadEarningsData() {
    console.log('Loading earnings data...');
    // This would typically fetch data from the server
}

// Edit Turf
function editTurf(turfId) {
    console.log('Editing turf:', turfId);
    showEditTurfModal(turfId);
}

// View Turf Details
function viewTurfDetails(turfId) {
    console.log('Viewing turf details:', turfId);
    showViewTurfModal(turfId);
}

// Show Add Turf Modal
function showAddTurfModal() {
    currentStep = 1;
    resetForm();
    const modal = document.getElementById('addTurfModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        updateProgress();
        showStep(1);
    }
}

// Multi-Step Form Functions
let currentStep = 1;
const totalSteps = 3;

// Next Step
function nextStep(stepNumber) {
    if (validateCurrentStep()) {
        currentStep = stepNumber;
        showStep(stepNumber);
        updateProgress();
    }
}

// Previous Step
function prevStep(stepNumber) {
    currentStep = stepNumber;
    showStep(stepNumber);
    updateProgress();
}

// Show Specific Step
function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }

    // Update progress
    updateProgress();
}

// Update Progress Bar
function updateProgress() {
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNumber = index + 1;
        if (stepNumber < currentStep) {
            step.classList.remove('active');
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Validate Current Step
function validateCurrentStep() {
    let isValid = true;
    const currentStepElement = document.getElementById(`step${currentStep}`);

    if (!currentStepElement) return false;

    // Clear previous errors
    currentStepElement.querySelectorAll('.error').forEach(error => error.remove());
    currentStepElement.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });

    // Step 1 validation
    if (currentStep === 1) {
        const turfName = document.getElementById('turfName');
        const turfSport = document.getElementById('turfSport');
        const turfAddress = document.getElementById('turfAddress');
        const turfCity = document.getElementById('turfCity');
        const turfPrice = document.getElementById('turfPrice');

        if (!turfName.value.trim()) {
            showFieldError(turfName, 'Turf name is required');
            isValid = false;
        }

        if (!turfSport.value) {
            showFieldError(turfSport, 'Please select a sport type');
            isValid = false;
        }

        if (!turfAddress.value.trim()) {
            showFieldError(turfAddress, 'Address is required');
            isValid = false;
        }

        if (!turfCity.value.trim()) {
            showFieldError(turfCity, 'City is required');
            isValid = false;
        }

        if (!turfPrice.value || turfPrice.value < 100) {
            showFieldError(turfPrice, 'Price must be at least ₹100');
            isValid = false;
        }
    }

    // Step 2 validation
    else if (currentStep === 2) {
        const turfDescription = document.getElementById('turfDescription');
        const openingTime = document.getElementById('openingTime');
        const closingTime = document.getElementById('closingTime');

        if (turfDescription.value.trim().length < 20) {
            showFieldError(turfDescription, 'Description must be at least 20 characters');
            isValid = false;
        }

        // Check if at least one amenity is selected
        const selectedAmenities = document.querySelectorAll('#step2 input[type="checkbox"]:checked');
        if (selectedAmenities.length === 0) {
            showStepError('Please select at least one amenity');
            isValid = false;
        }
    }

    return isValid;
}

// Show Field Error
function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');

    const errorElement = document.createElement('span');
    errorElement.className = 'error';
    errorElement.textContent = message;

    formGroup.appendChild(errorElement);
}

// Show Step Error
function showStepError(message) {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const errorElement = document.createElement('div');
    errorElement.className = 'step-error';
    errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

    currentStepElement.insertBefore(errorElement, currentStepElement.firstChild);

    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

// Reset Form
function resetForm() {
    const form = document.getElementById('addTurfForm');
    if (form) {
        form.reset();
    }

    // Reset step
    currentStep = 1;

    // Clear image preview
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }

    // Reset file inputs
    const turfImages = document.getElementById('turfImages');
    const turfVideo = document.getElementById('turfVideo');
    if (turfImages) turfImages.value = '';
    if (turfVideo) turfVideo.value = '';
}

// Handle Add Turf Form Submission
function handleAddTurf(event) {
    event.preventDefault();

    if (!validateCurrentStep()) {
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    // Collect form data
    const formData = {
        name: document.getElementById('turfName').value.trim(),
        sport: document.getElementById('turfSport').value,
        address: document.getElementById('turfAddress').value.trim(),
        city: document.getElementById('turfCity').value.trim(),
        price: parseInt(document.getElementById('turfPrice').value),
        description: document.getElementById('turfDescription').value.trim(),
        openingTime: document.getElementById('openingTime').value,
        closingTime: document.getElementById('closingTime').value,
        amenities: Array.from(document.querySelectorAll('#step2 input[type="checkbox"]:checked'))
            .map(cb => cb.value),
        images: selectedImages || [],
        video: selectedVideo || null
    };

    console.log('Adding new turf:', formData);

    // Simulate API call
    setTimeout(() => {
        // Reset loading state
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        // Show success message
        showSuccessMessage('Turf added successfully!');

        // Close modal and reset
        setTimeout(() => {
            closeModal('addTurfModal');
            resetForm();

            // Add to turfs grid (mock)
            addTurfToGrid(formData);
        }, 1500);
    }, 2000);
}

// Add Turf to Grid
function addTurfToGrid(turfData) {
    const turfsGrid = document.querySelector('.turfs-grid');
    if (!turfsGrid) return;

    const turfId = Date.now(); // Mock ID
    const sportIcon = getSportIcon(turfData.sport);
    const amenitiesCount = turfData.amenities.length;

    const turfCard = document.createElement('div');
    turfCard.className = 'turf-card';
    turfCard.innerHTML = `
        <div class="turf-image">
            <img src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400" alt="${turfData.name}">
            <div class="turf-status pending">Pending</div>
        </div>
        <div class="turf-content">
            <h3 class="turf-name">${turfData.name}</h3>
            <p class="turf-location">
                <i class="fas fa-map-marker-alt"></i>
                ${turfData.city}
            </p>
            <div class="turf-stats">
                <div class="stat">
                    <span class="stat-value">₹${turfData.price}</span>
                    <span class="stat-label">per hour</span>
                </div>
                <div class="stat">
                    <span class="stat-value">-</span>
                    <span class="stat-label">rating</span>
                </div>
                <div class="stat">
                    <span class="stat-value">0</span>
                    <span class="stat-label">bookings</span>
                </div>
            </div>
            <div class="turf-actions">
                <button class="btn-secondary" onclick="editTurf(${turfId})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn-outline" onclick="viewTurfDetails(${turfId})">
                    <i class="fas fa-eye"></i>
                    View
                </button>
            </div>
        </div>
    `;

    turfsGrid.appendChild(turfCard);

    // Animate in
    setTimeout(() => {
        turfCard.style.opacity = '1';
        turfCard.style.transform = 'translateY(0)';
    }, 100);
}

// Get Sport Icon
function getSportIcon(sport) {
    const icons = {
        'football': 'fas fa-futbol',
        'cricket': 'fas fa-baseball-ball',
        'basketball': 'fas fa-basketball-ball',
        'tennis': 'fas fa-tennis-ball',
        'badminton': 'fas fa-shuttlecock',
        'hockey': 'fas fa-hockey-puck'
    };
    return icons[sport] || 'fas fa-futbol';
}

// Trigger File Upload
function triggerFileUpload() {
    const fileInput = document.getElementById('turfImages');
    if (fileInput) {
        fileInput.click();
    }
}

// Global variables for media
let selectedImages = [];
let selectedVideo = null;

// Handle Image Upload
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('turfImages');
    const videoInput = document.getElementById('turfVideo');
    const imageUploadArea = document.querySelector('.image-upload-area');

    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }

    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
    }

    if (imageUploadArea) {
        // Drag and drop functionality
        imageUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--teal-primary)';
            this.style.background = 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)';
        });

        imageUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--slate-light)';
            this.style.background = 'linear-gradient(135deg, #f8fdf9 0%, #f0f9f4 100%)';
        });

        imageUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--slate-light)';
            this.style.background = 'linear-gradient(135deg, #f8fdf9 0%, #f0f9f4 100%)';

            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));

            if (imageFiles.length > 0) {
                handleMultipleImages(imageFiles);
            }
        });
    }
});

// Handle Image Upload
function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    handleMultipleImages(files);
}

// Handle Multiple Images
function handleMultipleImages(files) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    files.forEach(file => {
        if (file.type.startsWith('image/') && selectedImages.length < 10) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="image-remove" onclick="removeImage('${file.name}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imagePreview.appendChild(imageItem);
                selectedImages.push(file);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Handle Video Upload
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
        selectedVideo = file;
        const videoArea = document.querySelector('.video-upload-area');
        const videoContent = document.querySelector('.video-upload-content');

        if (videoArea && videoContent) {
            videoContent.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Video selected: ${file.name}</span>
                <small>Click to change</small>
            `;
            videoArea.style.borderColor = 'var(--emerald-primary)';
            videoArea.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)';
        }
    }
}

// Remove Image
function removeImage(fileName) {
    selectedImages = selectedImages.filter(file => file.name !== fileName);
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        const imageItems = imagePreview.querySelectorAll('.image-item');
        imageItems.forEach(item => {
            if (item.querySelector('img').alt === fileName) {
                item.remove();
            }
        });
    }
}

// Show Success Message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.classList.add('show');
    }, 100);

    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 3000);
}
// Export functions for global access
window.showSection = showSection;
window.showAddTurfModal = showAddTurfModal;
window.showEditTurfModal = showEditTurfModal;
window.showViewTurfModal = showViewTurfModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.toggleSidebar = toggleSidebar;
window.editTurf = editTurf;
window.viewTurfDetails = viewTurfDetails;
window.saveTurfChanges = saveTurfChanges;
window.updateTurfCard = updateTurfCard;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.showStep = showStep;
window.validateCurrentStep = validateCurrentStep;
window.resetForm = resetForm;
window.handleAddTurf = handleAddTurf;
window.addTurfToGrid = addTurfToGrid;
window.triggerFileUpload = triggerFileUpload;
window.removeImage = removeImage;
window.showSuccessMessage = showSuccessMessage;
window.logout = logout;
