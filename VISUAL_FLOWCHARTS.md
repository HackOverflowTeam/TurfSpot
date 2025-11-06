# 🔄 Dual Payment System - Visual Flowcharts

## 1️⃣ Owner Subscription Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    OWNER SUBSCRIPTION FLOW                   │
└─────────────────────────────────────────────────────────────┘

Owner
  │
  ├──> Goes to owner-subscription.html
  │
  ├──> Selects Plan:
  │    ├─> Basic (₹600-699/mo, 1 turf)
  │    ├─> Pro (₹1,999-3,000/mo, 5 turfs)
  │    └─> Enterprise (Custom, unlimited)
  │
  ├──> Toggles Billing:
  │    ├─> Monthly
  │    └─> Annual (with savings)
  │
  ├──> Clicks "Get Started"
  │
  ├──> Payment Modal Opens
  │    ├─> Shows payment details
  │    ├─> Uploads payment screenshot
  │    └─> Submits
  │
  ├──> Subscription Created
  │    └─> Status: "pending"
  │
  ▼

Admin Notification

Admin
  │
  ├──> Goes to admin-dashboard.html
  │
  ├──> Clicks "Subscriptions" Tab
  │
  ├──> Sees pending subscription
  │
  ├──> Reviews payment proof
  │
  ├──> Decision:
  │    ├─> APPROVE
  │    │   ├─> Sets start date
  │    │   ├─> Sets end date (based on billing)
  │    │   └─> Status: "active"
  │    │
  │    └─> REJECT
  │        └─> Status: "cancelled"
  │
  ▼

Owner Notified ✅

Owner can now create tier-based turfs!
```

---

## 2️⃣ Tier-Based Turf Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 TIER-BASED TURF CREATION                     │
└─────────────────────────────────────────────────────────────┘

Owner (with active subscription)
  │
  ├──> Goes to Owner Dashboard
  │
  ├──> Clicks "Add New Turf"
  │
  ├──> Fills turf details:
  │    ├─> Name, description
  │    ├─> Address, location
  │    ├─> Sports, amenities
  │    └─> Pricing
  │
  ├──> Selects Payment Method:
  │    ├─> Commission-Based ❌ (not selected)
  │    └─> Tier-Based ✅
  │
  ├──> System Validates:
  │    ├─> Has active subscription? ✅
  │    ├─> Within turf limit? ✅
  │    │   ├─> Basic: 1 turf max
  │    │   ├─> Pro: 5 turfs max
  │    │   └─> Enterprise: unlimited
  │    └─> UPI QR code provided? ✅
  │
  ├──> Uploads UPI QR Code URL
  │    └─> (from Imgur, ImgBB, etc.)
  │
  ├──> Enters UPI ID (optional)
  │
  ├──> Submits Form
  │
  ├──> Turf Created ✅
  │    ├─> paymentMethod: "tier"
  │    ├─> upiQrCode: { url: "..." }
  │    ├─> subscription: ObjectId
  │    └─> status: "pending" (admin approval)
  │
  ▼

Admin Approves Turf

  ▼

Turf Now Available for Booking! 🎉
```

---

## 3️⃣ User Booking Flow (Tier-Based)

```
┌─────────────────────────────────────────────────────────────┐
│            USER BOOKING FLOW (TIER-BASED TURF)              │
└─────────────────────────────────────────────────────────────┘

User
  │
  ├──> Browses Turfs
  │
  ├──> Opens Tier-Based Turf Details
  │
  ├──> Selects:
  │    ├─> Date
  │    ├─> Time slots
  │    └─> Sport
  │
  ├──> Clicks "Book Now"
  │
  ├──> System Detects: paymentMethod = "tier"
  │
  ├──> UPI Payment Modal Opens
  │    ├─> Shows owner's UPI QR code
  │    ├─> Shows amount to pay
  │    └─> Shows instructions
  │
  ├──> User Actions:
  │    ├─> Scans QR with UPI app
  │    ├─> Pays owner directly
  │    ├─> Takes screenshot of payment
  │    └─> Uploads screenshot
  │
  ├──> Clicks "Submit"
  │
  ├──> Booking Created
  │    ├─> status: "pending"
  │    ├─> payment.status: "pending"
  │    ├─> tierPayment.screenshot: uploaded
  │    └─> tierPayment.verificationStatus: "pending"
  │
  ▼

Owner Notification 📱

  ▼

Awaiting Owner Verification...
```

