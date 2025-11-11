import api, { formatCurrency, formatDateTime, showToast } from './api.js';

let currentTurfId = null;
let currentBookingForVerification = null;
let currentTransactionForPayout = null;
let currentOwnerForBulkPayout = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Load initial data
    await loadPlatformQR();
    await loadPendingVerifications();
    await loadTurfs();
    await loadSummary();

    // Setup tab switching
    setupTabs();
}

// Setup tab switching
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');

            // Load data when tab is clicked
            if (tabName === 'verifications') {
                loadPendingVerifications();
            } else if (tabName === 'payouts') {
                loadPendingPayouts();
            }
        });
    });
}

// Load platform QR
async function loadPlatformQR() {
    try {
        const response = await api.getPlatformQR();
        if (response.success && response.data) {
            document.getElementById('platformQRImage').src = response.data.url;
            document.getElementById('platformUPI').textContent = response.data.upiId ? `UPI: ${response.data.upiId}` : '';
            document.getElementById('qrDisplay').style.display = 'block';
        }
    } catch (error) {
        console.log('No platform QR configured yet');
    }
}

// Load summary data
async function loadSummary() {
    try {
        const [summaryResponse, verificationsResponse, payoutsResponse] = await Promise.all([
            api.getPlatformSummary(),
            api.getPendingVerifications(),
            api.getPendingPayouts()
        ]);

        if (summaryResponse.success) {
            document.getElementById('totalCommission').textContent = formatCurrency(summaryResponse.data.totalCommission);
        }

        if (verificationsResponse.success) {
            document.getElementById('pendingVerifications').textContent = verificationsResponse.data.length;
        }

        if (payoutsResponse.success) {
            const totalPending = payoutsResponse.data.reduce((sum, owner) => sum + owner.totalPayout, 0);
            document.getElementById('pendingPayouts').textContent = formatCurrency(totalPending);
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Load pending verifications
async function loadPendingVerifications() {
    const loader = document.getElementById('verificationsLoader');
    const table = document.getElementById('verificationsTable');
    const empty = document.getElementById('verificationsEmpty');
    const tbody = document.getElementById('verificationsBody');

    loader.style.display = 'block';
    table.style.display = 'none';
    empty.style.display = 'none';

    try {
        const response = await api.getPendingVerifications();
        
        if (response.success && response.data.length > 0) {
            tbody.innerHTML = response.data.map(booking => `
                <tr>
                    <td>${booking._id.slice(-8)}</td>
                    <td>
                        ${booking.user.name}<br>
                        <small style="color: #6b7280;">${booking.user.email}</small>
                    </td>
                    <td>${booking.turf.name}</td>
                    <td>${formatCurrency(booking.pricing.totalAmount)}</td>
                    <td>${formatDateTime(booking.platformPayment.uploadedAt)}</td>
                    <td>
                        <button class="btn-view" onclick="viewPaymentProof('${booking.platformPayment.paymentProof.url}')">
                            View Proof
                        </button>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-approve" onclick="openVerificationModal('${booking._id}', true)">
                                Approve
                            </button>
                            <button class="btn-reject" onclick="openVerificationModal('${booking._id}', false)">
                                Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            table.style.display = 'block';
        } else {
            empty.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading verifications:', error);
        showToast('Error loading pending verifications', 'error');
    } finally {
        loader.style.display = 'none';
    }
}

// Load turfs for dropdown
async function loadTurfs() {
    try {
        const response = await api.getAllTurfs();
        if (response.success) {
            const select = document.getElementById('turfFilter');
            select.innerHTML = '<option value="">Select a turf</option>' +
                response.data.map(turf => `<option value="${turf._id}">${turf.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading turfs:', error);
    }
}

// Load transactions by turf
async function loadTransactionsByTurf() {
    const turfId = document.getElementById('turfFilter').value;
    
    if (!turfId) {
        document.getElementById('transactionsLoader').style.display = 'block';
        document.getElementById('transactionsLoader').textContent = 'Select a turf to view transactions';
        document.getElementById('transactionsTable').style.display = 'none';
        document.getElementById('transactionFilters').style.display = 'none';
        return;
    }

    currentTurfId = turfId;
    document.getElementById('transactionFilters').style.display = 'block';
    await applyTransactionFilters();
}

// Apply transaction filters
async function applyTransactionFilters() {
    if (!currentTurfId) return;

    const loader = document.getElementById('transactionsLoader');
    const table = document.getElementById('transactionsTable');
    const tbody = document.getElementById('transactionsBody');

    loader.style.display = 'block';
    loader.textContent = 'Loading...';
    table.style.display = 'none';

    const filters = {
        paymentStatus: document.getElementById('paymentStatusFilter').value,
        payoutStatus: document.getElementById('payoutStatusFilter').value,
        startDate: document.getElementById('startDateFilter').value,
        endDate: document.getElementById('endDateFilter').value
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => !filters[key] && delete filters[key]);

    try {
        const response = await api.getTransactionsByTurf(currentTurfId, filters);
        
        if (response.success) {
            if (response.data.transactions.length > 0) {
                tbody.innerHTML = response.data.transactions.map(txn => `
                    <tr>
                        <td>${txn._id.slice(-8)}</td>
                        <td>
                            ${txn.user.name}<br>
                            <small style="color: #6b7280;">${txn.user.email}</small>
                        </td>
                        <td>${formatDateTime(txn.createdAt)}</td>
                        <td>${formatCurrency(txn.totalAmount)}</td>
                        <td>${formatCurrency(txn.platformCommission)}</td>
                        <td>${formatCurrency(txn.ownerPayout)}</td>
                        <td>
                            <span class="status-badge status-${txn.paymentStatus}">
                                ${txn.paymentStatus.replace('_', ' ')}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge status-${txn.payoutStatus}">
                                ${txn.payoutStatus}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-view" onclick="viewTransactionDetails('${txn._id}')">
                                    View
                                </button>
                                ${txn.payoutStatus === 'pending' && txn.paymentStatus === 'verified' ? 
                                    `<button class="btn-payout" onclick="openPayoutModal('${txn._id}')">Pay</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('');
                
                table.style.display = 'block';
            } else {
                loader.textContent = 'No transactions found for this turf';
            }
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Error loading transactions', 'error');
    } finally {
        loader.style.display = response.data.transactions.length === 0 ? 'block' : 'none';
    }
}

// Load pending payouts
async function loadPendingPayouts() {
    const loader = document.getElementById('payoutsLoader');
    const content = document.getElementById('payoutsContent');

    loader.style.display = 'block';
    content.innerHTML = '';

    try {
        const response = await api.getPendingPayouts();
        
        if (response.success && response.data.length > 0) {
            content.innerHTML = response.data.map(ownerData => `
                <div class="payout-group">
                    <h3>Owner: ${ownerData.owner.name}</h3>
                    <div class="detail-row">
                        <span class="detail-label">Email</span>
                        <span class="detail-value">${ownerData.owner.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone</span>
                        <span class="detail-value">${ownerData.owner.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">UPI ID</span>
                        <span class="detail-value">${ownerData.owner.upiId || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Pending Payout</span>
                        <span class="detail-value" style="font-weight: bold; color: #10b981;">
                            ${formatCurrency(ownerData.totalPayout)}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transaction Count</span>
                        <span class="detail-value">${ownerData.transactionCount}</span>
                    </div>
                    <button class="btn-payout" style="margin-top: 1rem; width: 100%;" 
                            onclick="openBulkPayoutModal('${ownerData.owner._id}', ${ownerData.totalPayout})">
                        Complete Payout for All Transactions
                    </button>
                </div>
            `).join('');
        } else {
            content.innerHTML = '<div class="empty-state">No pending payouts</div>';
        }
    } catch (error) {
        console.error('Error loading payouts:', error);
        showToast('Error loading pending payouts', 'error');
    } finally {
        loader.style.display = 'none';
    }
}

// View payment proof
window.viewPaymentProof = function(url) {
    window.open(url, '_blank');
};

// Open verification modal
window.openVerificationModal = function(bookingId, isApprove) {
    currentBookingForVerification = { bookingId, isApprove };
    
    const modal = document.getElementById('verificationModal');
    const details = document.getElementById('verificationDetails');
    
    details.innerHTML = `
        <p>Are you sure you want to ${isApprove ? 'approve' : 'reject'} this payment?</p>
        ${!isApprove ? `
            <div class="filter-group" style="margin-top: 1rem;">
                <label>Rejection Reason</label>
                <textarea id="rejectionReason" rows="3" 
                          style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;"
                          placeholder="Enter reason for rejection"></textarea>
            </div>
        ` : ''}
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
            <button class="${isApprove ? 'btn-approve' : 'btn-reject'}" onclick="confirmVerification()">
                Confirm
            </button>
            <button class="btn-view" onclick="closeVerificationModal()">Cancel</button>
        </div>
    `;
    
    modal.classList.add('active');
};

window.closeVerificationModal = function() {
    document.getElementById('verificationModal').classList.remove('active');
    currentBookingForVerification = null;
};

// Confirm verification
window.confirmVerification = async function() {
    if (!currentBookingForVerification) return;
    
    const { bookingId, isApprove } = currentBookingForVerification;
    let rejectionReason = null;
    
    if (!isApprove) {
        rejectionReason = document.getElementById('rejectionReason').value.trim();
        if (!rejectionReason) {
            showToast('Please enter a rejection reason', 'error');
            return;
        }
    }
    
    try {
        const response = await api.verifyPaymentProof(bookingId, isApprove, rejectionReason);
        
        if (response.success) {
            showToast(`Payment ${isApprove ? 'approved' : 'rejected'} successfully`, 'success');
            closeVerificationModal();
            await loadPendingVerifications();
            await loadSummary();
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        showToast(error.message || 'Error verifying payment', 'error');
    }
};

// View transaction details
window.viewTransactionDetails = async function(transactionId) {
    try {
        const response = await api.getTransactionDetails(transactionId);
        
        if (response.success) {
            const txn = response.data;
            const modal = document.getElementById('transactionModal');
            const details = document.getElementById('transactionDetails');
            
            details.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value">${txn._id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">User</span>
                    <span class="detail-value">${txn.user.name} (${txn.user.email})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Turf</span>
                    <span class="detail-value">${txn.turf.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Owner</span>
                    <span class="detail-value">${txn.owner.name} (${txn.owner.email})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Booking Date</span>
                    <span class="detail-value">${txn.bookingSnapshot.date} - ${txn.bookingSnapshot.timeSlot}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Amount</span>
                    <span class="detail-value">${formatCurrency(txn.totalAmount)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Platform Commission (10%)</span>
                    <span class="detail-value">${formatCurrency(txn.platformCommission)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Owner Payout (90%)</span>
                    <span class="detail-value">${formatCurrency(txn.ownerPayout)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Status</span>
                    <span class="detail-value">
                        <span class="status-badge status-${txn.paymentStatus}">${txn.paymentStatus}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payout Status</span>
                    <span class="detail-value">
                        <span class="status-badge status-${txn.payoutStatus}">${txn.payoutStatus}</span>
                    </span>
                </div>
                ${txn.paymentProof?.url ? `
                    <div style="margin-top: 1rem;">
                        <h4>Payment Proof</h4>
                        <img src="${txn.paymentProof.url}" class="payment-proof-img" alt="Payment Proof">
                    </div>
                ` : ''}
                ${txn.payoutReference ? `
                    <div class="detail-row">
                        <span class="detail-label">Payout Reference</span>
                        <span class="detail-value">${txn.payoutReference}</span>
                    </div>
                ` : ''}
            `;
            
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading transaction details:', error);
        showToast('Error loading transaction details', 'error');
    }
};

window.closeTransactionModal = function() {
    document.getElementById('transactionModal').classList.remove('active');
};

// Open payout modal for single transaction
window.openPayoutModal = function(transactionId) {
    currentTransactionForPayout = transactionId;
    currentOwnerForBulkPayout = null;
    
    const modal = document.getElementById('payoutModal');
    const form = document.getElementById('payoutForm');
    
    form.innerHTML = `
        <div class="filter-group">
            <label>Payout Reference (UTR/Transaction ID) *</label>
            <input type="text" id="payoutReference" placeholder="Enter payment reference" required>
        </div>
        <div class="filter-group" style="margin-top: 1rem;">
            <label>Notes (Optional)</label>
            <textarea id="payoutNotes" rows="3" 
                      style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;"
                      placeholder="Any additional notes"></textarea>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
            <button class="btn-approve" onclick="confirmPayout()">Complete Payout</button>
            <button class="btn-view" onclick="closePayoutModal()">Cancel</button>
        </div>
    `;
    
    modal.classList.add('active');
};

// Open bulk payout modal
window.openBulkPayoutModal = function(ownerId, totalAmount) {
    currentOwnerForBulkPayout = ownerId;
    currentTransactionForPayout = null;
    
    const modal = document.getElementById('payoutModal');
    const form = document.getElementById('payoutForm');
    
    form.innerHTML = `
        <p>Complete payout of <strong>${formatCurrency(totalAmount)}</strong> for all pending transactions.</p>
        <div class="filter-group" style="margin-top: 1rem;">
            <label>Payout Reference (UTR/Transaction ID) *</label>
            <input type="text" id="payoutReference" placeholder="Enter payment reference" required>
        </div>
        <div class="filter-group" style="margin-top: 1rem;">
            <label>Notes (Optional)</label>
            <textarea id="payoutNotes" rows="3" 
                      style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;"
                      placeholder="Any additional notes"></textarea>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
            <button class="btn-approve" onclick="confirmPayout()">Complete Bulk Payout</button>
            <button class="btn-view" onclick="closePayoutModal()">Cancel</button>
        </div>
    `;
    
    modal.classList.add('active');
};

window.closePayoutModal = function() {
    document.getElementById('payoutModal').classList.remove('active');
    currentTransactionForPayout = null;
    currentOwnerForBulkPayout = null;
};

// Confirm payout
window.confirmPayout = async function() {
    const payoutReference = document.getElementById('payoutReference').value.trim();
    const notes = document.getElementById('payoutNotes').value.trim() || null;
    
    if (!payoutReference) {
        showToast('Please enter a payout reference', 'error');
        return;
    }
    
    try {
        let response;
        
        if (currentOwnerForBulkPayout) {
            // Bulk payout
            response = await api.bulkCompletePayout(currentOwnerForBulkPayout, payoutReference, notes);
        } else if (currentTransactionForPayout) {
            // Single transaction payout
            response = await api.completePayout(currentTransactionForPayout, payoutReference, notes);
        }
        
        if (response.success) {
            showToast('Payout completed successfully', 'success');
            closePayoutModal();
            await loadPendingPayouts();
            await loadSummary();
            if (currentTurfId) {
                await applyTransactionFilters();
            }
        }
    } catch (error) {
        console.error('Error completing payout:', error);
        showToast(error.message || 'Error completing payout', 'error');
    }
};

// Open QR modal
window.openQRModal = function() {
    document.getElementById('qrModal').classList.add('active');
};

window.closeQRModal = function() {
    document.getElementById('qrModal').classList.remove('active');
};

// Upload platform QR
window.uploadPlatformQR = async function() {
    const url = document.getElementById('qrImageUrl').value.trim();
    const upiId = document.getElementById('qrUpiId').value.trim() || null;
    
    if (!url) {
        showToast('Please enter a QR code image URL', 'error');
        return;
    }
    
    try {
        const response = await api.updatePlatformQR(url, null, upiId);
        
        if (response.success) {
            showToast('Platform QR updated successfully', 'success');
            closeQRModal();
            await loadPlatformQR();
        }
    } catch (error) {
        console.error('Error updating QR:', error);
        showToast(error.message || 'Error updating QR code', 'error');
    }
};

// Make functions globally available
window.loadTransactionsByTurf = loadTransactionsByTurf;
window.applyTransactionFilters = applyTransactionFilters;
