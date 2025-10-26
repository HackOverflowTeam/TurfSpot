import api, { showToast } from './api.js';
import authManager from './auth.js';

// Load popular turfs on homepage
async function loadPopularTurfs() {
    const turfsGrid = document.getElementById('popularTurfs');
    const loader = document.getElementById('turfsLoader');

    try {
        const response = await api.getTurfs({ limit: 6, sortBy: 'rating.average', order: 'desc' });
        
        if (loader) loader.style.display = 'none';
        
        if (response.data && response.data.length > 0) {
            turfsGrid.innerHTML = response.data.map(turf => createTurfCard(turf)).join('');
        } else {
            turfsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No turfs available at the moment.</p>';
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
        if (loader) loader.style.display = 'none';
        turfsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1; color: var(--danger);">Failed to load turfs. Please try again.</p>';
    }
}

// Create turf card HTML
function createTurfCard(turf) {
    const primaryImage = turf.images && turf.images.length > 0 
        ? turf.images.find(img => img.isPrimary)?.url || turf.images[0].url
        : 'https://via.placeholder.com/400x300?text=Turf+Image';

    const rating = turf.rating?.average || 0;
    const ratingCount = turf.rating?.count || 0;

    return `
        <div class="turf-card" onclick="window.location.href='turf-details.html?id=${turf._id}'">
            <img src="${primaryImage}" alt="${turf.name}" class="turf-card-image" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Turf+Image'">
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
                </div>
                <div class="turf-price">
                    <div>
                        <div class="price-label">Starting from</div>
                        <div class="price-amount">₹${turf.pricing.hourlyRate}</div>
                    </div>
                    <button class="btn btn-primary" onclick="event.stopPropagation();">Book Now</button>
                </div>
            </div>
        </div>
    `;
}

// Hero search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const becomeOwnerBtn = document.getElementById('becomeOwnerBtn');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const city = document.getElementById('citySearch').value;
            const sport = document.getElementById('sportSearch').value;
            
            const params = new URLSearchParams();
            if (city) params.set('city', city);
            if (sport) params.set('sport', sport);
            
            window.location.href = `turfs.html?${params.toString()}`;
        });
    }

    // Enter key for search
    const citySearch = document.getElementById('citySearch');
    if (citySearch) {
        citySearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    if (becomeOwnerBtn) {
        becomeOwnerBtn.addEventListener('click', () => {
            if (authManager.isAuthenticated()) {
                if (authManager.hasRole('owner')) {
                    window.location.href = 'owner-dashboard.html';
                } else {
                    showToast('Please register as an owner to list your turf', 'info');
                }
            } else {
                const registerModal = document.getElementById('registerModal');
                if (registerModal) {
                    registerModal.classList.add('active');
                    // Set role to owner
                    const roleSelect = document.getElementById('registerRole');
                    if (roleSelect) roleSelect.value = 'owner';
                }
            }
        });
    }

    // Load popular turfs
    loadPopularTurfs();
});
