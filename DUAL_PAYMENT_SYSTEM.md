# 🏏 TurfSpot Dual Payment System Documentation

## Overview

TurfSpot now supports **TWO PAYMENT MODELS** for turf owners:

1. **Commission-Based** (Default) - Platform handles payments, 15% commission
2. **Tier-Based Subscription** - Owners pay monthly fee, receive payments directly (0% commission)

---

## 📊 Payment Models Comparison

### 1. Commission-Based Payment (Default)

**How it works:**
- Users book and pay through platform (Razorpay)
- Platform automatically takes 15% commission
- Owner receives 85% of booking amount
- Payment handled automatically

**Best for:**
- New owners testing the platform
- Owners who want hassle-free payment handling
- Occasional turf listings

**Pros:**
- ✅ No subscription fees
- ✅ Automatic payment processing
- ✅ Platform handles refunds
- ✅ No payment verification needed

**Cons:**
- ❌ 15% commission on every booking
- ❌ Less profit per booking

---

### 2. Tier-Based Subscription Payment

**How it works:**
- Owner pays monthly subscription to TurfSpot
- Users book and pay DIRECTLY to owner via UPI
- Owner receives 100% of booking amount
- Owner manually verifies payments
- Requires active subscription plan

**Best for:**
- Established turf owners with regular bookings
- Owners who want maximum profit
- Professional turf businesses

**Pros:**
- ✅ 0% commission - keep 100% of booking amount
- ✅ Direct payments to owner
- ✅ More profit per booking
- ✅ Advanced features included

**Cons:**
- ❌ Monthly subscription fee required
- ❌ Manual payment verification needed
- ❌ Owner handles payment disputes

---

## 💰 Tier Subscription Plans

### Tier 1: Basic Plan (Launch Offer)

**Pricing:**
- **₹600/month** (Annual billing) - *Save ₹1,188/year*
- **₹699/month** (Monthly billing)

**Features:**
- ✅ List 1 turf
- ✅ Standard Booking Management
- ✅ Basic Analytics (Total revenue, booking count)
- ✅ Standard Support
- ✅ Direct UPI payments (0% commission)
- ✅ All bookings go straight to your account

**Perfect for:** Single-turf owners starting out

---

### Tier 2: Pro Plan (Best Value) ⭐

**Pricing:**
- **₹3,000/month** (Annual billing) - *Save ₹12,000/year*
- **₹1,999/month** (Monthly billing)

**Features:**
- ✅ List up to 5 turfs
- ✅ All Basic features
- ✅ **Dynamic Pricing Control** (Peak/Off-peak hours)
- ✅ **Advanced Analytics Dashboard**
- ✅ **Priority Support**
- ✅ Direct UPI payments (0% commission)
- ✅ Multi-turf management

**Perfect for:** Established single-location businesses

**ROI Example:** 
- If your average booking is ₹800 and you get 10 bookings/month
- Commission-based loss: ₹800 × 10 × 15% = ₹1,200/month
- Pro Plan cost: ₹1,999/month
- After 17 bookings/month, Pro Plan becomes profitable!

---

### Tier 3: Enterprise Plan

**Pricing:** Custom - Contact Sales

**Features:**
- ✅ **Unlimited turfs**
- ✅ All Pro features
- ✅ **Dedicated Account Manager**
- ✅ **API Access** for integrations
- ✅ Custom analytics & reports
- ✅ **24/7 Premium Support**
- ✅ White-label options
- ✅ Custom contract terms

**Perfect for:** Large businesses with multiple locations

---

## 🔄 Complete User Journey

### For Commission-Based Turfs:

1. **Owner registers turf** → Selects "Commission-Based" payment
2. **User books turf** → Pays via Razorpay (automatic)
3. **Payment successful** → Booking confirmed instantly
4. **Platform takes 15%** → Owner receives 85% in payout

### For Tier-Based Turfs:

1. **Owner subscribes** to a tier plan
   - Visit `owner-subscription.html`
   - Choose plan (Basic/Pro/Enterprise)
   - Pay subscription fee
   - Upload payment screenshot
   - **Admin approves** → Subscription active

