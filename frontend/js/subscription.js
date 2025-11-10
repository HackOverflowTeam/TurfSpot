import api, { formatCurrency, formatDateTime, showToast } from './api.js';
import authManager from './auth.js';

let currentBillingCycle = 'monthly';
let selectedPlan = null;
let uploadedImageFile = null;

// Calculate end date based on billing cycle
function calculateEndDate(startDate, billingCycle) {
    const start = new Date(startDate);
    const endDate = new Date(start);
    
    if (billingCycle === 'monthly') {
        endDate.setDate(endDate.getDate() + 30);
    } else {
        endDate.setDate(endDate.getDate() + 365);
    }
    
    return endDate;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to initialize
    await authManager.init();
    
    // Check if user is logged in and is an owner
    if (!authManager.isAuthenticated() || authManager.user?.role !== 'owner') {
        showToast('Please login as an owner to access this page', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    await loadCurrentSubscription();
    setupFileUpload();
});

// Load current subscription
async function loadCurrentSubscription() {
    try {
        const response = await api.getMySubscription();
        if (response.data && response.data.subscription) {
            const { subscription, currentTurfCount, canAddMoreTurfs } = response.data;
            // Only display if subscription is active or pending
            if (subscription.status === 'active' || subscription.status === 'pending') {
                displayCurrentSubscription(subscription, currentTurfCount, canAddMoreTurfs);
            }
        }
    } catch (error) {
        console.error('Error loading subscription:', error);
    }
}

// Display current subscription
function displayCurrentSubscription(subscription, turfCount, canAddMore) {
    const container = document.getElementById('currentSubscription');
    const details = document.getElementById('subscriptionDetails');

    const statusClass = subscription.status === 'active' ? 'active' : 
                       subscription.status === 'pending' ? 'pending' : 
                       subscription.status === 'cancelled' ? 'expired' : 'expired';

    // Calculate end date dynamically if startDate exists
    let displayEndDate = subscription.endDate;
    if (subscription.startDate && subscription.billingCycle) {
        const calculatedEndDate = calculateEndDate(subscription.startDate, subscription.billingCycle);
        displayEndDate = calculatedEndDate.toISOString();
    }

    // Format billing cycle for display
    const billingDisplay = subscription.billingCycle === 'annual' ? 'year' : 'month';

    details.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
            <div>
                <strong>Plan:</strong>
                <p style="font-size: 1.2rem; color: var(--primary); margin-top: 0.5rem;">
                    ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                </p>
            </div>
            <div>
                <strong>Status:</strong>
                <p style="margin-top: 0.5rem;">
                    <span class="status-badge ${statusClass}">${subscription.status.toUpperCase()}</span>
                </p>
            </div>
            <div>
                <strong>Billing:</strong>
                <p style="margin-top: 0.5rem;">${formatCurrency(subscription.price)}/${billingDisplay}</p>
            </div>
            <div>
                <strong>Turfs:</strong>
                <p style="margin-top: 0.5rem;">${turfCount} / ${subscription.maxTurfs === -1 ? 'Unlimited' : subscription.maxTurfs}</p>
            </div>
            ${displayEndDate ? `
            <div>
                <strong>Expires:</strong>
                <p style="margin-top: 0.5rem;">${new Date(displayEndDate).toLocaleDateString()}</p>
            </div>
            ` : ''}
        </div>
        ${subscription.status === 'pending' ? `
            <div style="margin-top: 1rem; padding: 1rem; background: var(--warning); color: white; border-radius: 8px;">
                <i class="fas fa-clock"></i> Your subscription is pending admin verification
            </div>
        ` : ''}
        ${!canAddMore ? `
            <div style="margin-top: 1rem; padding: 1rem; background: var(--danger); color: white; border-radius: 8px;">
                <i class="fas fa-exclamation-triangle"></i> You've reached the maximum number of turfs for your plan. Please upgrade to add more turfs.
            </div>
        ` : ''}
    `;

    container.style.display = 'block';
}

// Toggle billing cycle
window.toggleBilling = function(cycle) {
    currentBillingCycle = cycle;
    
    // Update button states
    document.getElementById('monthlyBtn').classList.toggle('active', cycle === 'monthly');
    document.getElementById('annualBtn').classList.toggle('active', cycle === 'annual');
    
    // Update prices and period text
    const basicPeriodEl = document.getElementById('basicPeriod');
    const proPeriodEl = document.getElementById('proPeriod');
    
    if (cycle === 'monthly') {
        document.getElementById('basicPrice').textContent = '699';
        document.getElementById('proPrice').textContent = '1999';
        if (basicPeriodEl) basicPeriodEl.textContent = '/month';
        if (proPeriodEl) proPeriodEl.textContent = '/month';
    } else {
        document.getElementById('basicPrice').textContent = '600';
        document.getElementById('proPrice').textContent = '1500';
        if (basicPeriodEl) basicPeriodEl.textContent = '/year';
        if (proPeriodEl) proPeriodEl.textContent = '/year';
    }
};

// Select a plan
window.selectPlan = async function(plan) {
    selectedPlan = plan;
    
    const prices = {
        basic: { monthly: 699, annual: 600 },
        pro: { monthly: 1999, annual: 1500 }
    };
    
    const planNames = {
        basic: 'Basic Plan',
        pro: 'Pro Plan'
    };
    
    document.getElementById('selectedPlanName').textContent = planNames[plan];
    document.getElementById('selectedPlanAmount').textContent = formatCurrency(prices[plan][currentBillingCycle]);
    
    // Create subscription
    try {
        const response = await api.createSubscription({
            plan,
            billingCycle: currentBillingCycle
        });
        
        if (response.success) {
            // Check if subscription already exists (pending)
            if (response.message && response.message.includes('already have a pending')) {
                showToast('You have a pending subscription. Upload payment proof to activate.', 'info');
            } else {
                showToast('Subscription created. Please upload payment proof.', 'success');
            }
            document.getElementById('paymentModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Subscription error:', error);
        showToast(error.message || 'Failed to create subscription', 'error');
    }
};

// Contact for enterprise
window.contactEnterprise = function() {
    showToast('Please contact us at enterprise@turfspot.com or call +91-1234567890', 'info');
};

// Setup file upload
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('previewImage');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileSelect(file);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });
}

// Handle file selection
function handleFileSelect(file) {
    uploadedImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImage = document.getElementById('previewImage');
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Submit payment proof
window.submitPaymentProof = async function() {
    if (!uploadedImageFile) {
        showToast('Please upload a payment screenshot', 'error');
        return;
    }
    
    try {
        // In a real app, you'd upload to a cloud storage service like Cloudinary or Firebase
        // For now, we'll convert to base64 as a placeholder
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64Image = e.target.result;
                
                // Get the latest subscription ID
                const subResponse = await api.getMySubscription();
                
                if (!subResponse.data || !subResponse.data.subscription) {
                    showToast('No subscription found. Please select a plan first.', 'error');
                    return;
                }
                
                const subscriptionId = subResponse.data.subscription._id;
                
                await api.uploadSubscriptionPaymentProof(subscriptionId, base64Image);
                
                showToast('Payment proof uploaded successfully! Waiting for verification.', 'success');
                closePaymentModal();
                setTimeout(() => location.reload(), 2000);
            } catch (error) {
                console.error('Payment proof upload error:', error);
                showToast(error.message || 'Failed to upload payment proof', 'error');
            }
        };
        reader.readAsDataURL(uploadedImageFile);
    } catch (error) {
        console.error('File read error:', error);
        showToast(error.message || 'Failed to read file', 'error');
    }
};

// Close payment modal
window.closePaymentModal = function() {
    document.getElementById('paymentModal').style.display = 'none';
    uploadedImageFile = null;
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('fileInput').value = '';
};

// Logout
window.handleLogout = function() {
    authManager.logout();
    window.location.href = 'index.html';
};