---

## 4️⃣ Owner Payment Verification Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  OWNER PAYMENT VERIFICATION                  │
└─────────────────────────────────────────────────────────────┘

Owner
  │
  ├──> Goes to Owner Dashboard
  │
  ├──> Sees Badge on "Pending Verifications"
  │    └─> Count: 3
  │
  ├──> Clicks "Pending Verifications" Tab
  │
  ├──> Sees Booking Cards:
  │    ├─> User info (name, phone)
  │    ├─> Booking details (date, time, sport)
  │    ├─> Amount paid
  │    └─> Payment screenshot (click to enlarge)
  │
  ├──> Checks Payment:
  │    ├─> Opens UPI app
  │    ├─> Verifies transaction
  │    └─> Matches amount and time
  │
  ├──> Decision:
  │    │
  │    ├─> APPROVE ✅
  │    │   ├─> Clicks "Approve" button
  │    │   ├─> Booking status: "confirmed"
  │    │   ├─> tierPayment.verificationStatus: "approved"
  │    │   └─> User notified
  │    │
  │    └─> REJECT ❌
  │        ├─> Clicks "Reject" button
  │        ├─> Enters rejection reason
  │        ├─> Booking status: "cancelled"
  │        ├─> tierPayment.verificationStatus: "rejected"
  │        └─> User notified
  │
  ▼

Badge Count Updates 🔄

Verification Complete! 🎉
```

---

## 5️⃣ Commission vs Tier Payment Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                   PAYMENT FLOW COMPARISON                    │
└─────────────────────────────────────────────────────────────┘

COMMISSION-BASED TURF:
═══════════════════════
User Books
   ↓
Razorpay Gateway Opens
   ↓
User Pays via Razorpay
   ↓
Payment Verified Automatically
   ↓
Platform Takes 15% Commission
   ↓
Booking Confirmed Instantly ✅
   ↓
Owner Receives 85% in Payout


TIER-BASED TURF:
═══════════════════
User Books
   ↓
UPI QR Modal Opens
   ↓
User Pays Owner Directly via UPI
   ↓
User Uploads Screenshot
   ↓
Owner Reviews Screenshot
   ↓
Owner Approves/Rejects
   ↓
Booking Confirmed/Cancelled ✅
   ↓
Owner Keeps 100% of Payment
```

---

## 6️⃣ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SYSTEM ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────┘

FRONTEND
════════
┌──────────────────┐
│ owner-           │ ──> Owner subscribes to tier plan
│ subscription.html│
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ owner-           │ ──> Owner creates turf + verifies payments
│ dashboard.html   │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ turf-details.html│ ──> User books + uploads payment proof
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ admin-           │ ──> Admin approves subscriptions
│ dashboard.html   │
└──────────────────┘

         │
         ▼

API LAYER
═════════
┌─────────────────────────────────────────┐
│ /api/subscriptions                      │
│  ├─ POST / (create subscription)        │
│  ├─ GET /my-subscription                │
│  └─ PUT /admin/:id/verify               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ /api/turfs                              │
│  ├─ POST / (create turf)                │
│  └─ GET /:id (get turf with payment)    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ /api/bookings                           │
│  ├─ POST / (create booking)             │
│  ├─ POST /:id/tier-payment              │
│  ├─ PUT /:id/verify-tier-payment        │
│  └─ GET /owner/pending-verifications    │
└─────────────────────────────────────────┘

         │
         ▼

DATABASE (MongoDB)
══════════════════
┌──────────────────┐
│ Subscriptions    │ ──> Owner subscription data
│  ├─ ownerId      │
│  ├─ plan         │
│  ├─ status       │
│  ├─ maxTurfs     │
│  └─ paymentProof │
└──────────────────┘

