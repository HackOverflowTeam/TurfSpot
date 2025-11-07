/* ========================================
   TURFSPOT PROFILE PAGE JAVASCRIPT
   Handles profile data loading and display
   ======================================== */

import authManager from './auth.js';
import api from './api.js';

class ProfilePage {
    constructor() {
        this.authManager = authManager;
        this.init();
    }

    async init() {
        // Check authentication
        if (!this.authManager.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Load profile data
        await this.loadProfile();
        
        // Load bookings data
        await this.loadBookingsData();
    }

    async loadProfile() {
        try {
            // Fetch user profile from API using the api service
            const response = await api.getCurrentUser();
            
            // Extract user data from response
            const userData = response.data || response;
            
            // Update profile UI with real data
            this.updateProfileUI(userData);
            
            // Remove skeleton loading states
            this.removeSkeletonLoading();
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Unable to fetch profile data. Please try again later.');
            this.showFallbackData();
        }
    }

    updateProfileUI(user) {
        // Update profile name
        const profileNameSpan = document.querySelector('.profile-name span');
        if (profileNameSpan) {
            profileNameSpan.textContent = user.name || user.username || 'User';
            profileNameSpan.classList.remove('skeleton', 'skeleton-text');
            profileNameSpan.style.width = 'auto';
            profileNameSpan.style.display = 'inline';
        }

        // Update avatar with initials
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            const name = user.name || user.username || 'User';
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            profileAvatar.classList.remove('skeleton');
            profileAvatar.innerHTML = `<span style="font-size: 3rem; font-weight: 700; color: white;">${initials}</span>`;
        }

        // Update email
        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail) {
            profileEmail.textContent = user.email || 'Not available';
            profileEmail.classList.remove('skeleton', 'skeleton-text');
            profileEmail.style.width = 'auto';
            profileEmail.style.display = 'block';
        }

