import api, { showToast, formatCurrency, formatDate, formatDateTime } from './api.js';
import authManager from './auth.js';

let dashboardStats = null;
let pendingTurfs = [];
let allTurfs = [];
let allUsers = [];
let allBookings = [];
let currentSection = 'dashboard';

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for auth to initialize
    await authManager.init();
    
    // Require admin auth
    const hasAccess = await authManager.requireAuth('admin');
    if (!hasAccess) return;

    initializeAdminDashboard();
});

async function initializeAdminDashboard() {
    setupAdminSidebar();
    setupAdminCharts();
    setupAdminFilters();
    setupAdminModals();
    setupAdminAnimations();
    await loadAdminData();
}

// Admin Sidebar Setup
function setupAdminSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuItems = document.querySelectorAll('.menu-item a');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.menu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            
            item.parentElement.classList.add('active');
            
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('open');
            }
        });
    });
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle?.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// Show Section
function showSection(sectionId) {
    currentSection = sectionId;
    
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = getAdminSectionTitle(sectionId);
        }
        
        loadAdminSectionData(sectionId);
    }
}

function getAdminSectionTitle(sectionId) {
    const titles = {
        'dashboard': 'Admin Dashboard',
        'pending-turfs': 'Pending Turf Approvals',
        'approved-turfs': 'Approved Turfs',
        'users': 'User Management',
        'owners': 'Turf Owners',
        'bookings': 'All Bookings',
        'analytics': 'Platform Analytics',
        'reports': 'Reports',
        'settings': 'Admin Settings'
    };
    return titles[sectionId] || 'Admin Dashboard';
}

// Setup Admin Charts (keeping existing chart code)
function setupAdminCharts() {
    Chart.defaults.color = '#666666';
    Chart.defaults.font.family = 'Poppins, sans-serif';
    
    createGrowthChart();
    createRevenueBreakdownChart();
    createUserGrowthChart();
    createTurfRegistrationsChart();
    createBookingTrendsChart();
    createRevenueAnalysisChart();
}

function createGrowthChart() {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Users',
                data: [100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1234],
                borderColor: '#9370DB',
                backgroundColor: 'rgba(147, 112, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Turfs',
                data: [5, 8, 12, 15, 20, 25, 30, 35, 40, 45, 48, 52],
                borderColor: '#2E8B57',
                backgroundColor: 'rgba(46, 139, 87, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
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

function createRevenueBreakdownChart() {
    const ctx = document.getElementById('revenueBreakdownChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Platform Commission', 'Transaction Fees', 'Featured Listings', 'Premium Support'],
            datasets: [{
                data: [60, 25, 10, 5],
                backgroundColor: [
                    '#9370DB',
                    '#2E8B57',
                    '#87CEEB',
                    '#8B4513'
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

function createUserGrowthChart() {
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'New Users',
                data: [50, 75, 100, 125],
                borderColor: '#9370DB',
                backgroundColor: 'rgba(147, 112, 219, 0.1)',
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
                    beginAtZero: true
                }
            }
        }
    });
}

function createTurfRegistrationsChart() {
    const ctx = document.getElementById('turfRegistrationsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Football', 'Cricket', 'Basketball', 'Tennis', 'Other'],
            datasets: [{
                label: 'Registrations',
                data: [20, 15, 8, 6, 3],
                backgroundColor: [
                    '#2E8B57',
                    '#8B4513',
                    '#87CEEB',
                    '#9370DB',
                    '#666666'
                ],
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

function createBookingTrendsChart() {
    const ctx = document.getElementById('bookingTrendsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Bookings',
                data: [45, 52, 38, 48, 65, 58, 72],
                borderColor: '#2E8B57',
                backgroundColor: 'rgba(46, 139, 87, 0.1)',
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
                    beginAtZero: true
                }
            }
        }
    });
}

function createRevenueAnalysisChart() {
    const ctx = document.getElementById('revenueAnalysisChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [120000, 150000, 180000, 200000, 220000, 240000],
                backgroundColor: 'rgba(147, 112, 219, 0.8)',
                borderColor: '#9370DB',
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

function setupAdminFilters() {
    const chartBtns = document.querySelectorAll('.chart-btn');
    chartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.querySelectorAll('.chart-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            btn.classList.add('active');
            updateAdminChartData(btn.getAttribute('data-period'));
        });
    });
    
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterAdminContent(searchTerm);
        });
    });
    
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            filterAdminContentByType(e.target.value);
        });
    });
}

function updateAdminChartData(period) {
    console.log('Updating admin chart data for period:', period);
}

