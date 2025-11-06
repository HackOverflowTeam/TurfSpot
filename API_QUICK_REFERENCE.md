# TurfSpot API - Quick Reference Card

**Base URL:** `https://turfspot.onrender.com`

---

## 🔑 Authentication

```javascript
// Register
POST /api/auth/register
{ email, password, name, phone, role }

// Login
POST /api/auth/login
{ email, password }

// Get Current User
GET /api/auth/me
Authorization: Bearer {token}

// Update Profile
PUT /api/auth/profile
{ name?, phone? }

// Change Password
PUT /api/auth/change-password
{ currentPassword, newPassword }

// Google Auth
POST /api/auth/google
{ idToken }
```

---

## 👤 Users

```javascript
// Get User Profile
GET /api/users/{id}
Authorization: Bearer {token}
```

---

## 🏟️ Turfs

```javascript
// Browse Turfs
GET /api/turfs?page=1&limit=10&city=Delhi&sport=cricket&minPrice=100&maxPrice=500

// Get Turf Details
GET /api/turfs/{id}

// Get Available Slots
GET /api/turfs/{id}/available-slots?date=2025-11-05

// Create Turf (Owner/Admin)
POST /api/turfs
Authorization: Bearer {token}
{ name, description, address, contactInfo, sportsSupported, pricing, amenities, operatingHours, slotDuration }

// Update Turf (Owner/Admin)
PUT /api/turfs/{id}
Authorization: Bearer {token}
{ name?, description?, pricing?, isActive? }

// Delete Turf (Owner/Admin)
DELETE /api/turfs/{id}
Authorization: Bearer {token}

// Get Owner's Turfs (Owner/Admin)
GET /api/turfs/owner/my-turfs?status=approved
Authorization: Bearer {token}
```

---

## 📅 Bookings

```javascript
// Create Booking
POST /api/bookings
Authorization: Bearer {token}
{ turfId, bookingDate, timeSlot/timeSlots, sport }

// Get My Bookings
GET /api/bookings/my-bookings?status=confirmed&page=1&limit=10
Authorization: Bearer {token}

// Get Booking Details
GET /api/bookings/{id}
Authorization: Bearer {token}

// Verify Payment
POST /api/bookings/{id}/verify-payment
Authorization: Bearer {token}
{ razorpayPaymentId, razorpaySignature }

// Cancel Booking
PUT /api/bookings/{id}/cancel
Authorization: Bearer {token}
{ reason? }

// Get Owner's Bookings (Owner/Admin)
GET /api/bookings/owner/bookings?status=confirmed&page=1
Authorization: Bearer {token}
```

---

## 💳 Payments

```javascript
// Create Payment Order
POST /api/payments/create-order
Authorization: Bearer {token}
{ amount, currency?, receipt?, notes? }

// Get Payment Details
GET /api/payments/{paymentId}
Authorization: Bearer {token}
```

---

## 👨‍💼 Admin (Admin Only)

```javascript
// Dashboard
GET /api/admin/dashboard

// Get Pending Turfs
GET /api/admin/turfs/pending?page=1&limit=10

// Approve Turf
PUT /api/admin/turfs/{id}/approve

// Reject Turf
PUT /api/admin/turfs/{id}/reject
{ reason }

// Suspend Turf
PUT /api/admin/turfs/{id}/suspend
{ reason? }

// Get All Users
GET /api/admin/users?role=owner&page=1&limit=10&search=john

// Update User Status
PUT /api/admin/users/{id}/status
{ isActive }

// Get All Bookings
GET /api/admin/bookings?status=confirmed&page=1

// Mark Payout as Paid
PUT /api/admin/bookings/{id}/payout
{ transactionId?, paymentMethod?, notes? }

// Get Pending Payouts
GET /api/admin/payouts/pending?page=1&limit=10

// Get Payout History
GET /api/admin/payouts/history?page=1&startDate=2025-10-01&endDate=2025-10-31
```

---

## 📊 Analytics (Owner/Admin)

```javascript
// Owner Analytics
GET /api/analytics/owner?period=month&startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer {token}

// Revenue Report
GET /api/analytics/owner/revenue?turfId=123&startDate=2025-10-01&endDate=2025-10-31&groupBy=day
Authorization: Bearer {token}

// Booking Calendar
GET /api/analytics/owner/calendar?turfId=123&month=10&year=2025
Authorization: Bearer {token}
```

---

## 🏥 Health

