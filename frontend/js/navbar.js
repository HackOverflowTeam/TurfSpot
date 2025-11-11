/* ========================================
   TURFSPOT NAVBAR JAVASCRIPT
   Handles interactions, responsive behavior
   ======================================== */

class TurfSpotNavbar {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.navbarLinks = document.querySelectorAll('.navbar-link');
        this.mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
        this.userMenu = document.querySelector('.user-menu');
        this.userAvatar = document.querySelector('.user-avatar');
        this.userName = document.querySelector('.user-name');
        this.navbarDropdown = document.querySelector('.navbar-dropdown');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.loginBtnMobile = document.getElementById('loginBtnMobile');
        this.registerBtnMobile = document.getElementById('registerBtnMobile');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.logoutBtnMobile = document.getElementById('logoutBtnMobile');

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.setActiveLink();
        this.handleResponsive();
    }

    // ==================== Event Listeners ====================

    attachEventListeners() {
        // Hamburger menu toggle
        if (this.hamburger) {
            this.hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileMenu();
            });
        }

        // Mobile menu close button
        const mobileMenuClose = document.getElementById('mobileMenuClose');
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeMobileMenu();
            });
        }

        // Close mobile menu when link is clicked
        this.mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // User menu dropdown
        if (this.userAvatar) {
            this.userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown();
            });
        }

        if (this.userName) {
            this.userName.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.userMenu?.contains(e.target)) {
                this.closeUserDropdown();
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.mobileMenu?.classList.contains('active') && 
                !this.mobileMenu?.contains(e.target) && 
                !this.hamburger?.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Set active link on click
        this.navbarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.navbarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        this.mobileMenuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.mobileMenuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Handle ESC key to close menus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
                this.closeUserDropdown();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResponsive();
        });
    }

    // ==================== Mobile Menu ====================

    toggleMobileMenu() {
        if (this.mobileMenu?.classList.contains('active')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        if (!this.mobileMenu || !this.hamburger) return;
        
        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.mobile-menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-menu-overlay';
            document.body.appendChild(overlay);
            
            // Click overlay to close
            overlay.addEventListener('click', () => this.closeMobileMenu());
        }
        
        this.mobileMenu.classList.add('active');
        this.hamburger.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('mobile-menu-open');
        
        // Animate menu items
        this.animateMobileMenuItems();
    }

    closeMobileMenu() {
        if (!this.mobileMenu || !this.hamburger) return;
        
        const overlay = document.querySelector('.mobile-menu-overlay');
        
        this.mobileMenu.classList.remove('active');
        this.hamburger.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    }

    animateMobileMenuItems() {
        const items = this.mobileMenu?.querySelectorAll('.mobile-menu-link');
        items?.forEach((item, index) => {
            item.style.animation = `none`;
            item.offsetHeight; // Trigger reflow
            item.style.animation = `slideInFromLeft 0.3s ease forwards`;
            item.style.animationDelay = `${index * 0.05}s`;
        });
    }

    // ==================== User Dropdown ====================

    toggleUserDropdown() {
        if (this.userMenu?.classList.contains('active')) {
            this.closeUserDropdown();
        } else {
            this.openUserDropdown();
        }
    }

    openUserDropdown() {
        if (!this.userMenu) return;
        this.userMenu.classList.add('active');
    }

    closeUserDropdown() {
        if (!this.userMenu) return;
        this.userMenu.classList.remove('active');
    }

    // ==================== Active Link Management ====================

    setActiveLink() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';

        // Set active for desktop menu
        this.navbarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || href === '.' || 
                (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Set active for mobile menu
        this.mobileMenuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || href === '.' || 
                (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ==================== Responsive Handling ====================

    handleResponsive() {
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
            // Close mobile menu on desktop
            this.closeMobileMenu();
        }

        // Adjust navbar based on screen size
        if (window.innerWidth <= 480) {
            document.documentElement.style.setProperty('--navbar-height', '60px');
        } else if (window.innerWidth <= 768) {
            document.documentElement.style.setProperty('--navbar-height', '65px');
        } else {
            document.documentElement.style.setProperty('--navbar-height', '70px');
        }
    }

    // ==================== Auth UI Updates ====================

    updateAuthUI(user) {
        const userMenu = document.querySelector('.user-menu');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const loginBtnMobile = document.getElementById('loginBtnMobile');
        const registerBtnMobile = document.getElementById('registerBtnMobile');
        const logoutBtnMobile = document.getElementById('logoutBtnMobile');

        if (user) {
            // User is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (loginBtnMobile) loginBtnMobile.style.display = 'none';
            if (registerBtnMobile) registerBtnMobile.style.display = 'none';
            if (logoutBtnMobile) logoutBtnMobile.style.display = 'flex';

            // Show user menu
            if (userMenu) {
                userMenu.style.display = 'flex';
                const avatar = userMenu.querySelector('.user-avatar');
                const userName = userMenu.querySelector('.user-name');
                
                if (avatar && user.profilePicture) {
                    avatar.src = user.profilePicture;
                } else if (avatar) {
                    avatar.src = `https://ui-avatars.com/api/?name=${user.name || 'User'}`;
                }

                if (userName) {
                    userName.textContent = user.name || 'User';
                }
            }

            // Show/hide dashboard links based on role
            this.updateDashboardLinks(user.role);
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.style.display = 'flex';
            if (registerBtn) registerBtn.style.display = 'flex';
            if (loginBtnMobile) loginBtnMobile.style.display = 'flex';
            if (registerBtnMobile) registerBtnMobile.style.display = 'flex';
            if (logoutBtnMobile) logoutBtnMobile.style.display = 'none';

            // Hide user menu
            if (userMenu) {
                userMenu.style.display = 'none';
                this.closeUserDropdown();
            }
            
            // Hide all dashboard links when not logged in
            this.updateDashboardLinks(null);
        }
    }

    updateDashboardLinks(role) {
        // Desktop menu
        const myBookingsLink = document.getElementById('myBookingsLink');
        const ownerDashLink = document.getElementById('ownerDashLink');
        const adminDashLink = document.getElementById('adminDashLink');
        const dropdownMyBookings = document.getElementById('dropdownMyBookings');
        const dropdownOwnerDash = document.getElementById('dropdownOwnerDash');
        const dropdownAdminDash = document.getElementById('dropdownAdminDash');

        // Mobile menu
        const mobileMyBookingsLink = document.getElementById('mobileMyBookingsLink');
        const mobileOwnerDashLink = document.getElementById('mobileOwnerDashLink');
        const mobileAdminDashLink = document.getElementById('mobileAdminDashLink');
        
        // Additional links to hide for owners: Home, Browse Turfs
        const homeLinks = document.querySelectorAll('a[href="index.html"], a[href="./"], a[href="/"]');
        const browseTurfsLinks = document.querySelectorAll('a[href="turfs.html"], a[href="discover.html"]');

        // Hide all by default - remove show class
        [myBookingsLink, ownerDashLink, adminDashLink, dropdownMyBookings, 
         dropdownOwnerDash, dropdownAdminDash, mobileMyBookingsLink, 
         mobileOwnerDashLink, mobileAdminDashLink].forEach(el => {
            if (el) {
                el.classList.remove('show');
                el.style.display = 'none';
            }
        });

        // Show based on role - add show class
        if (role === 'admin') {
            if (adminDashLink) {
                adminDashLink.classList.add('show');
                adminDashLink.style.display = 'inline-block';
            }
            if (dropdownAdminDash) {
                dropdownAdminDash.classList.add('show');
                dropdownAdminDash.style.display = 'block';
            }
            if (mobileAdminDashLink) {
                mobileAdminDashLink.classList.add('show');
                mobileAdminDashLink.style.display = 'block';
            }
            if (myBookingsLink) {
                myBookingsLink.classList.add('show');
                myBookingsLink.style.display = 'inline-block';
            }
            if (dropdownMyBookings) {
                dropdownMyBookings.classList.add('show');
                dropdownMyBookings.style.display = 'block';
            }
            if (mobileMyBookingsLink) {
                mobileMyBookingsLink.classList.add('show');
                mobileMyBookingsLink.style.display = 'block';
            }
            // Show all links for admin
            homeLinks.forEach(link => link.style.display = '');
            browseTurfsLinks.forEach(link => link.style.display = '');
        } else if (role === 'owner') {
            if (ownerDashLink) {
                ownerDashLink.classList.add('show');
                ownerDashLink.style.display = 'inline-block';
            }
            if (dropdownOwnerDash) {
                dropdownOwnerDash.classList.add('show');
                dropdownOwnerDash.style.display = 'block';
            }
            if (mobileOwnerDashLink) {
                mobileOwnerDashLink.classList.add('show');
                mobileOwnerDashLink.style.display = 'block';
            }
            // Hide Home, Browse Turfs, and My Bookings for owners
            homeLinks.forEach(link => {
                if (link.classList.contains('navbar-link') || link.classList.contains('mobile-menu-link')) {
                    link.style.display = 'none';
                }
            });
            browseTurfsLinks.forEach(link => {
                if (link.classList.contains('navbar-link') || link.classList.contains('mobile-menu-link')) {
                    link.style.display = 'none';
                }
            });
            // Don't show My Bookings for owners
        } else if (role === 'user') {
            // Only show My Bookings for regular logged-in users
            if (myBookingsLink) {
                myBookingsLink.classList.add('show');
                myBookingsLink.style.display = 'inline-block';
            }
            if (dropdownMyBookings) {
                dropdownMyBookings.classList.add('show');
                dropdownMyBookings.style.display = 'block';
            }
            if (mobileMyBookingsLink) {
                mobileMyBookingsLink.classList.add('show');
                mobileMyBookingsLink.style.display = 'block';
            }
            // Show all links for regular users
            homeLinks.forEach(link => link.style.display = '');
            browseTurfsLinks.forEach(link => link.style.display = '');
        } else {
            // Not logged in - show all links
            homeLinks.forEach(link => link.style.display = '');
            browseTurfsLinks.forEach(link => link.style.display = '');
        }
        // If no role or not logged in, all links stay hidden
    }

    // ==================== Utility Methods ====================

    highlightLink(href) {
        this.navbarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === href) {
                link.classList.add('active');
            }
        });

        this.mobileMenuLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === href) {
                link.classList.add('active');
            }
        });
    }

    disableNavbar() {
        this.navbarLinks.forEach(link => link.style.pointerEvents = 'none');
        if (this.loginBtn) this.loginBtn.disabled = true;
        if (this.registerBtn) this.registerBtn.disabled = true;
    }

    enableNavbar() {
        this.navbarLinks.forEach(link => link.style.pointerEvents = 'auto');
        if (this.loginBtn) this.loginBtn.disabled = false;
        if (this.registerBtn) this.registerBtn.disabled = false;
    }
}

// ========================================
// Initialize Navbar on DOM Ready
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const navbar = new TurfSpotNavbar();

    // Export for use in other scripts
    window.turfspotNavbar = navbar;
});

// ========================================
// CSS Animation (inject into style tag)
// ========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInFromLeft {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutToLeft {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Prevent flash of hamburger on desktop */
    @media (min-width: 769px) {
        .hamburger {
            display: none !important;
        }
        .mobile-menu {
            display: none !important;
        }
    }
`;
document.head.appendChild(style);

export default TurfSpotNavbar;