function filterAdminContent(searchTerm) {
    const tableRows = document.querySelectorAll('.table-row');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = 'grid';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterAdminContentByType(type) {
    console.log('Filtering admin content by type:', type);
}

function setupAdminModals() {
    const turfReviewModal = document.getElementById('turfReviewModal');
    if (turfReviewModal) {
        // Handle modal interactions
    }
}

function setupAdminAnimations() {
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
    
    document.querySelectorAll('.stat-card, .chart-container, .activity-item').forEach(el => {
        observer.observe(el);
    });
}

// Load Admin Data - NOW USING REAL API
async function loadAdminData() {
    try {
        const response = await api.getDashboardStats();
        dashboardStats = response.data;
        
        // Update stats
        document.getElementById('totalUsers').textContent = dashboardStats.totalUsers || 0;
        document.getElementById('totalTurfs').textContent = dashboardStats.totalTurfs || 0;
        document.getElementById('pendingApprovals').textContent = dashboardStats.pendingApprovals || 0;
        document.getElementById('totalRevenue').textContent = formatCurrency(dashboardStats.totalRevenue || 0);
        
        animateAdminStatNumbers();
        updatePendingTurfsCount();
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function animateAdminStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const text = stat.textContent;
        const target = parseInt(text.replace(/[^\d]/g, ''));
        const suffix = text.replace(/[\d]/g, '');
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target + suffix;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current) + suffix;
            }
        }, 16);
    });
}

async function updatePendingTurfsCount() {
    const badge = document.querySelector('.badge');
    if (badge && dashboardStats) {
        badge.textContent = dashboardStats.pendingApprovals || '0';
    }
}

// Load Admin Section Data - NOW USING REAL API
async function loadAdminSectionData(sectionId) {
    switch (sectionId) {
        case 'pending-turfs':
            await loadPendingTurfsData();
            break;
        case 'approved-turfs':
            await loadApprovedTurfsData();
            break;
        case 'users':
            await loadUsersData();
            break;
        case 'bookings':
            await loadAllBookingsData();
            break;
        case 'analytics':
            await loadAnalyticsData();
            break;
    }
}

async function loadPendingTurfsData() {
    try {
        const response = await api.getPendingTurfs();
        pendingTurfs = response.data || [];
        
        const container = document.getElementById('pendingTurfsList');
        if (!container) return;
        
        if (pendingTurfs.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>No Pending Approvals</h3><p>All turfs have been reviewed</p></div>';
            return;
        }
        
        container.innerHTML = pendingTurfs.map(turf => createPendingTurfCard(turf)).join('');
    } catch (error) {
        console.error('Error loading pending turfs:', error);
        showToast('Failed to load pending turfs', 'error');
    }
}

function createPendingTurfCard(turf) {
    const primaryImage = turf.images?.find(img => img.isPrimary)?.url || turf.images?.[0]?.url || 'https://placehold.co/300x200/10b981/white?text=Turf';
    
    return `
        <div class="pending-turf-card">
            <img src="${primaryImage}" alt="${turf.name}" onerror="this.src='https://placehold.co/300x200/10b981/white?text=Turf'">
            <div class="turf-info">
                <h3>${turf.name}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${turf.address.city}, ${turf.address.state}</p>
                <p><i class="fas fa-user"></i> Owner: ${turf.owner?.name || 'Unknown'}</p>
                <p><i class="fas fa-futbol"></i> ${turf.sportsSupported.join(', ')}</p>
                <p><i class="fas fa-rupee-sign"></i> ${formatCurrency(turf.pricing.hourlyRate)}/hour</p>
            </div>
            <div class="turf-actions">
                <button class="btn btn-primary" onclick="approveTurf('${turf._id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger" onclick="rejectTurf('${turf._id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn btn-outline" onclick="viewTurfDetails('${turf._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
    `;
}

async function loadApprovedTurfsData() {
    try {
        const response = await api.getAllTurfs({ status: 'approved' });
        allTurfs = response.data || [];
        
        const container = document.getElementById('approvedTurfsList');
        if (!container) return;
        
        if (allTurfs.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><h3>No Approved Turfs</h3></div>';
            return;
        }
        
        container.innerHTML = allTurfs.map(turf => createApprovedTurfRow(turf)).join('');
    } catch (error) {
        console.error('Error loading approved turfs:', error);
        showToast('Failed to load approved turfs', 'error');
    }
}

function createApprovedTurfRow(turf) {
    return `
        <div class="table-row">
            <div>${turf.name}</div>
            <div>${turf.address.city}</div>
            <div>${turf.owner?.name || 'Unknown'}</div>
            <div>${formatCurrency(turf.pricing.hourlyRate)}</div>
            <div><span class="status-badge approved">Approved</span></div>
            <div>
                <button class="btn btn-sm" onclick="viewTurfDetails('${turf._id}')">View</button>
                <button class="btn btn-sm btn-danger" onclick="suspendTurf('${turf._id}')">Suspend</button>
            </div>
        </div>
    `;
}

async function loadUsersData() {
    try {
        const response = await api.getAllUsers();
        allUsers = response.data || [];
        
        const container = document.getElementById('usersList');
        if (!container) return;
        
        if (allUsers.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No Users</h3></div>';
            return;
        }
        
        container.innerHTML = allUsers.map(user => createUserRow(user)).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Failed to load users', 'error');
    }
}