```javascript
// Check API Status
GET /api/health
```

---

## Headers

```javascript
// All Requests
Content-Type: application/json

// Protected Endpoints
Authorization: Bearer {JWT_TOKEN}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Server Error |

---

## Common Response Structure

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    { "field": "fieldName", "message": "error" }
  ]
}
```

---

## Enums

### User Roles
```
user, owner, admin
```

### Turf Status
```
pending, approved, rejected, suspended
```

### Booking Status
```
pending, confirmed, cancelled, completed, no_show
```

### Sports
```
cricket, football, badminton, tennis, 
basketball, volleyball, hockey
```

### Amenities
```
parking, washroom, changing_room, first_aid,
drinking_water, cafeteria, seating_area,
floodlights, equipment_rental, scoreboard
```

### Payment Status
```
pending, completed, failed, refunded
```

---

## Time Formats

| Format | Example | Use Case |
|--------|---------|----------|
| Date (ISO 8601) | 2025-11-05T00:00:00Z | Booking date |
| Time (HH:MM) | 14:30 | Slot time |
| Pincode | 110001 | Address |
| Phone | 9876543210 | Contact |

---

## Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| Email | Valid format | user@example.com |
| Password | Min 6 chars | password123 |
| Phone | 10 digits | 9876543210 |
| Pincode | 6 digits | 110001 |
| Time | HH:MM format | 14:30 |
| Date | ISO 8601 | 2025-11-05 |

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No/invalid token | Add token to header |
| 403 Forbidden | Insufficient role | Use correct user role |
| 404 Not Found | Invalid resource | Verify resource ID |
| 409 Conflict | Slot taken/email exists | Try different slot/email |
| 429 Rate Limited | Too many requests | Wait and retry |

---

## Quick Code Snippets

### Fetch with Token
```javascript
const token = localStorage.getItem('token');
fetch('https://turfspot.onrender.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Get Available Slots
```javascript
fetch(`https://turfspot.onrender.com/api/turfs/${turfId}/available-slots?date=${date}`)
  .then(r => r.json())
  .then(data => console.log(data.data.availableSlots));
```

### Create Booking
```javascript
fetch('https://turfspot.onrender.com/api/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    turfId: 'turf_id',
    bookingDate: '2025-11-05T00:00:00Z',
    timeSlots: [{ startTime: '14:00', endTime: '15:00' }],
    sport: 'cricket'
  })
});
```

### Payment Verification
```javascript
fetch(`https://turfspot.onrender.com/api/bookings/${bookingId}/verify-payment`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    razorpayPaymentId: 'payment_id',
    razorpaySignature: 'signature'
  })
});
```

---

## Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Window:** 1 minute rolling window
- **Response:** 429 Too Many Requests

---

## Pagination

```javascript
// Query Parameters
?page=1&limit=10

// Response
{
  "data": { /* items */ },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

## Supported Platforms

- ✅ Web (React, Vue, Angular, etc.)
- ✅ Mobile (React Native, Flutter)
- ✅ Desktop (Electron)
- ✅ Any framework with HTTP support

---

## Documentation Files

| File | Content |
|------|---------|
| API_DOCS_PART_1_INTRODUCTION.md | Overview & setup |
| API_DOCS_PART_2_AUTH.md | Authentication |
| API_DOCS_PART_3_USERS.md | User management |
| API_DOCS_PART_4_TURFS.md | Turf endpoints |
| API_DOCS_PART_5_BOOKINGS.md | Booking endpoints |
| API_DOCS_PART_6_PAYMENTS.md | Payment integration |
| API_DOCS_PART_7_ADMIN.md | Admin operations |
| API_DOCS_PART_8_ANALYTICS.md | Analytics & reports |
| API_DOCS_PART_9_ERRORS.md | Error handling |
| API_DOCS_INDEX.md | Complete index |
| API_QUICK_REFERENCE.md | This file |

---

## Useful Resources

- **JWT Token Tester:** https://jwt.io
- **API Tester:** https://postman.com
- **Date Formatter:** https://momentjs.com
- **JSON Validator:** https://jsonlint.com

---

## Support

- 📧 Email: support@turfspot.com
- 📱 Phone: +91-XXXXXXXXXX
- 🐛 Issues: GitHub Issues
- 📚 Docs: Complete guides in documentation files

---

**Last Updated:** October 28, 2025  
**API Version:** 1.0  
**Status:** ✅ Production Ready
