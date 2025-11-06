// API Configuration
// Use localhost for development, production URL for deployment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'
    : 'https://turfspot.onrender.com/api';

// API Service Class
class APIService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('token');
    }

    // Set auth token
    setToken(token) {
        localStorage.setItem('token', token);
    }

    // Remove auth token
    removeToken() {
        localStorage.removeItem('token');
    }

    // Get headers with optional auth
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.auth !== false)
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // AUTH ENDPOINTS
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            auth: false
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            auth: false
        });
    }

    async googleAuth(tokenData) {
        return this.request('/auth/google', {
            method: 'POST',
            body: JSON.stringify(tokenData),
            auth: false
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(passwordData) {
        return this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    async sendOTP() {
        return this.request('/auth/send-otp', {
            method: 'POST'
        });
    }

    async verifyOTP(otpData) {
        return this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify(otpData)
        });
    }

    // TURF ENDPOINTS
    async getTurfs(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/turfs${query ? '?' + query : ''}`);
    }

    async getTurfById(id) {
        return this.request(`/turfs/${id}`);
    }

    async getAvailableSlots(turfId, date) {
        return this.request(`/turfs/${turfId}/available-slots?date=${date}`);
    }

    async createTurf(turfData) {
        return this.request('/turfs', {
            method: 'POST',
            body: JSON.stringify(turfData)
        });
    }

    async updateTurf(id, turfData) {
        return this.request(`/turfs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(turfData)
        });
    }

    async deleteTurf(id) {
        return this.request(`/turfs/${id}`, {
            method: 'DELETE'
        });
    }

    async getMyTurfs() {
        return this.request('/turfs/owner/my-turfs');
    }

    // BOOKING ENDPOINTS
    async createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    async verifyPayment(bookingId, paymentData) {
        return this.request(`/bookings/${bookingId}/verify-payment`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async getMyBookings(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/bookings/my-bookings${query ? '?' + query : ''}`);
    }

    async getBookingById(id) {
        return this.request(`/bookings/${id}`);
    }

    async cancelBooking(id, reason) {
        return this.request(`/bookings/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    async getOwnerBookings(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/bookings/owner/bookings${query ? '?' + query : ''}`);
    }

    // ADMIN ENDPOINTS
    async getDashboardStats() {
        return this.request('/admin/dashboard');
    }

    async getPendingTurfs(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/admin/turfs/pending${query ? '?' + query : ''}`);
    }

    async approveTurf(id) {
        return this.request(`/admin/turfs/${id}/approve`, {
            method: 'PUT'
        });
    }

    async rejectTurf(id, reason) {
        return this.request(`/admin/turfs/${id}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    async suspendTurf(id, reason) {
        return this.request(`/admin/turfs/${id}/suspend`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    async getAllUsers(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/admin/users${query ? '?' + query : ''}`);
    }

    async updateUserStatus(id, isActive) {
        return this.request(`/admin/users/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });
    }

    async getAllBookings(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/admin/bookings${query ? '?' + query : ''}`);
    }

    async getPendingPayouts() {
        return this.request('/admin/payouts/pending');
    }

    async markBookingAsPaid(bookingId, payoutData) {
        return this.request(`/admin/bookings/${bookingId}/payout`, {
            method: 'PUT',
            body: JSON.stringify(payoutData)
        });
    }

    async getPayoutHistory(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/admin/payouts/history${query ? '?' + query : ''}`);
    }

    // ANALYTICS ENDPOINTS
    async getOwnerAnalytics(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/analytics/owner${query ? '?' + query : ''}`);
    }

    async getRevenueReport(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/analytics/owner/revenue${query ? '?' + query : ''}`);
    }

    async getBookingCalendar(queryParams = {}) {
        const query = new URLSearchParams(queryParams).toString();
        return this.request(`/analytics/owner/calendar${query ? '?' + query : ''}`);
    }

    // SUBSCRIPTION ENDPOINTS
    async getSubscriptionPlans() {
        return this.request('/subscriptions/plans', { auth: false });
    }

    async createSubscription(subscriptionData) {
        return this.request('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(subscriptionData)
        });
    }

    async uploadSubscriptionPaymentProof(subscriptionId, paymentProofUrl) {
        return this.request(`/subscriptions/${subscriptionId}/payment-proof`, {
            method: 'POST',
            body: JSON.stringify({ paymentProofUrl })
        });
    }

    async getMySubscription() {
        return this.request('/subscriptions/my-subscription');
    }

    async cancelSubscription(subscriptionId, reason) {
        return this.request(`/subscriptions/${subscriptionId}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    async getAllSubscriptions() {
        return this.request('/subscriptions/admin/all');
    }

    async verifySubscriptionPayment(subscriptionId, approved, reason = '') {
        return this.request(`/subscriptions/admin/${subscriptionId}/verify`, {
            method: 'PUT',
            body: JSON.stringify({ approved, reason })
        });
    }

    // TIER PAYMENT ENDPOINTS
    async uploadTierPaymentScreenshot(bookingId, screenshotUrl) {
        return this.request(`/bookings/${bookingId}/tier-payment`, {
            method: 'POST',
            body: JSON.stringify({ screenshotUrl })
        });
    }

    async verifyTierPayment(bookingId, approved, reason = '') {
        return this.request(`/bookings/${bookingId}/verify-tier-payment`, {
            method: 'PUT',
            body: JSON.stringify({ approved, reason })
        });
    }

    async getPendingTierVerifications() {
        return this.request('/bookings/owner/pending-verifications');
    }
}

// Create and export API instance
const api = new APIService();
export default api;

// Utility functions
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

export function formatTime(time) {
    if (!time) return '';
    return time;
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
}

export function formatTime12Hour(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTimeSlot(startTime, endTime) {
    return `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;
}

export function formatDateTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
