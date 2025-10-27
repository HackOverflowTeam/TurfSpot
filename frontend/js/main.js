import api, { showToast } from './api.js';
import authManager from './auth.js';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Check authentication and update UI
    updateAuthUI();
    
    // Load popular turfs on homepage
    if (document.getElementById('turfsGrid')) {
        loadPopularTurfs();
    }
    
    // Setup event listeners
    setupEventListeners();
    setupAnimations();
}

// Update UI based on auth status
function updateAuthUI() {
    const navButtons = document.getElementById('navButtons');
    const user = authManager.getUser();
    
    if (user && navButtons) {
        // User is logged in
        let dashboardLink = '';
        let dashboardText = 'Dashboard';
        
        if (user.role === 'admin') {
            dashboardLink = 'admin-dashboard.html';
            dashboardText = 'Admin Panel';
        } else if (user.role === 'owner') {
            dashboardLink = 'owner-dashboard.html';
            dashboardText = 'My Dashboard';
        } else {
            dashboardLink = 'my-bookings.html';
            dashboardText = 'My Bookings';
        }
        
        navButtons.innerHTML = `
            <a href="${dashboardLink}" class="btn-secondary">
                <i class="fas fa-user"></i> ${dashboardText}
            </a>
            <button class="btn-primary" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // Become owner button
    const becomeOwnerBtn = document.getElementById('becomeOwnerBtn');
    if (becomeOwnerBtn) {
        becomeOwnerBtn.addEventListener('click', () => {
            showOwnerSignup();
        });
    }
    
    // Hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
}

// Setup animations
function setupAnimations() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Add scroll reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.turf-card, .why-item, .step-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Handle search
function handleSearch() {
    const city = document.getElementById('citySearch')?.value;
    const sport = document.getElementById('sportSearch')?.value;
    
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (sport) params.set('sport', sport);
    
    window.location.href = `turfs.html?${params.toString()}`;
}

// Load popular turfs on homepage
async function loadPopularTurfs() {
    const turfsGrid = document.getElementById('turfsGrid');
    
    if (!turfsGrid) return;
    
    try {
        turfsGrid.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading turfs...</div>';
        
        const response = await api.getTurfs({ limit: 6, status: 'approved' });
        
        if (response.data && response.data.length > 0) {
            turfsGrid.innerHTML = response.data.map(turf => createTurfCard(turf)).join('');
        } else {
            turfsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No turfs available at the moment.</p>';
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
        turfsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1; color: var(--danger);">Failed to load turfs. Please try again.</p>';
    }
}

// Create turf card HTML
function createTurfCard(turf) {
    const primaryImage = turf.images && turf.images.length > 0 
        ? turf.images.find(img => img.isPrimary)?.url || turf.images[0].url
        : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop';

    const rating = turf.rating?.average || 4.5;
    const ratingCount = turf.rating?.count || 0;
    const sports = turf.sportsSupported || [];
    const city = turf.address?.city || 'City';
    const price = turf.pricing?.hourlyRate || 500;

    return `
        <div class="turf-card" onclick="window.location.href='turf-details.html?id=${turf._id}'">
            <div class="turf-image">
                <img src="${primaryImage}" alt="${turf.name}" 
                     onerror="this.src='https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop'">
                <div class="turf-badge">Featured</div>
            </div>
            <div class="turf-content">
                <h3 class="turf-name">${turf.name}</h3>
                <div class="turf-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${city}</span>
                </div>
                <div class="turf-amenities">
                    ${sports.slice(0, 3).map(sport => 
                        `<span class="amenity">${sport}</span>`
                    ).join('')}
                </div>
                <div class="turf-footer">
                    <div class="turf-price">₹${price}<span>/hour</span></div>
                    <button class="btn-book" onclick="event.stopPropagation(); window.location.href='turf-details.html?id=${turf._id}'">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Modal functions
window.showLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
    }
};

window.showSignupModal = function() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.add('active');
    }
};

window.showOwnerSignup = function() {
    const modal = document.getElementById('ownerSignupModal');
    if (modal) {
        modal.classList.add('active');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
};

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Global logout function
window.handleLogout = function() {
    authManager.logout();
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
};

// Handle login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        
        try {
            const response = await api.login({ email, password });
            authManager.setToken(response.token);
            authManager.setUser(response.data.user);
            showToast('Login successful!', 'success');
            closeModal('loginModal');
            setTimeout(() => {
                const user = authManager.getUser();
                if (user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (user.role === 'owner') {
                    window.location.href = 'owner-dashboard.html';
                } else {
                    window.location.href = 'turfs.html';
                }
            }, 1000);
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
        }
    });
}

// Handle signup form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: e.target.name.value,
            email: e.target.email.value,
            phone: e.target.phone.value,
            password: e.target.password.value,
            role: 'user'
        };
        
        try {
            const response = await api.register(formData);
            authManager.setToken(response.token);
            authManager.setUser(response.data.user);
            showToast('Registration successful!', 'success');
            closeModal('signupModal');
            setTimeout(() => {
                window.location.href = 'turfs.html';
            }, 1000);
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
        }
    });
}

// Handle owner signup form
const ownerSignupForm = document.getElementById('ownerSignupForm');
if (ownerSignupForm) {
    ownerSignupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: e.target.name.value,
            email: e.target.email.value,
            phone: e.target.phone.value,
            password: e.target.password.value,
            role: 'owner'
        };
        
        try {
            const response = await api.register(formData);
            authManager.setToken(response.token);
            authManager.setUser(response.data.user);
            showToast('Registration successful! Welcome to TurfSpot', 'success');
            closeModal('ownerSignupModal');
            setTimeout(() => {
                window.location.href = 'owner-dashboard.html';
            }, 1000);
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
        }
    });
}
