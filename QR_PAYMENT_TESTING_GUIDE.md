# QR Payment Testing Guide

## Platform QR Code Setup

**File:** `/frontend/assets/adminqr.png`

This QR code is now automatically used for all commission-based bookings.

## Testing the Complete Flow

### 1. User Books Turf (Commission-Based)

**Steps:**
1. Go to any turf details page (commission-based turf)
2. Select date and time slot
3. Click "Book Now"
4. **Expected:** Modal opens showing:
   - Platform QR code (adminqr.png)
   - Booking details
   - Upload area for payment screenshot

**Screenshot Upload:**
- Click upload area or drag & drop an image
- Max file size: 5MB
- Formats: JPG, PNG
- Preview should show immediately

**Submit:**
- Optional: Enter transaction reference (UTR)
- Click "Submit Payment"
- **Expected:** Redirected to "My Bookings" page
- Booking status: "Pending Verification"

### 2. Admin Verifies Payment

**Steps:**
1. Login as admin
2. Go to `/admin-transactions.html`
3. **Platform QR Display:**
   - Should show `adminqr.png` at top of page
   - Text: "TurfSpot Platform Payment"

4. Click "Pending Verifications" tab
5. **Expected:** Table shows:
   - Booking ID
   - User (Player Name)
   - Turf Name
   - Amount
   - Booking Date
   - Payment Screenshot (clickable)
   - Actions (Approve/Reject buttons)

**To Approve:**
- Click "Approve" button
- Confirm approval
- **Expected:**
  - Transaction created automatically
  - Commission split: 10% platform, 90% owner
  - Booking status: "Confirmed"
  - Payment status: "Verified"

**To Reject:**
- Click "Reject" button
- Enter rejection reason
- **Expected:**
  - Booking status: "Cancelled"
  - Payment status: "Rejected"

### 3. View Transactions by Turf

**Steps:**
1. In admin dashboard, click "All Transactions" tab
2. Select a turf from dropdown
3. **Expected:** Table shows:
   - Transaction ID
   - User
   - Date
   - Total Amount
   - Platform Commission (10%)
   - Owner Payout (90%)
   - Payment Status: "Verified"
   - Payout Status: "Pending"

**Filters:**
- Payment Status (All/Verified/Pending/Rejected)
- Payout Status (All/Pending/Completed)
- Start Date
- End Date

### 4. Owner Views Bookings

**Steps:**
1. Login as turf owner
2. Go to owner dashboard
3. Click "Bookings" tab
4. **Expected:** Shows all bookings for owner's turfs:
   - Player Name, Email, Phone
   - Turf Name
   - Date & Time
   - Sport & Players
   - **Amount** (highlighted)
   - **Payment Status Badge:**
     - ✅ Green: "Verified - Paid"
     - ⏳ Yellow: "Pending Verification"
     - ❌ Red: "Payment Rejected"
   - Timestamp

**Filters:**
- Turf dropdown (only owner's turfs)
- Status dropdown (Pending/Confirmed/Completed/Cancelled)

### 5. Admin Processes Payout

**Steps:**
1. In admin dashboard, click "Manage Payouts" tab
2. **Expected:** Owners grouped with:
   - Owner name and contact
   - Total pending payout (90% of total)
   - Number of transactions
   - "Complete Payout" button

**To Pay Owner:**
- Click "Complete Payout" for an owner
- Enter payout reference (UTR/Transaction ID)
- Optional: Add notes
- Confirm
- **Expected:**
  - All transactions for that owner marked "Completed"
  - Transaction disappears from pending list

## Commission Calculation Verification

**Example Booking:**
- User pays: ₹1,000
- Platform commission: ₹100 (10%)
- Owner payout: ₹900 (90%)

**Check in:**
1. Admin "All Transactions" tab - should show split
2. "Manage Payouts" - owner pending should show ₹900
3. "Total Commission" card - should include ₹100

## QR Code Locations

1. **User Booking Modal:** Shows when user books commission-based turf
2. **Admin Dashboard:** Displayed at top of transaction management page
3. **Source File:** `/frontend/assets/adminqr.png`

## Mobile Testing

Test on mobile devices:
- QR modal should be responsive
- Upload area touch-friendly
- Screenshot preview works
- Modal scrollable if needed
- All buttons accessible

## Troubleshooting

**QR Not Showing:**
- Check file exists at `/frontend/assets/adminqr.png`
- Clear browser cache
- Check console for errors

**Upload Failed:**
- Check file size < 5MB
- Ensure image format (JPG/PNG)
- Check network connection

**Admin Can't Verify:**
- Ensure logged in as admin
- Check admin role in database
- Verify JWT token valid

**Owner Sees No Bookings:**
- Ensure owner has turfs
- Check turf ownership in database
- Verify bookings exist for those turfs

## Success Criteria

✅ User can book turf with platform QR
✅ Screenshot upload works
✅ Admin sees pending verifications
✅ Admin can approve/reject
✅ Transaction shows 10%/90% split
✅ Owner sees verified bookings with badge
✅ Admin can process payouts
✅ Commission tracked correctly

## Notes

- QR code is hardcoded to `adminqr.png` for simplicity
- To change QR, replace the file at `/frontend/assets/adminqr.png`
- No database upload needed - file-based approach
- Works offline once page loaded
- Fast loading (no API call needed)

## Test Data

**Test Booking:**
- Turf: Any commission-based turf
- Amount: ₹500
- Expected Commission: ₹50
- Expected Owner Payout: ₹450

**Multiple Bookings Test:**
- Book 3 turfs from same owner
- Total: ₹1,500
- Expected Pending Payout: ₹1,350 (90%)
- Expected Platform Commission: ₹150 (10%)