2. **Owner registers turf** → Selects "Tier-Based" payment
   - Must have active subscription
   - Must upload UPI QR code
   - Turf limits based on plan (Basic: 1, Pro: 5, Enterprise: ∞)

3. **User books turf** → System shows owner's UPI QR
   - User scans QR and pays owner directly
   - User uploads payment screenshot
   - Booking status: "Pending Verification"

4. **Owner verifies payment** in dashboard
   - View "Pending Verifications" tab
   - Check payment screenshot
   - Approve/Reject booking
   - **Approved** → Booking confirmed
   - **Rejected** → Booking cancelled, refund if needed

---

## 🎯 Implementation Details

### Database Schema

#### Turf Model
```javascript
{
  paymentMethod: 'commission' | 'tier',  // Required
  upiQrCode: {
    url: String,       // URL to UPI QR image
    publicId: String   // Cloudinary ID (if used)
  },
  upiId: String,       // Optional UPI ID
  subscription: ObjectId  // Link to Subscription if tier-based
}
```

#### Subscription Model
```javascript
{
  ownerId: ObjectId,
  plan: 'basic' | 'pro' | 'enterprise',
  billingCycle: 'monthly' | 'annual',
  price: Number,
  maxTurfs: Number,  // 1 for basic, 5 for pro, -1 for enterprise
  status: 'pending' | 'active' | 'expired' | 'cancelled',
  startDate: Date,
  endDate: Date,
  paymentProof: { url, uploadedAt },
  verifiedBy: ObjectId,
  features: {
    dynamicPricing: Boolean,
    advancedAnalytics: Boolean,
    prioritySupport: Boolean,
    ...
  }
}
```

#### Booking Model
```javascript
{
  tierPayment: {
    screenshot: {
      url: String,
      publicId: String
    },
    uploadedAt: Date,
    verificationStatus: 'pending' | 'approved' | 'rejected',
    verifiedBy: ObjectId,
    verifiedAt: Date,
    rejectionReason: String
  }
}
```

---

### API Endpoints

#### Owner Subscription Management
- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions/my-subscription` - Get current subscription
- `GET /api/subscriptions/plans` - Get available plans

#### Admin Subscription Approval
- `GET /api/subscriptions/admin/all` - Get all subscriptions
- `PUT /api/subscriptions/admin/:id/verify` - Approve/reject subscription

#### Tier Payment Verification (Owner)
- `GET /api/bookings/owner/pending-verifications` - Get pending payment verifications
- `PUT /api/bookings/:bookingId/verify-tier-payment` - Approve/reject payment

#### User Booking
- `POST /api/bookings` - Create booking (handles both payment types)
- `POST /api/bookings/:bookingId/tier-payment` - Upload payment screenshot

---

## 📱 Frontend Pages

### 1. **owner-subscription.html** (NEW)
Owner tier subscription page with:
- All 3 plan cards (Basic, Pro, Enterprise)
- Monthly/Annual toggle
- Payment modal with upload
- Current subscription status

### 2. **owner-dashboard.html** (UPDATED)
- "Subscription" tab → Shows current plan + link to subscribe
- "Pending Verifications" tab → Review user payment screenshots
- Turf registration → Payment method selection + UPI QR upload

### 3. **turf-details.html** (UPDATED)
- Commission turfs → Razorpay payment gateway
- Tier turfs → UPI QR modal + screenshot upload

### 4. **admin-dashboard.html** (EXISTING)
- "Subscriptions" tab → Approve/reject owner subscriptions
- View payment proofs
- Manage subscription status

---

## 🚀 Setup Instructions

### Backend Setup
1. Database models already updated (Turf, Booking, Subscription)
2. Controllers handle both payment methods automatically
3. Routes configured for tier payment flow

### Frontend Setup
1. **Add navigation link** in owner dashboard:
   ```html
   <a href="owner-subscription.html">Subscribe to Tier Plan</a>
   ```

2. **Owner workflow:**
   - Subscribe to plan → Upload payment → Admin approves
   - Register turf → Select "Tier-based" → Upload UPI QR
   - Monitor "Pending Verifications" tab → Approve bookings

3. **User workflow:**
   - Book tier-based turf → See UPI QR → Pay → Upload screenshot
   - Wait for owner approval → Receive confirmation

---

## 📈 Business Logic

### Subscription Validation
- **Creating tier-based turf:**
  - Check if owner has active subscription
  - Check if turf limit allows more turfs
  - Basic: max 1 turf
  - Pro: max 5 turfs
  - Enterprise: unlimited

### Payment Calculation
```javascript
// Commission-based
basePrice: ₹1000
platformFee: ₹150 (15%)
ownerEarnings: ₹850
userPays: ₹1000

