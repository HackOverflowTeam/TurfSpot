# 🧪 Dual Payment System Testing Guide

## Quick Test Scenarios

### ✅ Scenario 1: Owner Subscribes to Tier Plan

**Steps:**
1. Login as Owner
2. Go to Owner Dashboard
3. Click "Subscription" tab
4. Click "Subscribe to Tier Plan" button → Opens `owner-subscription.html`
5. Choose "Basic Plan" → Toggle "Annual" billing
6. Click "Get Started"
7. Upload payment screenshot
8. Click "Submit Payment"

**Expected Result:**
- ✅ Subscription created with status: "pending"
- ✅ Redirect back to owner dashboard
- ✅ Subscription shows "Pending Approval" status

**Admin Verification:**
1. Login as Admin
2. Go to Admin Dashboard
3. Click "Subscriptions" tab
4. See pending subscription with payment proof
5. Click "Approve"
6. Set dates and verify

**Expected Result:**
- ✅ Subscription status changes to "active"
- ✅ Owner can now create tier-based turfs

---

### ✅ Scenario 2: Owner Creates Tier-Based Turf

**Prerequisites:** Owner has active subscription

**Steps:**
1. Login as Owner (with active subscription)
2. Go to Owner Dashboard
3. Click "Add New Turf" button
4. Fill in turf details
5. **Select "Tier-Based" payment method**
6. Upload UPI QR code URL (e.g., https://i.imgur.com/example.jpg)
7. Enter UPI ID (optional)
8. Submit form

**Expected Result:**
- ✅ Turf created successfully
- ✅ Turf has `paymentMethod: 'tier'`
- ✅ UPI QR code saved
- ✅ Linked to subscription

**Error Cases to Test:**
- ❌ Try creating tier turf WITHOUT subscription → Should show error
- ❌ Try creating 2nd turf with Basic plan (limit 1) → Should show error
- ❌ Try tier-based WITHOUT UPI QR → Should show error

---

### ✅ Scenario 3: User Books Tier-Based Turf

**Steps:**
1. Login as User
2. Browse turfs
3. Open a **tier-based turf**
4. Select date and time slot
5. Click "Book Now"

**Expected Result:**
- ✅ Modal appears showing owner's UPI QR code
- ✅ Amount to pay displayed
- ✅ Screenshot upload field shown
- ✅ NO Razorpay payment gateway

**Continue:**
6. Pay via UPI (scan QR)
7. Take screenshot of payment
8. Upload screenshot
9. Click "Submit"

**Expected Result:**
- ✅ Booking created with status "pending"
- ✅ Payment proof uploaded
- ✅ tierPayment.verificationStatus = "pending"
- ✅ Redirect to My Bookings
- ✅ Booking shows "Pending Owner Verification"

---

### ✅ Scenario 4: Owner Verifies Payment

**Steps:**
1. Login as Owner
2. Go to Owner Dashboard
3. Click "Pending Verifications" tab
4. See badge with count of pending verifications
5. See booking card with:
   - User details
   - Payment amount
   - Payment screenshot (click to enlarge)
6. Click "Approve" or "Reject"

**If Approved:**
- ✅ Booking status → "confirmed"
- ✅ tierPayment.verificationStatus → "approved"
- ✅ User receives confirmation (in real system: email notification)

**If Rejected:**
- ✅ Booking status → "cancelled"
- ✅ tierPayment.verificationStatus → "rejected"
- ✅ Can enter rejection reason
- ✅ User notified (in real system: email)

---

### ✅ Scenario 5: User Books Commission-Based Turf

**Steps:**
1. Login as User
2. Browse turfs
3. Open a **commission-based turf**
4. Select date and time slot
5. Click "Book Now"

**Expected Result:**
- ✅ Razorpay payment gateway opens
- ✅ Amount shows platform price
- ✅ NO UPI QR shown
- ✅ Complete Razorpay payment

**After Payment:**
- ✅ Booking status → "confirmed" immediately
- ✅ No owner verification needed
- ✅ Payment proof in Razorpay

---

### ✅ Scenario 6: Subscription Limit Enforcement

**Test Basic Plan (1 turf limit):**
1. Owner with Basic plan
2. Create 1st turf → ✅ Success
3. Try to create 2nd turf → ❌ Error: "Your basic plan allows only 1 turf"

**Test Pro Plan (5 turf limit):**
1. Owner with Pro plan
2. Create turfs 1-5 → ✅ Success
3. Try to create 6th turf → ❌ Error: "Your pro plan allows only 5 turfs"

**Test Enterprise Plan (unlimited):**
1. Owner with Enterprise plan
2. Create any number of turfs → ✅ Success

---

### ✅ Scenario 7: Subscription Expiry

**Steps:**
1. Admin sets subscription end date to past
2. Owner tries to create tier-based turf

**Expected Result:**
- ❌ Error: "You need an active subscription"
- ✅ Existing tier turfs become inactive (or commission-based)

---

## 🔍 Database Validation Queries

### Check Subscription
```javascript
db.subscriptions.find({
  ownerId: ObjectId("owner_id"),
  status: "active",
  endDate: { $gt: new Date() }
})
```

### Check Tier-Based Turfs
```javascript
db.turfs.find({
  paymentMethod: "tier",
  subscription: { $exists: true }
})
```

### Check Pending Verifications
```javascript
db.bookings.find({
  "tierPayment.verificationStatus": "pending",
  status: "pending"
})
```

---

## 🚨 Common Issues & Solutions

### Issue: "UPI QR code not displaying"
**Solution:** Check if URL is accessible. Try uploading to Imgur/ImgBB

### Issue: "Subscription not active after approval"
**Solution:** Check if end date is set correctly by admin

### Issue: "Owner can't see pending verifications"
**Solution:** Check if turfs belong to this owner, verify booking exists

### Issue: "User can't upload payment screenshot"
**Solution:** Check file size limits, ensure image format (jpg/png)

---

## 📊 Test Data

### Sample UPI QR URLs (for testing):
```
https://i.imgur.com/example-upi-qr.jpg
https://imgbb.com/test-qr.png
```

### Sample Payment Amounts:
- Basic Plan Annual: ₹600
- Basic Plan Monthly: ₹699
- Pro Plan Annual: ₹3,000
- Pro Plan Monthly: ₹1,999

### Test User Accounts:
- **Owner 1:** owner@test.com (Basic subscription)
- **Owner 2:** owner2@test.com (Pro subscription)
- **User:** user@test.com
- **Admin:** admin@test.com

---

## ✅ Final Checklist

- [ ] Owner can subscribe to tier plans
- [ ] Admin can approve/reject subscriptions
- [ ] Owner can create tier-based turfs (with subscription)
- [ ] User sees UPI QR when booking tier turfs
- [ ] User can upload payment screenshot
- [ ] Owner can verify payments in dashboard
- [ ] Subscription limits enforced (1 for basic, 5 for pro)
- [ ] Commission-based turfs still work with Razorpay
- [ ] Expired subscriptions prevent tier turf creation
- [ ] Payment proofs are accessible and visible

---

## 🎯 Performance Tests

1. **Load 100 pending verifications** → Should render in < 2 seconds
2. **Upload 5MB payment screenshot** → Should compress/optimize
3. **Concurrent booking requests** → No double booking
4. **Subscription check on turf create** → Should be fast (< 500ms)

---

**Happy Testing! 🎉**
