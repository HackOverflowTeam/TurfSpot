import api, { showToast } from './api.js';

// Auth State Management
class AuthManager {
    constructor() {
        this.user = null;
        this.initialized = false;
        this.initPromise = null;
    }

    // Get user from localStorage
    getUserFromStorage() {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    // Set user in localStorage
    setUserInStorage(user) {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            const token = api.getToken();
            const cachedUser = this.getUserFromStorage();
            
            if (token) {
                // Use cached user data for immediate UI update
                if (cachedUser) {
                    this.user = cachedUser;
                    this.initialized = true;
                    this.updateUI();
                    this.checkPageAccess(); // Check if user should access this page
                }
                
                try {
                    // Fetch fresh user data from server
                    const response = await api.getCurrentUser();
                    this.user = response.data;
                    this.setUserInStorage(this.user);
                    this.initialized = true;
                    this.updateUI();
                    this.checkPageAccess(); // Check again with fresh data
                } catch (error) {
                    console.error('Failed to get current user:', error);
                    // If we have cached data, keep using it
                    if (!cachedUser) {
                        api.removeToken();
                        this.setUserInStorage(null);
                        this.user = null;
                    }
                    this.initialized = true;
                }
            } else {
                this.initialized = true;
                this.checkPageAccess(); // Check for unauthenticated access
            }
        })();