// Tier-based
basePrice: ₹1000
platformFee: ₹0
ownerEarnings: ₹1000
userPays: ₹1000
```

### Subscription Lifecycle
1. **Pending** → Owner submits payment proof
2. **Active** → Admin approves + sets start/end date
3. **Expired** → End date passed
4. **Cancelled** → Owner/admin cancels

---

## ⚠️ Important Notes

### For Owners:
1. **UPI QR Code** must be accessible URL (use Imgur, ImgBB, Cloudinary)
2. **Check verifications daily** to approve bookings quickly
3. **Subscription must be active** before creating tier-based turfs
4. **Renewal required** before subscription expires

### For Admins:
1. **Verify payment proof** before approving subscriptions
2. **Set correct end date** based on billing cycle (monthly/annual)
3. **Monitor subscription status** and send renewal reminders

### For Users:
1. **Upload clear payment screenshot** showing amount and transaction ID
2. **Wait for owner approval** (may take few hours)
3. **Don't delete payment screenshot** until booking confirmed

---

## 🔐 Security Considerations

1. **Payment Proof Validation:**
   - Store screenshot URLs securely
   - Verify screenshots are accessible
   - Check for duplicate payment proofs

2. **Subscription Checks:**
   - Validate active subscription before allowing tier-based turfs
   - Prevent turf creation beyond plan limits
   - Auto-disable turfs if subscription expires

3. **Access Control:**
   - Only turf owner can verify their bookings
   - Only admins can approve subscriptions
   - Users can only upload payment for their bookings

---

## 💡 Revenue Comparison Example

**Scenario:** 100 bookings per month at ₹800 each

### Commission-Based Revenue (Owner):
- Gross: ₹80,000
- Commission (15%): -₹12,000
- **Net: ₹68,000**

### Tier-Based Revenue (Owner with Pro Plan):
- Gross: ₹80,000
- Subscription: -₹1,999
- **Net: ₹78,001**
- **Extra profit: ₹10,001/month** 🎉

**Break-even point:** ~17 bookings/month

---

## 🎨 UI/UX Features

### Subscription Page
- ✅ Beautiful gradient cards
- ✅ Monthly/Annual toggle with savings display
- ✅ Feature comparison
- ✅ Payment modal with instructions
- ✅ Current subscription status

### Owner Dashboard
- ✅ Subscription tab with plan details
- ✅ Verification tab with payment screenshots
- ✅ One-click approve/reject
- ✅ Badge showing pending count

### Booking Flow
- ✅ Automatic payment method detection
- ✅ UPI QR display for tier turfs
- ✅ Screenshot upload with preview
- ✅ Real-time status updates

---

## 📞 Support

For issues or questions:
- **Technical Support:** technical@turfspot.com
- **Enterprise Inquiries:** enterprise@turfspot.com
- **General Help:** support@turfspot.com

---

## 🎯 Next Steps

1. ✅ Test subscription flow end-to-end
2. ✅ Test tier-based booking with UPI payment
3. ✅ Test owner verification of payments
4. ✅ Verify admin can approve subscriptions
5. 📧 Set up email notifications for:
   - Subscription approval/rejection
   - Payment verification approval/rejection
   - Subscription renewal reminders
6. 📊 Add subscription analytics dashboard
7. 🔄 Implement auto-renewal with Razorpay

---

**Last Updated:** November 2025
**Version:** 2.0.0
