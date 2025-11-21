import api, { showToast } from './api.js';
import authManager from './auth.js';
import TurfSpotNavbar from './navbar.js';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize auth first
    await authManager.init();
    
    // Initialize navbar
    const navbar = window.turfspotNavbar || new TurfSpotNavbar();
    
    // Check authentication and update UI
    updateAuthUI(navbar);
    
    // Load popular turfs on homepage
    if (document.getElementById('popularTurfs')) {
        loadPopularTurfs();
    }
    
    // Setup event listeners
    setupEventListeners();
    setupAnimations();
}

// Update UI based on auth status
function updateAuthUI(navbar) {
    const user = authManager.getUser();
    
    // Update navbar UI
    if (navbar) {
        navbar.updateAuthUI(user);
    }
    
    // Sync auth buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const registerBtnMobile = document.getElementById('registerBtnMobile');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    
    // Setup login/register button clicks
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showLoginModal();
        });
    }
    if (loginBtnMobile) {
        loginBtnMobile.addEventListener('click', () => {
            showLoginModal();
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            showRegisterModal();
        });
    }
    if (registerBtnMobile) {
        registerBtnMobile.addEventListener('click', () => {
            showRegisterModal();
        });
    }
    
    // Setup logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
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
            showRegisterModal();
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
    const turfsGrid = document.getElementById('popularTurfs');
    const loader = document.getElementById('turfsLoader');
    
    if (!turfsGrid) {
        console.log('popularTurfs element not found');
        return;
    }
    
    try {
        console.log('Loading turfs...');
        if (loader) loader.style.display = 'flex';
        
        const response = await api.getTurfs({ limit: 6, sortBy: 'rating.average', order: 'desc' });
        console.log('API Response:', response);
        
        // Hide loader
        if (loader) loader.style.display = 'none';
        
        // Handle response data
        const turfs = (response && response.data) ? response.data : [];
        console.log('Turfs data:', turfs);
        
        if (turfs.length > 0) {
            turfsGrid.innerHTML = turfs.map(turf => createTurfCard(turf)).join('');
        } else {
            turfsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No turfs available at the moment.</p>';
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
        console.error('Error details:', error.message, error.stack);
        if (loader) loader.style.display = 'none';
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

window.showRegisterModal = function() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
    }
};

window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;

window.showOwnerSignup = function() {
    showRegisterModal();
};

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Local closeModal helper
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

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
        
        const success = await authManager.login(email, password);
        if (success) {
            closeModal('loginModal');
            // Redirection is handled by authManager.redirectBasedOnRole()
        }
    });
}