        // Update member since
        const memberSince = document.getElementById('profileMemberSince');
        if (memberSince) {
            let year = new Date().getFullYear();
            
            if (user.createdAt) {
                year = new Date(user.createdAt).getFullYear();
            }
            
            memberSince.textContent = `Member since ${year}`;
            memberSince.classList.remove('skeleton', 'skeleton-text-small');
            memberSince.style.width = 'auto';
            memberSince.style.display = 'block';
        }
    }

    async loadBookingsData() {
        try {
            // Fetch bookings using the api service
            const response = await api.getMyBookings();
            
            // Extract bookings array from response (response.data contains the array)
            const bookings = response.data || response || [];
            
            console.log('All bookings:', bookings);
            
            // Filter active bookings
            // A booking is active if:
            // 1. Status is 'confirmed' or 'pending'
            // 2. Payment status is 'completed' or 'pending'
            // 3. Booking date + time is in the future
            const now = new Date();
            const activeBookings = bookings.filter(booking => {
                // Check booking status
                const bookingStatus = booking.status;
                const isStatusActive = bookingStatus === 'confirmed' || bookingStatus === 'pending';
                
                // Check payment status
                const paymentStatus = booking.payment?.status;
                const isPaymentActive = paymentStatus === 'completed' || paymentStatus === 'pending';
                
                // Check if booking date is in the future
                let isFutureBooking = false;
                if (booking.bookingDate) {
                    const bookingDate = new Date(booking.bookingDate);
                    
                    // Get the end time from timeSlot or timeSlots
                    const endTime = booking.timeSlot?.endTime || 
                                   (booking.timeSlots && booking.timeSlots.length > 0 ? 
                                    booking.timeSlots[booking.timeSlots.length - 1].endTime : null);
                    
                    if (endTime) {
                        // Parse time (format: "HH:MM")
                        const [hours, minutes] = endTime.split(':').map(Number);
                        const bookingDateTime = new Date(bookingDate);
                        bookingDateTime.setHours(hours, minutes, 0, 0);
                        
                        isFutureBooking = bookingDateTime > now;
                    } else {
                        // If no end time, just check if date is today or future
                        const bookingDateOnly = new Date(bookingDate);
                        bookingDateOnly.setHours(0, 0, 0, 0);
                        const todayDateOnly = new Date(now);
                        todayDateOnly.setHours(0, 0, 0, 0);
                        
                        isFutureBooking = bookingDateOnly >= todayDateOnly;
                    }
                }
                
                return isStatusActive && isPaymentActive && isFutureBooking;
            });

            console.log('Active bookings:', activeBookings);

            // Update bookings count badge
            const bookingsBadge = document.getElementById('bookingsBadge');
            if (bookingsBadge) {
                const badgeContent = bookingsBadge.querySelector('.skeleton-badge');
                if (badgeContent) {
                    badgeContent.classList.remove('skeleton', 'skeleton-badge');
                    badgeContent.textContent = activeBookings.length;
                    badgeContent.style.width = 'auto';
                    badgeContent.style.display = 'inline';
                } else {
                    bookingsBadge.textContent = activeBookings.length;
                }
            }

            // Update sports tags based on bookings
            if (activeBookings.length > 0) {
                this.updateSportsTags(activeBookings);
            } else {
                // Show "No active bookings" message
                const bookingsSports = document.getElementById('bookingsSports');
                if (bookingsSports) {
                    bookingsSports.innerHTML = `
                        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem; color: white;">
                            No active bookings yet
                        </p>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            this.showNoBookings();
        }
    }

    updateSportsTags(bookings) {
        const bookingsSports = document.getElementById('bookingsSports');
        if (!bookingsSports) return;

        console.log('Updating sports tags for bookings:', bookings);

        // Extract unique sports from bookings
        const sportsSet = new Set();
        bookings.forEach(booking => {
            // Check both booking.sport and booking.turf.sport
            const sport = booking.sport || (booking.turf && booking.turf.sport);
            if (sport) {
                sportsSet.add(sport.toLowerCase());
            }
        });
        
        const sports = Array.from(sportsSet);
        
        console.log('Unique sports found:', sports);
        
        // Sport icon mapping (lowercase keys)
        const sportIcons = {
            'football': 'fa-futbol',
            'cricket': 'fa-baseball-ball',
            'badminton': 'fa-shuttlecock',
            'basketball': 'fa-basketball-ball',
            'tennis': 'fa-table-tennis',
            'volleyball': 'fa-volleyball-ball',
            'hockey': 'fa-hockey-puck'
        };

        // Create sport tags (max 3)
        const displaySports = sports.slice(0, 3);
        
        if (displaySports.length > 0) {
            bookingsSports.innerHTML = displaySports.map(sport => {
                // Capitalize first letter for display
                const displayName = sport.charAt(0).toUpperCase() + sport.slice(1);
                return `
                    <div class="sport-tag">
                        <i class="fas ${sportIcons[sport] || 'fa-futbol'}"></i>
                        <span>${displayName}</span>
                    </div>
                `;
            }).join('');
        } else {
            // If we have active bookings but no sports data, show count
            bookingsSports.innerHTML = `
                <p style="margin: 0; opacity: 0.9; font-size: 0.95rem; color: white;">
                    ${bookings.length} active booking${bookings.length !== 1 ? 's' : ''}
                </p>
            `;
        }
    }

    showNoBookings() {
        const bookingsBadge = document.getElementById('bookingsBadge');
        if (bookingsBadge) {
            const badgeContent = bookingsBadge.querySelector('.skeleton-badge');
            if (badgeContent) {
                badgeContent.classList.remove('skeleton', 'skeleton-badge');
                badgeContent.textContent = '0';
                badgeContent.style.width = 'auto';
                badgeContent.style.display = 'inline';
            } else {
                bookingsBadge.textContent = '0';
            }
        }

        const bookingsSports = document.getElementById('bookingsSports');
        if (bookingsSports) {
            bookingsSports.innerHTML = `
                <p style="margin: 0; opacity: 0.9; font-size: 0.95rem; color: white;">
                    No active bookings yet
                </p>
            `;
        }
    }

    removeSkeletonLoading() {
        // Remove skeleton loading classes
        document.querySelectorAll('.skeleton-loading').forEach(el => {
            el.classList.remove('skeleton-loading');
            el.classList.add('data-loaded');
        });
    }

    showFallbackData() {
        // Show fallback data if API fails
        const user = this.authManager.user;
        
        if (user) {
            this.updateProfileUI(user);
            this.removeSkeletonLoading();
        } else {
            // Show generic fallback
            const profileNameSpan = document.querySelector('.profile-name span');
            if (profileNameSpan) {
                profileNameSpan.textContent = 'User';
                profileNameSpan.classList.remove('skeleton', 'skeleton-text');
            }

            const profileEmail = document.getElementById('profileEmail');
            if (profileEmail) {
                profileEmail.textContent = 'Not available';
                profileEmail.classList.remove('skeleton', 'skeleton-text');
            }

            const memberSince = document.getElementById('profileMemberSince');
            if (memberSince) {
                memberSince.textContent = `Member since ${new Date().getFullYear()}`;
                memberSince.classList.remove('skeleton', 'skeleton-text-small');
            }

            this.removeSkeletonLoading();
        }
    }

    showError(message) {
        const container = document.querySelector('.profile-container');
        const header = document.querySelector('.page-header');
        
        if (container && header) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            `;
            container.insertBefore(errorDiv, header.nextSibling);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.opacity = '0';
                errorDiv.style.transition = 'opacity 0.3s ease';
                setTimeout(() => errorDiv.remove(), 300);
            }, 5000);
        }
    }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    new ProfilePage();
});

export default ProfilePage;