┌──────────────────┐
│ Turfs            │ ──> Turf with payment method
│  ├─ paymentMethod│ ──> "commission" | "tier"
│  ├─ upiQrCode    │ ──> { url, publicId }
│  ├─ upiId        │
│  └─ subscription │ ──> ObjectId
└──────────────────┘

┌──────────────────┐
│ Bookings         │ ──> Booking with payment status
│  ├─ tierPayment  │
│  │  ├─ screenshot│
│  │  └─ status    │ ──> "pending" | "approved" | "rejected"
│  └─ payment      │
│     └─ status    │ ──> For Razorpay payments
└──────────────────┘
```

---

## 7️⃣ Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        DATA FLOW                             │
└─────────────────────────────────────────────────────────────┘

SUBSCRIPTION CREATION:
━━━━━━━━━━━━━━━━━━━━━
Owner Input ──> Frontend ──> POST /api/subscriptions
                               │
                               ├──> Create Subscription Doc
                               │    └─> status: "pending"
                               │
                               └──> Save payment proof URL
                                    
Admin Approval ──> Frontend ──> PUT /api/subscriptions/admin/:id/verify
                                 │
                                 ├──> Update status: "active"
                                 ├──> Set start/end dates
                                 └──> verifiedBy: admin._id


TIER TURF CREATION:
━━━━━━━━━━━━━━━━━━━
Owner Input ──> Frontend ──> POST /api/turfs
                               │
                               ├──> Validate Subscription
                               │    ├─> Check active status
                               │    └─> Check turf limit
                               │
                               ├──> Create Turf Doc
                               │    ├─> paymentMethod: "tier"
                               │    ├─> upiQrCode: { url }
                               │    └─> subscription: ObjectId
                               │
                               └──> Return success


USER BOOKING (TIER):
━━━━━━━━━━━━━━━━━━━
User Input ──> Frontend ──> POST /api/bookings
                             │
                             ├──> Detect turf.paymentMethod
                             │
                             ├──> If "tier":
                             │    ├─> Create booking (pending)
                             │    ├─> Return UPI QR code
                             │    └─> No Razorpay order
                             │
                             └──> If "commission":
                                  ├─> Create Razorpay order
                                  └─> Return order details

User Pays ──> Frontend ──> POST /api/bookings/:id/tier-payment
                            │
                            ├──> Upload screenshot
                            ├──> Update tierPayment.screenshot
                            └──> Set verificationStatus: "pending"


OWNER VERIFICATION:
━━━━━━━━━━━━━━━━━━━
Owner Reviews ──> Frontend ──> GET /api/bookings/owner/pending-verifications
                                │
                                └──> Return bookings with screenshots

Owner Decision ──> Frontend ──> PUT /api/bookings/:id/verify-tier-payment
                                 │
                                 ├──> If approved:
                                 │    ├─> booking.status: "confirmed"
                                 │    └─> tierPayment.status: "approved"
                                 │
                                 └──> If rejected:
                                      ├─> booking.status: "cancelled"
                                      └─> tierPayment.status: "rejected"
```

---

## 🎯 Key Decision Points

### 1. Turf Creation
```
Is subscription required?
  ├─ YES (tier-based payment)
  │   ├─ Check subscription status
  │   ├─ Check turf limit
  │   └─ Require UPI QR
  │
  └─ NO (commission-based payment)
      └─ Create turf directly
```

### 2. Booking Flow
```
What is turf.paymentMethod?
  ├─ "tier"
  │   ├─ Show UPI QR
  │   ├─ Upload screenshot
  │   └─ Wait for verification
  │
  └─ "commission"
      ├─ Open Razorpay
      └─ Automatic verification
```

### 3. Payment Verification
```
Who verifies the payment?
  ├─ Tier-based: Owner manually
  │   ├─ Reviews screenshot
  │   └─ Approves/rejects
  │
  └─ Commission-based: Automatic
      └─ Razorpay webhook
```

---

**This visual guide helps understand the complete dual payment system flow!** 📊