// Handle signup form
const signupForm = document.getElementById('registerForm');
if (signupForm) {
    let isSubmitting = false; // Prevent double submission
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevent double submission at form level
        if (isSubmitting || signupForm.dataset.submitting === 'true') {
            console.log('Registration already in progress, ignoring duplicate submission');
            return;
        }
        
        signupForm.dataset.submitting = 'true';
        
        const formData = {
            name: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('registerPhone').value,
            password: document.getElementById('registerPassword').value,
            role: document.getElementById('registerRole').value
        };
        
        try {
            isSubmitting = true;
            const submitBtn = document.getElementById('registerSubmitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registering...';
            
            const result = await authManager.register(formData);
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
            isSubmitting = false;
            signupForm.dataset.submitting = 'false';
            
            // Check if email verification is required
            if (result && result.success && result.requiresVerification) {
                // Store email for OTP verification
                sessionStorage.setItem('pendingVerificationEmail', formData.email);
                
                // Show OTP input field inline
                const otpGroup = document.getElementById('otpInputGroup');
                const otpInput = document.getElementById('registerOtpInput');
                
                if (otpGroup) {
                    otpGroup.style.display = 'block';
                }
                
                if (otpInput) {
                    setTimeout(() => otpInput.focus(), 100);
                }
                
                // Disable form fields except OTP
                document.getElementById('registerName').disabled = true;
                document.getElementById('registerEmail').disabled = true;
                document.getElementById('registerPhone').disabled = true;
                document.getElementById('registerPassword').disabled = true;
                document.getElementById('registerRole').disabled = true;
                submitBtn.style.display = 'none';
                
                // Enable resend OTP after 30 seconds
                const resendBtn = document.getElementById('resendOtpInline');
                if (resendBtn) {
                    resendBtn.style.pointerEvents = 'none';
                    resendBtn.style.opacity = '0.5';
                    let countdown = 30;
                    resendBtn.textContent = `Resend OTP (${countdown}s)`;
                    
                    const timer = setInterval(() => {
                        countdown--;
                        resendBtn.textContent = `Resend OTP (${countdown}s)`;
                        if (countdown <= 0) {
                            clearInterval(timer);
                            resendBtn.textContent = 'Resend OTP';
                            resendBtn.style.pointerEvents = 'auto';
                            resendBtn.style.opacity = '1';
                        }
                    }, 1000);
                }
            } else if (result && result.success && !result.requiresVerification) {
                closeModal('registerModal');
            }
        } catch (error) {
            isSubmitting = false;
            signupForm.dataset.submitting = 'false';
            const submitBtn = document.getElementById('registerSubmitBtn');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
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
            console.log('Owner registration response:', response);
            
            // Check if email verification is required
            if (response && response.data && response.data.requiresEmailVerification === true) {
                console.log('Owner OTP verification required - opening modal');
                showToast('OTP sent! Please check your email.', 'success');
                closeModal('ownerSignupModal');
                // Store email for OTP verification
                sessionStorage.setItem('pendingVerificationEmail', formData.email);
                // Show OTP modal
                setTimeout(() => {
                    openOtpModal();
                }, 100);
            } else if (response.data && response.data.token) {
                // Old flow - if token is returned
                authManager.setToken(response.data.token);
                authManager.setUser(response.data.user);
                showToast('Registration successful! Welcome to TurfSpot', 'success');
                closeModal('ownerSignupModal');
                setTimeout(() => {
                    window.location.href = 'owner-dashboard.html';
                }, 1000);
            } else {
                console.error('Unexpected owner response structure:', response);
            }
        } catch (error) {
            console.error('Owner registration error:', error);
            showToast(error.message || 'Registration failed', 'error');
        }
    });
}

// Handle OTP verification form (in register modal)
const otpVerifyForm = document.getElementById('otpVerifyForm');
if (otpVerifyForm) {
    otpVerifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otpInputField').value.trim();
        const email = sessionStorage.getItem('pendingVerificationEmail');
        
        if (!otp || otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        
        if (!email) {
            showToast('Session expired. Please register again.', 'error');
            closeModal('registerModal');
            return;
        }
        
        try {
            const submitBtn = otpVerifyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
            
            const response = await api.verifyOTP({ otp, email });
            
            // Save token and user data
            authManager.setToken(response.data.token);
            authManager.setUser(response.data.user);
            
            // Clear stored email
            sessionStorage.removeItem('pendingVerificationEmail');
            
            showToast('Email verified successfully! Account created.', 'success');
            
            // Reset modal
            document.getElementById('registerForm').style.display = 'block';
            document.getElementById('otpVerificationSection').style.display = 'none';
            document.getElementById('registerTitle').textContent = 'Create Account';
            document.getElementById('registerForm').reset();
            document.getElementById('otpInputField').value = '';
            
            closeModal('registerModal');
            
            // Redirect based on role
            const user = authManager.getUser();
            setTimeout(() => {
                if (user.role === 'owner') {
                    window.location.href = 'owner-dashboard.html';
                } else {
                    window.location.href = 'turfs.html';
                }
            }, 1000);
        } catch (error) {
            const submitBtn = otpVerifyForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify OTP';
            showToast(error.message || 'Invalid or expired OTP', 'error');
        }
    });
}

// Handle back to register button
const backToRegister = document.getElementById('backToRegister');
if (backToRegister) {
    backToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        // Show registration form, hide OTP section
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('otpVerificationSection').style.display = 'none';
        document.getElementById('registerTitle').textContent = 'Create Account';
        document.getElementById('otpInputField').value = '';
    });
}

// Handle resend OTP link
const resendOtpLink = document.getElementById('resendOtpLink');
if (resendOtpLink) {
    resendOtpLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = sessionStorage.getItem('pendingVerificationEmail');
        
        if (!email) {
            showToast('Session expired. Please register again.', 'error');
            return;
        }
        
        try {
            // You would need to create a resend OTP endpoint
            // For now, just show a message
            showToast('Please try registering again to receive a new OTP.', 'info');
        } catch (error) {
            showToast('Failed to resend OTP', 'error');
        }
    });
}

