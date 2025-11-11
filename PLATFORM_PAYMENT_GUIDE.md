# Platform-Managed Payment & Payout System

## Overview
Complete implementation of a platform-managed payment system where:
- Users pay to TurfSpot platform QR (not directly to owners)
- Platform takes 10% commission
- Owners receive 90% payout
- Admin can view all transactions by turf and manage payouts

## Architecture

### Database Models

#### 1. Transaction Model (`Transaction.model.js`)
Stores all payment transactions with commission split:

**Fields:**
- `booking`: Reference to Booking
- `user`: User who made payment
- `turf`: Turf booked
- `owner`: Turf owner
- `totalAmount`: Full payment amount
- `platformCommission`: 10% of total
- `ownerPayout`: 90% of total
- `paymentProof`: Screenshot uploaded by user
- `transactionReference`: UTR/Transaction ID
- `paymentStatus`: pending_verification | verified | rejected
- `payoutStatus`: pending | processing | completed | failed
- `payoutReference`: UTR when admin pays owner

**Methods:**
- `verifyPayment()`: Approve/reject payment proof
- `completePayout()`: Mark payout as completed
- Static methods for querying by turf, owner earnings, platform summary

#### 2. Settings Model (`Settings.model.js`)
Singleton model for platform configuration:

**Fields:**
- `platformPaymentQR`: Platform's UPI QR code
- `commission`: Platform and owner percentages
- `bankDetails`: Platform bank info

**Methods:**
- `getSettings()`: Get or create settings
- `updatePlatformQR()`: Update QR code
- `updateCommission()`: Adjust commission rates

#### 3. Updated Booking Model
Added `platformPayment` field:
- `paymentProof`: Screenshot URL
- `transactionReference`: User-provided UTR
- `verificationStatus`: pending | verified | rejected
- `transaction`: Link to Transaction record

### Backend API

#### Transaction Controller (`transaction.controller.js`)

**User Endpoints:**
- `POST /api/transactions/submit-proof/:bookingId` - Upload payment proof
- `GET /api/transactions/owner-earnings/:ownerId` - View earnings

**Admin Endpoints:**
- `GET /api/transactions/pending-verifications` - List pending verifications
- `POST /api/transactions/verify/:bookingId` - Approve/reject payment
- `GET /api/transactions/turf/:turfId` - View all transactions for a turf
- `GET /api/transactions/pending-payouts` - List pending payouts grouped by owner
- `POST /api/transactions/complete-payout/:transactionId` - Complete single payout
- `POST /api/transactions/bulk-payout/:ownerId` - Complete all payouts for an owner
- `GET /api/transactions/platform-summary` - Platform commission summary
- `GET /api/transactions/:transactionId` - Transaction details

**Platform QR Management:**
- `GET /api/transactions/platform-qr` - Get platform QR (public)
- `POST /api/transactions/platform-qr` - Update QR (admin only)

### Frontend

#### Admin Transaction Dashboard (`admin-transactions.html`)

**Features:**
1. **Summary Cards**
   - Total commission earned
   - Pending payouts
   - Completed payouts
   - Pending verifications

2. **Pending Verifications Tab**
   - List all bookings awaiting payment verification
   - View payment proof screenshot
   - Approve or reject with reason
   - Auto-creates Transaction on approval

3. **All Transactions Tab**
   - Filter by turf
   - Filter by payment status, payout status, date range
   - View commission breakdown
   - See payment and payout status
   - Complete individual payouts

4. **Manage Payouts Tab**
   - Grouped by owner
   - Shows total pending payout per owner
   - Bulk payout option
   - Owner contact details and UPI ID

5. **Platform QR Management**
   - Upload/update platform payment QR
   - Set UPI ID
   - Display current QR

#### JavaScript (`admin-transactions.js`)

**Key Functions:**
- `loadPendingVerifications()`: Load unverified payments
- `openVerificationModal()`: Approve/reject payment
- `loadTransactionsByTurf()`: Filter transactions by turf
- `loadPendingPayouts()`: Show owners awaiting payout
- `confirmPayout()`: Complete single or bulk payout
- `uploadPlatformQR()`: Update platform QR code

### API Integration (`api.js`)

**New Methods:**
```javascript
// Platform payment methods
api.getPlatformQR()
api.submitPaymentProof(bookingId, url, ref)
api.getPendingVerifications()
api.verifyPaymentProof(bookingId, approved, reason)
api.getTransactionsByTurf(turfId, filters)
api.getPendingPayouts()
api.completePayout(transactionId, ref, notes)
api.bulkCompletePayout(ownerId, ref, notes)
api.getPlatformSummary(start, end)
api.getOwnerEarnings(ownerId, start, end)
api.updatePlatformQR(url, publicId, upiId)
```

## User Flow

### 1. User Books Turf
1. User selects turf, date, time
2. Sees total amount with breakdown
3. Chooses platform payment option
4. Gets platform QR code to pay to

### 2. User Submits Payment Proof
1. Makes payment to TurfSpot QR
2. Takes screenshot of payment confirmation
3. Uploads screenshot via booking details
4. Enters UTR/Transaction ID
5. Booking status: "Pending Verification"

### 3. Admin Verifies Payment
1. Admin opens Transaction Management
2. Goes to "Pending Verifications" tab
3. Views payment proof screenshot
4. Checks amount and transaction ID
5. Clicks "Approve" or "Reject"

**On Approval:**
- Transaction record created
- Amount split: 10% platform, 90% owner
- Booking status: "Confirmed"
- Owner notified (future enhancement)

