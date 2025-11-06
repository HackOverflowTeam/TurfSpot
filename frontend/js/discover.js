import api, { showToast, formatCurrency } from './api.js';
import authManager from './auth.js';

let allTurfs = [];
let filteredTurfs = [];

// Load turfs from API
async function loadTurfs() {
    const grid = document.getElementById('turfsGrid');
    const loader = document.getElementById('turfsLoader');
    
    if (loader) loader.style.display = 'flex';
    if (grid) grid.innerHTML = '';

    try {
        const response = await api.getTurfs();
        allTurfs = response.data || [];
        filteredTurfs = [...allTurfs];
        
        if (loader) loader.style.display = 'none';
        
        if (allTurfs.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><h3>No Turfs Available</h3><p>Check back later for new turfs</p></div>';
            return;
        }
        
        displayTurfs(filteredTurfs);
        updateResultCount();
    } catch (error) {
        console.error('Error loading turfs:', error);
        if (loader) loader.style.display = 'none';
        if (grid) grid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Error Loading Turfs</h3><p>Please try again later</p></div>';
        showToast('Failed to load turfs', 'error');
    }
}

// Display turfs
function displayTurfs(turfs) {
    const grid = document.getElementById('turfsGrid');
    if (!grid) return;
    
    grid.innerHTML = turfs.map(turf => createTurfCard(turf)).join('');
}

// Create turf card
function createTurfCard(turf) {
    const primaryImage = turf.images?.find(img => img.isPrimary)?.url || 
                        turf.images?.[0]?.url || 
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop';
    
    const rating = turf.rating?.average || 0;
    const reviewCount = turf.rating?.count || 0;
    const sports = turf.sportsSupported?.slice(0, 3).join(', ') || 'Various Sports';
    
    return `
        <div class="turf-card-discover" data-sport="${turf.sportsSupported?.[0]?.toLowerCase() || ''}">
            <div class="turf-image-discover">
                <img src="${primaryImage}" alt="${turf.name}" 
                     onerror="this.src='https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop'">
                <div class="turf-badge-discover">${turf.status === 'approved' ? 'Available' : 'Pending'}</div>
                <button class="btn-favorite-discover" onclick="toggleFavorite('${turf._id}')">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="turf-content-discover">
                <h3 class="turf-name-discover">${turf.name}</h3>
                <div class="turf-location-discover">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${turf.address.city}, ${turf.address.state}</span>
                </div>
                <div class="turf-sports-discover">
                    <i class="fas fa-futbol"></i>
                    <span>${sports}</span>
                </div>
                <div class="turf-rating-discover">
                    <i class="fas fa-star"></i>
                    <span>${rating.toFixed(1)}</span>
                    <span class="reviews-discover">(${reviewCount} reviews)</span>
                </div>
                <div class="turf-amenities-discover">
                    ${(turf.amenities || []).slice(0, 3).map(amenity => 
                        `<span class="amenity-tag">${amenity}</span>`
                    ).join('')}
                </div>
                <div class="turf-footer-discover">
                    <div class="turf-price-discover">
                        <span class="price-label">Starting from</span>
                        <span class="price">${formatCurrency(turf.pricing.hourlyRate)}/hr</span>
                    </div>
                    <a href="turf-details.html?id=${turf._id}" class="btn-book-discover">
                        <i class="fas fa-calendar-check"></i>
                        Book Now
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('turfNameFilter').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('sportFilter').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('nearMe').checked = false;
    
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    filteredTurfs = [...allTurfs];
    displayTurfs(filteredTurfs);
    updateResultCount();
}

// Apply filters
function applyFilters() {
    const turfName = document.getElementById('turfNameFilter').value.toLowerCase();
    const city = document.getElementById('cityFilter').value.toLowerCase();
    const sport = document.getElementById('sportFilter').value.toLowerCase();
    const minPrice = parseInt(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseInt(document.getElementById('maxPrice').value) || Infinity;
    
    const selectedAmenities = [];
    const amenityCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
    amenityCheckboxes.forEach(checkbox => selectedAmenities.push(checkbox.value.toLowerCase()));
    
    filteredTurfs = allTurfs.filter(turf => {
        // Filter by name
        if (turfName && !turf.name.toLowerCase().includes(turfName)) {
            return false;
        }
        
        // Filter by city
        if (city && !turf.address.city.toLowerCase().includes(city)) {
            return false;
        }
        
        // Filter by sport
        if (sport && !turf.sportsSupported.some(s => s.toLowerCase() === sport)) {
            return false;
        }
        
        // Filter by price
        const price = turf.pricing.hourlyRate;
        if (price < minPrice || price > maxPrice) {
            return false;
        }
        
        // Filter by amenities
        if (selectedAmenities.length > 0) {
            const turfAmenities = (turf.amenities || []).map(a => a.toLowerCase());
            const hasAllAmenities = selectedAmenities.every(amenity => 
                turfAmenities.some(ta => ta.includes(amenity) || amenity.includes(ta))
            );
            if (!hasAllAmenities) {
                return false;
            }
        }
        
        return true;
    });
    
    displayTurfs(filteredTurfs);
    updateResultCount();
}

// Update result count
function updateResultCount() {
    const countElement = document.getElementById('resultCount');
    if (countElement) {
        countElement.textContent = filteredTurfs.length;
    }
}

// Sort turfs
function sortTurfs(sortValue) {
    const sorted = [...filteredTurfs];
    
    switch(sortValue) {
        case 'price-low':
            sorted.sort((a, b) => a.pricing.hourlyRate - b.pricing.hourlyRate);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.pricing.hourlyRate - a.pricing.hourlyRate);
            break;
        case 'rating':
            sorted.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
            break;
        case 'popular':
            sorted.sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0));
            break;
        case 'newest':
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    displayTurfs(sorted);
}

// Toggle favorite
window.toggleFavorite = function(turfId) {
    showToast('Favorites feature coming soon!', 'info');
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth
    await authManager.init();
    
    // Load turfs
    loadTurfs();
    
    // Event listeners for filters
    document.getElementById('turfNameFilter')?.addEventListener('input', applyFilters);
    document.getElementById('cityFilter')?.addEventListener('input', applyFilters);
    document.getElementById('sportFilter')?.addEventListener('change', applyFilters);
    document.getElementById('minPrice')?.addEventListener('input', applyFilters);
    document.getElementById('maxPrice')?.addEventListener('input', applyFilters);
    
    // Sort dropdown
    document.getElementById('sortBy')?.addEventListener('change', function() {
        sortTurfs(this.value);
    });
    
    // Amenity checkboxes
    const amenityCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    amenityCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
    
    // Near me
    document.getElementById('nearMe')?.addEventListener('change', function() {
        if (this.checked) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        showToast('Location detected! Filtering by distance...', 'success');
                        // TODO: Implement distance-based filtering
                    },
                    (error) => {
                        showToast('Unable to get your location', 'error');
                        this.checked = false;
                    }
                );
            } else {
                showToast('Geolocation not supported', 'error');
                this.checked = false;
            }
        }
    });
});

// Export for global access
window.clearAllFilters = clearAllFilters;
window.applyFilters = applyFilters;