function createUserRow(user) {
    return `
        <div class="table-row">
            <div>${user.name}</div>
            <div>${user.email}</div>
            <div>${user.role}</div>
            <div>${formatDate(user.createdAt)}</div>
            <div><span class="status-badge ${user.isActive ? 'approved' : 'banned'}">${user.isActive ? 'Active' : 'Banned'}</span></div>
            <div>
                <button class="btn btn-sm" onclick="viewUserDetails('${user._id}')">View</button>
                ${user.isActive ? `<button class="btn btn-sm btn-danger" onclick="banUser('${user._id}')">Ban</button>` : ''}
            </div>
        </div>
    `;
}

async function loadAllBookingsData() {
    try {
        const response = await api.getAllBookings();
        allBookings = response.data || [];
        
        const container = document.getElementById('allBookingsList');
        if (!container) return;
        
        if (allBookings.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><h3>No Bookings</h3></div>';
            return;
        }
        
        container.innerHTML = allBookings.map(booking => createBookingRow(booking)).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
        showToast('Failed to load bookings', 'error');
    }
}

function createBookingRow(booking) {
    return `
        <div class="table-row">
            <div>${booking.user?.name || 'Unknown'}</div>
            <div>${booking.turf?.name || 'Unknown'}</div>
            <div>${formatDate(booking.bookingDate)}</div>
            <div>${formatCurrency(booking.totalAmount || 0)}</div>
            <div><span class="status-badge status-${booking.status}">${booking.status}</span></div>
            <div>
                <button class="btn btn-sm" onclick="viewBookingDetails('${booking._id}')">View</button>
            </div>
        </div>
    `;
}

async function loadAnalyticsData() {
    console.log('Loading analytics data...');
}

// Approve Turf - NOW USING REAL API
async function approveTurf(turfId) {
    if (!confirm('Are you sure you want to approve this turf?')) {
        return;
    }

    try {
        await api.approveTurf(turfId);
        showToast('Turf approved successfully', 'success');
        
        // Remove from UI
        const turfCard = document.querySelector(`[onclick*="${turfId}"]`)?.closest('.pending-turf-card');
        if (turfCard) {
            turfCard.style.opacity = '0';
            turfCard.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                turfCard.remove();
                updatePendingTurfsCount();
            }, 300);
        }
        
        // Reload data
        loadAdminData();
    } catch (error) {
        console.error('Error approving turf:', error);
        showToast(error.message || 'Failed to approve turf', 'error');
    }
}

// Reject Turf - NOW USING REAL API
async function rejectTurf(turfId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
        await api.rejectTurf(turfId, reason);
        showToast('Turf rejected successfully', 'success');
        
        // Remove from UI
        const turfCard = document.querySelector(`[onclick*="${turfId}"]`)?.closest('.pending-turf-card');
        if (turfCard) {
            turfCard.style.opacity = '0';
            turfCard.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                turfCard.remove();
                updatePendingTurfsCount();
            }, 300);
        }
        
        // Reload data
        loadAdminData();
    } catch (error) {
        console.error('Error rejecting turf:', error);
        showToast(error.message || 'Failed to reject turf', 'error');
    }
}

function reviewTurf(turfId) {
    const modal = document.getElementById('turfReviewModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function requestMoreInfo(turfId) {
    const message = prompt('What additional information do you need from the turf owner?');
    if (message) {
        showToast('Request sent to turf owner', 'success');
    }
}

async function suspendTurf(turfId) {
    if (!confirm('Are you sure you want to suspend this turf?')) {
        return;
    }

    try {
        await api.suspendTurf(turfId);
        showToast('Turf suspended successfully', 'success');
        loadApprovedTurfsData();
    } catch (error) {
        console.error('Error suspending turf:', error);
        showToast(error.message || 'Failed to suspend turf', 'error');
    }
}

async function banUser(userId) {
    if (!confirm('Are you sure you want to ban this user?')) {
        return;
    }

    try {
        await api.banUser(userId);
        showToast('User banned successfully', 'success');
        loadUsersData();
    } catch (error) {
        console.error('Error banning user:', error);
        showToast(error.message || 'Failed to ban user', 'error');
    }
}

function viewTurfDetails(turfId) {
    window.location.href = `turf-details.html?id=${turfId}`;
}

function viewUserDetails(userId) {
    showToast('User details view coming soon!', 'info');
}

function viewBookingDetails(bookingId) {
    showToast('Booking details view coming soon!', 'info');
}

function logout() {
    authManager.logout();
}

// Export functions for global access
window.showSection = showSection;
window.approveTurf = approveTurf;
window.rejectTurf = rejectTurf;
window.reviewTurf = reviewTurf;
window.requestMoreInfo = requestMoreInfo;
window.suspendTurf = suspendTurf;
window.banUser = banUser;
window.viewTurfDetails = viewTurfDetails;
window.viewUserDetails = viewUserDetails;
window.viewBookingDetails = viewBookingDetails;
window.logout = logout;
