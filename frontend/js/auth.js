import api, { showToast } from './api.js';

// Auth State Management
class AuthManager {
    constructor() {
        this.user = null;
        this.initialized = false;
        this.initPromise = null;
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            const token = api.getToken();
            if (token) {
                try {
                    const response = await api.getCurrentUser();
                    this.user = response.data;
                    this.initialized = true;
                    this.updateUI();
                } catch (error) {
                    console.error('Failed to get current user:', error);
                    // Don't logout immediately, token might be invalid
                    api.removeToken();
                    this.user = null;
                    this.initialized = true;
                }
            } else {
                this.initialized = true;
            }
        })();

        return this.initPromise;
    }

    async login(email, password) {
        try {
            const response = await api.login({ email, password });
            api.setToken(response.data.token);
            this.user = response.data.user;
            this.updateUI();
            showToast('Login successful!', 'success');
            return true;
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
            return false;
        }
    }

    async register(userData) {
        try {
            const response = await api.register(userData);
            api.setToken(response.data.token);
            this.user = response.data.user;
            this.updateUI();
            showToast('Registration successful!', 'success');
            return true;
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
            return false;
        }
    }

    logout() {
        api.removeToken();
        this.user = null;
        this.updateUI();
        showToast('Logged out successfully', 'success');
        window.location.href = 'index.html';
    }

    isAuthenticated() {
        return !!this.user;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const myBookingsLink = document.getElementById('myBookingsLink');
        const ownerDashLink = document.getElementById('ownerDashLink');
        const adminDashLink = document.getElementById('adminDashLink');

        if (this.isAuthenticated()) {
            // Hide login/register buttons
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';

            // Show user menu
            if (userMenu) userMenu.style.display = 'block';
            if (userAvatar) {
                userAvatar.src = this.user.profileImage || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name)}&background=10b981&color=fff`;
                userAvatar.alt = this.user.name;
            }

            // Show role-specific links
            if (myBookingsLink && (this.hasRole('user') || this.hasRole('owner'))) {
                myBookingsLink.style.display = 'block';
                myBookingsLink.href = 'my-bookings.html';
            }
            if (ownerDashLink && this.hasRole('owner')) {
                ownerDashLink.style.display = 'block';
                ownerDashLink.href = 'owner-dashboard.html';
            }
            if (adminDashLink && this.hasRole('admin')) {
                adminDashLink.style.display = 'block';
                adminDashLink.href = 'admin-dashboard.html';
            }
        } else {
            // Show login/register buttons
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (registerBtn) registerBtn.style.display = 'inline-flex';

            // Hide user menu
            if (userMenu) userMenu.style.display = 'none';

            // Hide all role-specific links
            if (myBookingsLink) myBookingsLink.style.display = 'none';
            if (ownerDashLink) ownerDashLink.style.display = 'none';
            if (adminDashLink) adminDashLink.style.display = 'none';
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

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                name: document.getElementById('registerName').value,
                email: document.getElementById('registerEmail').value,
                phone: document.getElementById('registerPhone').value,
                password: document.getElementById('registerPassword').value,
                role: document.getElementById('registerRole').value
            };

            const success = await authManager.register(userData);
            if (success) {
                closeRegisterModal();
                // Redirect based on role
                if (authManager.hasRole('owner')) {
                    window.location.href = 'owner-dashboard.html';
                } else {
                    window.location.href = 'turfs.html';
                }
            }
        });
    }

    // Modal controls
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
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
