import api, { showToast } from './api.js';
import authManager from './auth.js';

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

// Load turfs with filters
async function loadTurfs() {
    const turfsGrid = document.getElementById('turfsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const pageInfo = document.getElementById('pageInfo');
    const pagination = document.getElementById('pagination');

    turfsGrid.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading turfs...</div>';

    try {
        const params = {
            ...currentFilters,
            page: currentPage,
            limit: 12
        };

        const response = await api.getTurfs(params);
        
        if (response.data && response.data.length > 0) {
            turfsGrid.innerHTML = response.data.map(turf => createTurfCard(turf)).join('');
            
            // Update pagination info
            totalPages = response.pages || 1;
            if (resultsCount) {
                resultsCount.textContent = `Showing ${response.count} of ${response.total} turfs`;
            }
            if (pageInfo) {
                pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            }
            if (pagination) {
                pagination.style.display = totalPages > 1 ? 'flex' : 'none';
            }
        } else {
            turfsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No turfs found</h3><p>Try adjusting your filters</p></div>';
            if (pagination) pagination.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
        turfsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Error loading turfs</h3><p>Please try again later</p></div>';
        if (pagination) pagination.style.display = 'none';
    }
}

// Create turf card
function createTurfCard(turf) {
    const primaryImage = turf.images && turf.images.length > 0 
        ? (turf.images.find(img => img.isPrimary)?.url || turf.images[0].url)
        : 'https://placehold.co/400x300/10b981/white?text=Turf+Image';

    const rating = turf.rating?.average || 0;
    const ratingCount = turf.rating?.count || 0;

    return `
        <div class="turf-card" onclick="window.location.href='turf-details.html?id=${turf._id}'">
            <img src="${primaryImage}" alt="${turf.name}" class="turf-card-image"
                 onerror="this.src='https://placehold.co/400x300/10b981/white?text=Turf+Image'">
            <div class="turf-card-content">
                <div class="turf-card-header">
                    <div>
                        <h3>${turf.name}</h3>
                        <div class="turf-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${turf.address.city}, ${turf.address.state}
                        </div>
                    </div>
                    <div class="turf-rating">
                        <i class="fas fa-star"></i>
                        ${rating.toFixed(1)}
                    </div>
                </div>
                <div class="turf-sports">
                    ${turf.sportsSupported.slice(0, 3).map(sport => 
                        `<span class="sport-tag">${sport}</span>`
                    ).join('')}
                    ${turf.sportsSupported.length > 3 ? `<span class="sport-tag">+${turf.sportsSupported.length - 3}</span>` : ''}
                </div>
                <div class="turf-price">
                    <div>
                        <div class="price-label">Starting from</div>
                        <div class="price-amount">₹${turf.pricing.hourlyRate}</div>
                    </div>
                    <button class="btn btn-primary">View Details</button>
                </div>
            </div>
        </div>
    `;
}

// Apply filters
function applyFilters() {
    currentFilters = {};

    const city = document.getElementById('filterCity').value.trim();
    const sport = document.getElementById('filterSport').value;
    const minPrice = document.getElementById('filterMinPrice').value;
    const maxPrice = document.getElementById('filterMaxPrice').value;
    const nearbyChecked = document.getElementById('filterNearby').checked;

    if (city) currentFilters.city = city;
    if (sport) currentFilters.sport = sport;
    if (minPrice) currentFilters.minPrice = minPrice;
    if (maxPrice) currentFilters.maxPrice = maxPrice;

    // Get selected amenities
    const amenityCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
    const amenities = Array.from(amenityCheckboxes).map(cb => cb.value);
    if (amenities.length > 0) {
        currentFilters.amenities = amenities.join(',');
    }

    // Nearby filter
    if (nearbyChecked) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentFilters.latitude = position.coords.latitude;
                    currentFilters.longitude = position.coords.longitude;
                    currentFilters.maxDistance = 10000; // 10km
                    currentPage = 1;
                    loadTurfs();
                },
                (error) => {
                    showToast('Unable to get your location', 'error');
                    currentPage = 1;
                    loadTurfs();
                }
            );
            return;
        }
    }

    currentPage = 1;
    loadTurfs();
}

// Clear filters
function clearFilters() {
    document.getElementById('filterCity').value = '';
    document.getElementById('filterSport').value = '';
    document.getElementById('filterMinPrice').value = '';
    document.getElementById('filterMaxPrice').value = '';
    document.getElementById('filterNearby').checked = false;
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    currentFilters = {};
    currentPage = 1;
    loadTurfs();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('city')) {
        document.getElementById('filterCity').value = urlParams.get('city');
        currentFilters.city = urlParams.get('city');
    }
    if (urlParams.has('sport')) {
        document.getElementById('filterSport').value = urlParams.get('sport');
        currentFilters.sport = urlParams.get('sport');
    }

    // Event listeners
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    document.getElementById('sortBy').addEventListener('change', (e) => {
        const [sortBy, order] = e.target.value.startsWith('-') 
            ? [e.target.value.substring(1), 'desc']
            : [e.target.value, 'asc'];
        
        currentFilters.sortBy = sortBy;
        currentFilters.order = order;
        currentPage = 1;
        loadTurfs();
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTurfs();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadTurfs();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Load turfs
    loadTurfs();
});