// Handle inline OTP verify button
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('registerOtpInput').value.trim();
        const email = sessionStorage.getItem('pendingVerificationEmail');
        
        if (!otp || otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        
        if (!email) {
            showToast('Session expired. Please register again.', 'error');
            closeModal('registerModal');
            return;
        }
        
        try {
            verifyOtpBtn.disabled = true;
            verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            
            const response = await api.verifyOTP({ otp, email });
            
            // Save token and user data
            authManager.setToken(response.data.token);
            authManager.setUser(response.data.user);
            
            // Clear stored email
            sessionStorage.removeItem('pendingVerificationEmail');
            
            showToast('Email verified successfully! Account created.', 'success');
            closeModal('registerModal');
            
            // Reset form
            document.getElementById('registerForm').reset();
            document.getElementById('otpInputGroup').style.display = 'none';
            document.getElementById('registerName').disabled = false;
            document.getElementById('registerEmail').disabled = false;
            document.getElementById('registerPhone').disabled = false;
            document.getElementById('registerPassword').disabled = false;
            document.getElementById('registerRole').disabled = false;
            document.getElementById('registerSubmitBtn').style.display = 'block';
            
            // Redirect based on role
            const user = authManager.getUser();
            setTimeout(() => {
                if (user.role === 'owner') {
                    window.location.href = 'owner-dashboard.html';
                } else {
                    window.location.href = 'turfs.html';
                }
            }, 1000);
        } catch (error) {
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify OTP';
            showToast(error.message || 'Invalid or expired OTP', 'error');
        }
    });
}

// Handle inline resend OTP link
const resendOtpInline = document.getElementById('resendOtpInline');
if (resendOtpInline) {
    resendOtpInline.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = sessionStorage.getItem('pendingVerificationEmail');
        
        if (!email) {
            showToast('Session expired. Please register again.', 'error');
            return;
        }
        
        try {
            showToast('Please wait 60 seconds before requesting a new OTP', 'info');
        } catch (error) {
            showToast('Failed to resend OTP', 'error');
        }
    });
}

// Handle OTP verification form (old modal - keeping for compatibility)
const otpForm = document.getElementById('otpForm');
if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otpInput').value.trim();
        const email = sessionStorage.getItem('pendingVerificationEmail');
        
        if (!otp || otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        
        if (!email) {
            showToast('Session expired. Please register again.', 'error');
            closeModal('otpModal');
            return;
        }
        
        try {
            const response = await api.verifyOTP({ otp, email });
            
            // Save token and user data
            authManager.setToken(response.data.token);
            authManager.setUser(response.data.user);
            
            // Clear stored email
            sessionStorage.removeItem('pendingVerificationEmail');
            
            showToast('Email verified successfully! Account created.', 'success');
            closeModal('otpModal');
            
            // Redirect based on role
            const user = authManager.getUser();
            setTimeout(() => {
                if (user.role === 'owner') {
                    window.location.href = 'owner-dashboard.html';
                } else {
                    window.location.href = 'turfs.html';
                }
            }, 1000);
        } catch (error) {
            showToast(error.message || 'Invalid or expired OTP', 'error');
        }
    });
}

// Function to show OTP section in register modal
function showOtpSection(email) {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('otpVerificationSection').style.display = 'block';
    document.getElementById('otpEmailDisplay').textContent = email;
    document.getElementById('registerTitle').textContent = 'Verify Your Email';
    document.getElementById('otpInputField').focus();
}

// Function to hide OTP section in register modal
function hideOtpSection() {
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('otpVerificationSection').style.display = 'none';
    document.getElementById('registerTitle').textContent = 'Create Account';
    document.getElementById('otpInputField').value = '';
    sessionStorage.removeItem('pendingVerificationEmail');
}

// Reset register modal when closed
const closeRegisterModal = document.getElementById('closeRegisterModal');
if (closeRegisterModal) {
    closeRegisterModal.addEventListener('click', () => {
        hideOtpSection();
        closeModal('registerModal');
    });
}