**On Rejection:**
- Booking cancelled
- User notified with reason
- Can resubmit correct proof

### 4. Admin Views Transactions by Turf
1. Selects turf from dropdown
2. Views all transactions for that turf
3. Sees commission breakdown
4. Filters by status, date
5. Exports reports (future enhancement)

### 5. Admin Manages Payouts
1. Goes to "Manage Payouts" tab
2. Sees owners with pending payouts
3. Views total amount per owner
4. Clicks "Complete Payout"
5. Enters UTR/Transaction ID
6. Confirms payout

**Bulk Payout:**
- Pays all pending transactions for one owner
- Single UTR covers all
- All transactions marked complete

**Individual Payout:**
- Can pay specific transactions
- Useful for partial payouts

### 6. Platform Commission Tracking
1. Dashboard shows total commission
2. Filter by date range
3. Export financial reports (future)
4. Track revenue over time

## Commission Calculation

```javascript
// Automatic calculation in Transaction model
const totalAmount = booking.pricing.totalAmount;
const platformCommission = totalAmount * 0.10; // 10%
const ownerPayout = totalAmount * 0.90; // 90%
```

**Example:**
- User pays: ₹1000
- Platform keeps: ₹100 (10%)
- Owner gets: ₹900 (90%)

## Security Features

1. **Payment Verification**: Admin must verify every payment
2. **Screenshot Proof**: Visual confirmation required
3. **Transaction References**: UTR tracking for accountability
4. **Payout Audit Trail**: All payouts logged with admin ID
5. **Status Tracking**: Clear status at every stage
6. **Role-Based Access**: Only admins can verify/payout

## Database Indexes

```javascript
// Transaction model
{ turf: 1, createdAt: -1 }
{ owner: 1, payoutStatus: 1 }
{ paymentStatus: 1 }
{ booking: 1 }

// Booking model (already exists)
{ turf: 1, bookingDate: 1 }
{ user: 1, createdAt: -1 }
```

## API Routes Summary

```
Public:
GET    /api/transactions/platform-qr

User:
POST   /api/transactions/submit-proof/:bookingId
GET    /api/transactions/owner-earnings/:ownerId

Admin:
GET    /api/transactions/pending-verifications
POST   /api/transactions/verify/:bookingId
GET    /api/transactions/turf/:turfId
GET    /api/transactions/pending-payouts
POST   /api/transactions/complete-payout/:transactionId
POST   /api/transactions/bulk-payout/:ownerId
GET    /api/transactions/platform-summary
GET    /api/transactions/:transactionId
POST   /api/transactions/platform-qr
```

## Testing Checklist

### Backend
- [ ] Create Transaction model in database
- [ ] Settings model singleton working
- [ ] Transaction controller methods working
- [ ] Routes protected with auth middleware
- [ ] Commission calculation correct (10%/90%)

### Admin Features
- [ ] Upload platform QR code
- [ ] View pending payment verifications
- [ ] Approve payment (creates Transaction)
- [ ] Reject payment (with reason)
- [ ] Filter transactions by turf
- [ ] View commission breakdown
- [ ] Complete single payout
- [ ] Bulk payout for owner
- [ ] View platform summary

### User Features
- [ ] Submit payment proof (future integration)
- [ ] View own earnings (for owners)

### Edge Cases
- [ ] Duplicate payment proof submission
- [ ] Already verified payment
- [ ] Complete already-paid payout
- [ ] Missing platform QR
- [ ] Invalid transaction ID
- [ ] Commission rate changes

## Future Enhancements

1. **Notifications**
   - Email owner when payment verified
   - Notify owner when payout completed
   - Alert user on payment rejection

2. **Analytics**
   - Revenue charts
   - Commission trends
   - Payout history graphs
   - Owner performance metrics

3. **Export Features**
   - CSV export of transactions
   - PDF financial reports
   - Tax documents

4. **Automated Payouts**
   - Scheduled bulk payouts
   - Integration with payment gateway
   - Auto-transfer to owner bank

5. **Payment Reminders**
   - Remind users to submit proof
   - Alert admin of pending verifications
   - Notify delayed payouts

6. **Dispute Resolution**
   - User can dispute rejection
   - Admin can review disputes
   - Escalation workflow

## Files Created/Modified

### New Files
- `backend/src/models/Transaction.model.js`
- `backend/src/models/Settings.model.js`
- `backend/src/controllers/transaction.controller.js`
- `backend/src/routes/transaction.routes.js`
- `frontend/admin-transactions.html`
- `frontend/js/admin-transactions.js`
- `PLATFORM_PAYMENT_GUIDE.md` (this file)

### Modified Files
- `backend/src/models/Booking.model.js` - Added platformPayment field
- `backend/src/server.js` - Added transaction routes
- `frontend/js/api.js` - Added transaction API methods

## Environment Variables

No additional environment variables needed. Uses existing:
- `MONGODB_URI`
- `JWT_SECRET`
- Cloudinary credentials (if storing QR images)

## Deployment Notes

1. Run database migration to create collections
2. Upload platform QR via admin panel
3. Set commission rates (default: 10%/90%)
4. Test payment verification flow
5. Test payout completion flow
6. Train admins on transaction management

## Support

For issues or questions:
1. Check error logs in backend
2. Verify JWT token validity
3. Confirm admin role in user document
4. Check network requests in browser console
5. Verify MongoDB connection

---

**Implementation Complete**: All backend and frontend features implemented and ready for testing.