        return this.initPromise;
    }

    // Check if current user has access to the current page
    checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Define page access rules
        const ownerOnlyPages = ['owner-dashboard.html', 'owner-subscription.html'];
        const adminOnlyPages = ['admin-dashboard.html'];
        const userOnlyPages = ['my-bookings.html'];
        const authRequiredPages = [...ownerOnlyPages, ...adminOnlyPages, ...userOnlyPages, 'profile.html'];
        
        // Define restricted pages for owners (they shouldn't access these)
        const ownerRestrictedPages = ['discover.html', 'turfs.html', 'turf-details.html', 'my-bookings.html'];
        
        // If not authenticated and trying to access auth-required page
        if (!this.isAuthenticated() && authRequiredPages.includes(currentPage)) {
            showToast('Please login to continue', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return;
        }
        
        // If authenticated, check role-based access
        if (this.isAuthenticated()) {
            if (this.hasRole('owner')) {
                // Owners can't access user-only pages or admin pages
                if (ownerRestrictedPages.includes(currentPage) || adminOnlyPages.includes(currentPage)) {
                    showToast('Access denied. Redirecting to your dashboard...', 'error');
                    setTimeout(() => {
                        window.location.href = 'owner-dashboard.html';
                    }, 1000);
                }
            } else if (this.hasRole('admin')) {
                // Admins can't access owner-only pages
                if (ownerOnlyPages.includes(currentPage)) {
                    showToast('Access denied. Redirecting to admin dashboard...', 'error');
                    setTimeout(() => {
                        window.location.href = 'admin-dashboard.html';
                    }, 1000);
                }
            } else if (this.hasRole('user')) {
                // Users can't access owner or admin pages
                if (ownerOnlyPages.includes(currentPage) || adminOnlyPages.includes(currentPage)) {
                    showToast('Access denied. Redirecting to home...', 'error');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            }
        }
    }

    async login(email, password) {
        try {
            const response = await api.login({ email, password });
            api.setToken(response.data.token);
            this.user = response.data.user;
            this.setUserInStorage(this.user);
            this.updateUI();
            showToast('Login successful!', 'success');
            
            // Role-based redirection
            this.redirectBasedOnRole();
            
            return true;
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
            return false;
        }
    }

    // Redirect user based on their role
    redirectBasedOnRole() {
        if (!this.user) return;
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Define role-based home pages
        const roleHomePages = {
            'owner': 'owner-dashboard.html',
            'admin': 'admin-dashboard.html',
            'user': 'index.html'
        };
        
        // Define restricted pages for owners (they shouldn't access these)
        const ownerRestrictedPages = ['discover.html', 'turfs.html', 'turf-details.html', 'my-bookings.html'];
        
        // Define restricted pages for users (they shouldn't access these)
        const userRestrictedPages = ['owner-dashboard.html', 'owner-subscription.html', 'admin-dashboard.html'];
        
        if (this.hasRole('owner')) {
            // Redirect owners away from user pages to their dashboard
            if (ownerRestrictedPages.includes(currentPage) || currentPage === 'index.html') {
                window.location.href = 'owner-dashboard.html';
            }
        } else if (this.hasRole('admin')) {
            // Redirect admins to admin dashboard
            if (currentPage === 'index.html' || userRestrictedPages.includes(currentPage)) {
                window.location.href = 'admin-dashboard.html';
            }
        } else if (this.hasRole('user')) {
            // Redirect users away from owner/admin pages
            if (userRestrictedPages.includes(currentPage)) {
                window.location.href = 'index.html';
            }
        }
    }

    async register(userData) {
        try {
            const response = await api.register(userData);
            
            // Check if email verification is required
            if (response.data.requiresEmailVerification) {
                showToast('OTP sent to your email!', 'success');
                return { success: true, requiresVerification: true, email: userData.email };
            } else {
                api.setToken(response.data.token);
                this.user = response.data.user;
                this.setUserInStorage(this.user);
                this.updateUI();
                showToast('Registration successful!', 'success');
                this.redirectBasedOnRole();
                
                return { success: true, requiresVerification: false };
            }
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
            return { success: false };
        }
    }

    async sendOTP() {
        try {
            await api.sendOTP();
            showToast('OTP sent to your email!', 'success');
            return true;
        } catch (error) {
            showToast(error.message || 'Failed to send OTP', 'error');
            return false;
        }
    }

    async verifyOTP(otp) {
        try {
            const response = await api.verifyOTP({ otp });
            this.user = response.data.user;
            this.setUserInStorage(this.user);
            this.updateUI();
            showToast('Email verified successfully!', 'success');
            
            // Role-based redirection after verification
            this.redirectBasedOnRole();
            
            return true;
        } catch (error) {
            showToast(error.message || 'Invalid or expired OTP', 'error');
            return false;
        }
    }

    logout() {
        const wasOwner = this.hasRole('owner');
        const wasAdmin = this.hasRole('admin');
        
        api.removeToken();
        this.setUserInStorage(null);
        this.user = null;
        this.updateUI();
        showToast('Logged out successfully', 'success');
        
        // Redirect to home page (public landing)
        window.location.href = 'index.html';
    }

    getUser() {
        return this.user;
    }

    setUser(user) {
        this.user = user;
        this.setUserInStorage(user);
        this.updateUI();
    }

    setToken(token) {
        api.setToken(token);
    }

    getToken() {
        return api.getToken();
    }

    isAuthenticated() {
        return !!this.user;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    // Get home page based on user role
    getHomePage() {
        if (!this.user) return 'index.html';
        
        switch (this.user.role) {
            case 'owner':
                return 'owner-dashboard.html';
            case 'admin':
                return 'admin-dashboard.html';
            case 'user':
            default:
                return 'index.html';
        }
    }

    // Check if a page is accessible for current user
    canAccessPage(pageName) {
        if (!pageName) return true;
        
        const ownerOnlyPages = ['owner-dashboard.html', 'owner-subscription.html'];
        const adminOnlyPages = ['admin-dashboard.html'];
        const userOnlyPages = ['my-bookings.html'];
        const ownerRestrictedPages = ['discover.html', 'turfs.html', 'turf-details.html'];
        
        // Not authenticated
        if (!this.isAuthenticated()) {
            const authRequiredPages = [...ownerOnlyPages, ...adminOnlyPages, ...userOnlyPages, 'profile.html'];
            return !authRequiredPages.includes(pageName);
        }
        
        // Owner restrictions
        if (this.hasRole('owner')) {
            return !ownerRestrictedPages.includes(pageName) && !adminOnlyPages.includes(pageName);
        }
        
        // Admin restrictions
        if (this.hasRole('admin')) {
            return !ownerOnlyPages.includes(pageName);
        }
        
        // User restrictions
        if (this.hasRole('user')) {
            return !ownerOnlyPages.includes(pageName) && !adminOnlyPages.includes(pageName);
        }
        
        return true;
    }

    updateUI() {
        // Update navbar if it exists
        if (window.turfspotNavbar && typeof window.turfspotNavbar.updateAuthUI === 'function') {
            window.turfspotNavbar.updateAuthUI(this.user);
        }
        
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const myBookingsLink = document.getElementById('myBookingsLink');
        const ownerDashLink = document.getElementById('ownerDashLink');
        const adminDashLink = document.getElementById('adminDashLink');
        
        // Mobile elements
        const loginBtnMobile = document.getElementById('loginBtnMobile');
        const registerBtnMobile = document.getElementById('registerBtnMobile');
        const logoutBtnMobile = document.getElementById('logoutBtnMobile');
        const mobileMyBookingsLink = document.getElementById('mobileMyBookingsLink');
        const mobileOwnerDashLink = document.getElementById('mobileOwnerDashLink');
        const mobileAdminDashLink = document.getElementById('mobileAdminDashLink');
        const mobileProfileLink = document.getElementById('mobileProfileLink');
        
        // Public navigation links (to be hidden for owners)
        const navbarLinks = document.querySelectorAll('.navbar-link[href="discover.html"], .navbar-link[href="turfs.html"], .navbar-link[href="index.html"]');
        const mobileNavLinks = document.querySelectorAll('.mobile-menu-link[href="discover.html"], .mobile-menu-link[href="turfs.html"], .mobile-menu-link[href="index.html"]');

        if (this.isAuthenticated()) {
            // Hide login/register buttons
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (loginBtnMobile) loginBtnMobile.style.display = 'none';
            if (registerBtnMobile) registerBtnMobile.style.display = 'none';

            // Show logout button (mobile)
            if (logoutBtnMobile) logoutBtnMobile.style.display = 'block';
            if (mobileProfileLink) mobileProfileLink.style.display = 'block';

            // Show user menu
            if (userMenu) userMenu.style.display = 'flex';
            if (userAvatar) {
                userAvatar.src = this.user.profileImage || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name)}&background=10b981&color=fff`;
                userAvatar.alt = this.user.name;
            }
            
            // Update user name
            if (userName) {
                userName.textContent = this.user.name.split(' ')[0]; // First name only
            }

            // Role-specific UI updates
            if (this.hasRole('owner')) {
                // Hide public navigation for owners (including Home)
                navbarLinks.forEach(link => link.style.display = 'none');
                mobileNavLinks.forEach(link => link.style.display = 'none');
                
                // Update logo link to go to dashboard instead of home
                const logoLinks = document.querySelectorAll('.navbar-logo, .logo-link, a[href="index.html"].logo');
                logoLinks.forEach(link => {
                    if (link.href && link.href.includes('index.html')) {
                        link.href = 'owner-dashboard.html';
                    }
                });
                
                // Show owner dashboard link
                if (ownerDashLink) {
                    ownerDashLink.style.display = 'block';
                    ownerDashLink.href = 'owner-dashboard.html';
                }
                if (mobileOwnerDashLink) {
                    mobileOwnerDashLink.style.display = 'block';
                    mobileOwnerDashLink.href = 'owner-dashboard.html';
                }
                
                // Hide user-specific links
                if (myBookingsLink) myBookingsLink.style.display = 'none';
                if (mobileMyBookingsLink) mobileMyBookingsLink.style.display = 'none';
                
            } else if (this.hasRole('admin')) {
                // Show admin dashboard link
                if (adminDashLink) {
                    adminDashLink.style.display = 'block';
                    adminDashLink.href = 'admin-dashboard.html';
                }
                if (mobileAdminDashLink) {
                    mobileAdminDashLink.style.display = 'block';
                    mobileAdminDashLink.href = 'admin-dashboard.html';
                }
                
                // Show public navigation
                navbarLinks.forEach(link => link.style.display = 'block');
                mobileNavLinks.forEach(link => link.style.display = 'block');
                
                // Restore logo link to home
                const logoLinks = document.querySelectorAll('.navbar-logo, .logo-link, a[href*="html"].logo');
                logoLinks.forEach(link => {
                    link.href = 'index.html';
                });
                
            } else if (this.hasRole('user')) {
                // Show public navigation for regular users
                navbarLinks.forEach(link => link.style.display = 'block');
                mobileNavLinks.forEach(link => link.style.display = 'block');
                
                // Restore logo link to home
                const logoLinks = document.querySelectorAll('.navbar-logo, .logo-link, a[href*="html"].logo');
                logoLinks.forEach(link => {
                    link.href = 'index.html';
                });
                
                // Show my bookings link for users
                if (myBookingsLink) {
                    myBookingsLink.style.display = 'block';
                    myBookingsLink.href = 'my-bookings.html';
                }
                if (mobileMyBookingsLink) {
                    mobileMyBookingsLink.style.display = 'block';
                    mobileMyBookingsLink.href = 'my-bookings.html';
                }
            }
            
        } else {
            // Show login/register buttons
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (registerBtn) registerBtn.style.display = 'inline-flex';
            if (loginBtnMobile) loginBtnMobile.style.display = 'block';
            if (registerBtnMobile) registerBtnMobile.style.display = 'block';

            // Hide logout button (mobile)
            if (logoutBtnMobile) logoutBtnMobile.style.display = 'none';
            if (mobileProfileLink) mobileProfileLink.style.display = 'none';

            // Hide user menu
            if (userMenu) userMenu.style.display = 'none';

            // Hide all role-specific links
            if (myBookingsLink) myBookingsLink.style.display = 'none';
            if (ownerDashLink) ownerDashLink.style.display = 'none';
            if (adminDashLink) adminDashLink.style.display = 'none';
            if (mobileMyBookingsLink) mobileMyBookingsLink.style.display = 'none';
            if (mobileOwnerDashLink) mobileOwnerDashLink.style.display = 'none';
            if (mobileAdminDashLink) mobileAdminDashLink.style.display = 'none';
            
            // Show public navigation for non-authenticated users
            navbarLinks.forEach(link => link.style.display = 'block');
            mobileNavLinks.forEach(link => link.style.display = 'block');
            
            // Restore logo link to home
            const logoLinks = document.querySelectorAll('.navbar-logo, .logo-link, a[href*="html"].logo');
            logoLinks.forEach(link => {
                link.href = 'index.html';
            });
        }
    }

    async requireAuth(requiredRole = null) {
        // Wait for initialization to complete
        await this.init();

        if (!this.isAuthenticated()) {
            showToast('Please login to continue', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return false;
        }

        if (requiredRole && !this.hasRole(requiredRole)) {
            showToast('You do not have permission to access this page', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return false;
        }

        return true;
    }
}

// Create global auth instance
const authManager = new AuthManager();

// Initialize auth on page load
authManager.init();

export default authManager;

// Setup auth event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            openLoginModal();
        });
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            openRegisterModal();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.logout();
        });
    }

    // Mobile logout button
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.logout();
        });
    }

    // Mobile login button
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    if (loginBtnMobile) {
        loginBtnMobile.addEventListener('click', () => {
            openLoginModal();
        });
    }

    // Mobile register button
    const registerBtnMobile = document.getElementById('registerBtnMobile');
    if (registerBtnMobile) {
        registerBtnMobile.addEventListener('click', () => {
            openRegisterModal();
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const success = await authManager.login(email, password);
            if (success) {
                closeLoginModal();
                // Redirect based on role
                if (authManager.hasRole('admin')) {
                    window.location.href = 'admin-dashboard.html';
                } else if (authManager.hasRole('owner')) {
                    window.location.href = 'owner-dashboard.html';
                }
            }
        });
    }

    // Register form removed - handled in main.js to avoid duplicate listeners

    // OTP form
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = document.getElementById('otpInput').value;

            const success = await authManager.verifyOTP(otp);
            if (success) {
                closeOtpModal();
                // Redirect based on role
                if (authManager.hasRole('owner')) {
                    window.location.href = 'owner-dashboard.html';
                } else {
                    window.location.href = 'turfs.html';
                }
            }
        });
    }

    // Resend OTP button
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await authManager.sendOTP();
        });
    }

    // Modal controls
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const otpModal = document.getElementById('otpModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const closeOtpModal = document.getElementById('closeOtpModal');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');

    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
    }

    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', () => {
            registerModal.classList.remove('active');
        });
    }

    if (closeOtpModal) {
        closeOtpModal.addEventListener('click', () => {
            otpModal.classList.remove('active');
        });
    }

    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.remove('active');
            registerModal.classList.add('active');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    }

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
        }
        if (e.target === registerModal) {
            registerModal.classList.remove('active');
        }
        if (e.target === otpModal) {
            otpModal.classList.remove('active');
        }
    });
});

// Modal functions
export function openLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.add('active');
    }
}

export function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('active');
    }
}

export function openRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.classList.add('active');
    }
}

export function closeRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.classList.remove('active');
    }
}

export function openOtpModal(email) {
    const otpModal = document.getElementById('otpModal');
    const otpEmailDisplay = document.getElementById('otpEmail');
    const otpInput = document.getElementById('otpInput');
    
    if (otpModal) {
        if (otpEmailDisplay && email) {
            otpEmailDisplay.textContent = email;
        }
        if (otpInput) {
            otpInput.value = '';
        }
        otpModal.classList.add('active');
    }
}

export function closeOtpModal() {
    const otpModal = document.getElementById('otpModal');
    if (otpModal) {
        otpModal.classList.remove('active');
    }
}
