import api, { showToast } from './api.js';
import authManager from './auth.js';

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

// Load turfs with filters
async function loadTurfs() {
    const turfsGrid = document.getElementById('turfsGrid');
    const resultCount = document.getElementById('resultCount');

    turfsGrid.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading turfs...</div>';

    try {
        const params = {
            status: 'approved', // Only show approved turfs
            ...currentFilters,
            page: currentPage,
            limit: 12
        };

        console.log('Loading turfs with params:', params);
        const response = await api.getTurfs(params);
        console.log('Response:', response);
        
        if (response.data && response.data.length > 0) {
            turfsGrid.innerHTML = response.data.map(turf => createTurfCard(turf)).join('');
            
            // Update result count
            if (resultCount) {
                resultCount.textContent = response.total || response.data.length;
            }
        } else {
            turfsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No turfs found</h3><p>Try adjusting your filters</p></div>';
            if (resultCount) resultCount.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
        turfsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Error loading turfs</h3><p>Please try again later</p></div>';
        if (resultCount) resultCount.textContent = '0';
    }
}

// Create turf card - Premium Design
function createTurfCard(turf) {
    const primaryImage = turf.images && turf.images.length > 0 
        ? (turf.images.find(img => img.isPrimary)?.url || turf.images[0].url)
        : 'https://placehold.co/400x300/34A87E/white?text=Turf+Image';

    const rating = turf.rating?.average || 0;
    const ratingCount = turf.rating?.count || 0;

    return `
        <div class="turf-card-discover" onclick="window.location.href='turf-details.html?id=${turf._id}'">
            <div class="turf-image-discover">
                <img src="${primaryImage}" alt="${turf.name}"
                     onerror="this.src='https://placehold.co/400x300/34A87E/white?text=Turf+Image'">
                ${turf.featured ? '<span class="turf-badge-discover">Featured</span>' : ''}
            </div>
            <div class="turf-content-discover">
                <h3 class="turf-name-discover">${turf.name}</h3>
                <div class="turf-location-discover">
                    <i class="fas fa-map-marker-alt"></i>
                    ${turf.address.city}, ${turf.address.state}
                </div>
                <div class="turf-footer-discover">
                    <div class="turf-price-discover">
                        <div class="price">₹${turf.pricing.hourlyRate}<span>/hr</span></div>
                    </div>
                    <button class="btn-book" onclick="event.stopPropagation(); window.location.href='turf-details.html?id=${turf._id}'">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Apply filters
function applyFilters() {
    currentFilters = {};

    const name = document.getElementById('nameFilter')?.value.trim();
    const city = document.getElementById('cityFilter')?.value.trim();
    const sport = document.getElementById('sportFilter')?.value;

    if (name) currentFilters.search = name; // Search by turf name
    if (city) currentFilters.city = city;
    if (sport) currentFilters.sport = sport;

    console.log('Applying filters:', currentFilters);
    
    currentPage = 1;
    loadTurfs();
    
    // Show feedback
    const filterCount = Object.keys(currentFilters).length;
    if (filterCount > 0) {
        showToast(`Applied ${filterCount} filter${filterCount > 1 ? 's' : ''}`, 'success');
    }
}

// Clear filters
function clearAllFilters() {
    const nameFilter = document.getElementById('nameFilter');
    const cityFilter = document.getElementById('cityFilter');
    const sportFilter = document.getElementById('sportFilter');
    
    if (nameFilter) nameFilter.value = '';
    if (cityFilter) cityFilter.value = '';
    if (sportFilter) sportFilter.value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadTurfs();
    
    showToast('Filters cleared', 'success');
}

// Make functions global for onclick handlers
window.applyFilters = applyFilters;
window.clearAllFilters = clearAllFilters;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth
    authManager.init();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('city')) {
        const cityFilter = document.getElementById('cityFilter');
        if (cityFilter) {
            cityFilter.value = urlParams.get('city');
            currentFilters.city = urlParams.get('city');
        }
    }
    if (urlParams.has('sport')) {
        const sportFilter = document.getElementById('sportFilter');
        if (sportFilter) {
            sportFilter.value = urlParams.get('sport');
            currentFilters.sport = urlParams.get('sport');
        }
    }

    // Add event listeners for Enter key on input fields
    const nameFilter = document.getElementById('nameFilter');
    const cityFilter = document.getElementById('cityFilter');
    
    if (nameFilter) {
        nameFilter.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    if (cityFilter) {
        cityFilter.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    // Load turfs
    loadTurfs();
});
