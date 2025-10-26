# TurfSpot API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [...]
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

---

## 🔐 Authentication Endpoints

### 1. Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "9876543210",
  "role": "user"  // "user" or "owner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

### 2. Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Google Authentication
```http
POST /auth/google
```

**Request Body:**
```json
{
  "idToken": "firebase_id_token",
  "role": "user",
  "phone": "9876543210"  // required for new users
}
```

### 4. Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### 5. Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "9876543210",
  "profileImage": "https://..."
}
```

### 6. Change Password
```http
PUT /auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

---

## 🏟️ Turf Endpoints

### 1. Get All Turfs
```http
GET /turfs?city=Mumbai&sport=cricket&minPrice=500&maxPrice=2000&page=1&limit=10
```

**Query Parameters:**
- `city` - Filter by city
- `sport` - Filter by sport (cricket, football, etc.)
- `minPrice` - Minimum hourly rate
- `maxPrice` - Maximum hourly rate
- `amenities` - Comma-separated amenities (parking,floodlights)
- `latitude` - User's latitude for nearby search
- `longitude` - User's longitude for nearby search
- `maxDistance` - Max distance in meters (default: 10000)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: createdAt)
- `order` - Sort order: asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "...",
      "name": "Cricket Arena",
      "description": "Premium cricket turf",
      "address": {...},
      "pricing": {
        "hourlyRate": 1500,
        "weekendRate": 2000
      },
      "sportsSupported": ["cricket"],
      "amenities": ["parking", "floodlights"],
      "rating": {
        "average": 4.5,
        "count": 23
      },
      "images": [...]
    }
  ]
}
```

### 2. Get Turf by ID
```http
GET /turfs/:id
```

### 3. Get Available Slots
```http
GET /turfs/:id/available-slots?date=2024-10-27
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "startTime": "06:00",
      "endTime": "07:00",
      "isAvailable": true
    },
    {
      "startTime": "07:00",
      "endTime": "08:00",
      "isAvailable": false
    }
  ]
}
```

### 4. Create Turf (Owner Only)
```http
POST /turfs
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Cricket Arena",
  "description": "Premium cricket turf with all facilities",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "landmark": "Near Central Mall"
  },
  "location": {
    "coordinates": [72.8777, 19.0760]
  },
  "contactInfo": {
    "phone": "9876543210",
    "email": "info@arena.com",
    "alternatePhone": "9876543211"
  },
  "sportsSupported": ["cricket", "football"],
  "pricing": {
    "hourlyRate": 1500,
    "weekendRate": 2000
  },
  "images": [
    {
      "url": "https://...",
      "isPrimary": true
    }
  ],
  "amenities": ["parking", "floodlights", "washroom"],
  "operatingHours": {
    "monday": { "open": "06:00", "close": "22:00", "isOpen": true },
    "tuesday": { "open": "06:00", "close": "22:00", "isOpen": true }
  },
  "slotDuration": 60
}
```

### 5. Update Turf
```http
PUT /turfs/:id
Authorization: Bearer <token>
```

### 6. Delete Turf
```http
DELETE /turfs/:id
Authorization: Bearer <token>
```

### 7. Get My Turfs (Owner Only)
```http
GET /turfs/owner/my-turfs
Authorization: Bearer <token>
```

---

## 📅 Booking Endpoints

### 1. Create Booking
```http
POST /bookings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "turfId": "turf_id_here",
  "bookingDate": "2024-10-27",
  "timeSlot": {
    "startTime": "18:00",
    "endTime": "19:00"
  },
  "sport": "cricket",
  "playerDetails": {
    "name": "John Doe",
    "phone": "9876543210",
    "numberOfPlayers": 10
  },
  "notes": "Birthday celebration"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {...},
    "razorpayOrder": {
      "orderId": "order_xxx",
      "amount": 177000,
      "currency": "INR",
      "keyId": "rzp_test_xxx"
    }
  }
}
```

### 2. Verify Payment
```http
POST /bookings/:id/verify-payment
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

### 3. Get My Bookings
```http
GET /bookings/my-bookings?status=confirmed&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, cancelled, completed)
- `page` - Page number
- `limit` - Items per page

### 4. Get Booking by ID
```http
GET /bookings/:id
Authorization: Bearer <token>
```

### 5. Cancel Booking
```http
PUT /bookings/:id/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Plans changed"
}
```

### 6. Get Owner Bookings (Owner Only)
```http
GET /bookings/owner/bookings?turfId=xxx&status=confirmed&startDate=2024-10-01&endDate=2024-10-31
Authorization: Bearer <token>
```

---

## 👑 Admin Endpoints

### 1. Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalOwners": 25,
      "totalTurfs": 50,
      "approvedTurfs": 45,
      "pendingTurfs": 5,
      "totalBookings": 500,
      "completedBookings": 450,
      "platformRevenue": 54000
    },
    "recentBookings": [...],
    "monthlyRevenue": [...]
  }
}
```

### 2. Get Pending Turfs
```http
GET /admin/turfs/pending?page=1&limit=10
Authorization: Bearer <admin_token>
```

### 3. Approve Turf
```http
PUT /admin/turfs/:id/approve
Authorization: Bearer <admin_token>
```

### 4. Reject Turf
```http
PUT /admin/turfs/:id/reject
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Incomplete information provided"
}
```

### 5. Suspend Turf
```http
PUT /admin/turfs/:id/suspend
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Multiple complaints received"
}
```

### 6. Get All Users
```http
GET /admin/users?role=user&page=1&limit=20
Authorization: Bearer <admin_token>
```

### 7. Update User Status
```http
PUT /admin/users/:id/status
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "isActive": false
}
```

### 8. Get All Bookings
```http
GET /admin/bookings?status=confirmed&startDate=2024-10-01&endDate=2024-10-31
Authorization: Bearer <admin_token>
```

---

## 📊 Analytics Endpoints (Owner Only)

### 1. Get Owner Analytics
```http
GET /analytics/owner?turfId=xxx&period=30
Authorization: Bearer <token>
```

**Query Parameters:**
- `turfId` - Specific turf ID (optional)
- `period` - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalBookings": 45,
      "completedBookings": 40,
      "totalRevenue": 67500,
      "platformFees": 8100,
      "netRevenue": 59400
    },
    "dailyBookings": [...],
    "popularSlots": [...],
    "sportBreakdown": [...],
    "statusBreakdown": [...]
  }
}
```

### 2. Get Revenue Report
```http
GET /analytics/owner/revenue?turfId=xxx&startDate=2024-10-01&endDate=2024-10-31
Authorization: Bearer <token>
```

### 3. Get Booking Calendar
```http
GET /analytics/owner/calendar?turfId=xxx&month=10&year=2024
Authorization: Bearer <token>
```

---

## 💳 Payment Endpoints

### 1. Create Payment Order
```http
POST /payments/create-order
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 1500,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "purpose": "Turf booking"
  }
}
```

### 2. Get Payment Details
```http
GET /payments/:paymentId
Authorization: Bearer <token>
```

---

## 📋 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🎯 Common Use Cases

### User Journey
1. Register/Login → Get token
2. Browse turfs → `GET /turfs`
3. View turf details → `GET /turfs/:id`
4. Check availability → `GET /turfs/:id/available-slots`
5. Create booking → `POST /bookings`
6. Complete payment → Razorpay integration
7. Verify payment → `POST /bookings/:id/verify-payment`

### Owner Journey
1. Register as owner → `POST /auth/register` (role: owner)
2. Create turf → `POST /turfs`
3. Wait for admin approval
4. View bookings → `GET /bookings/owner/bookings`
5. Check analytics → `GET /analytics/owner`

### Admin Journey
1. Login as admin
2. View pending turfs → `GET /admin/turfs/pending`
3. Approve/Reject turfs → `PUT /admin/turfs/:id/approve`
4. Monitor platform → `GET /admin/dashboard`

---

## 🔒 Security Notes

1. **Never expose** sensitive credentials in client code
2. Store tokens securely (e.g., httpOnly cookies or secure storage)
3. Implement proper error handling
4. Use HTTPS in production
5. Validate all user inputs
6. Implement rate limiting on client side
7. Handle expired tokens gracefully

---

## 📌 Notes

- All dates should be in ISO 8601 format
- Time slots use 24-hour format (HH:MM)
- Prices are in INR (Indian Rupees)
- Phone numbers are 10 digits
- Pincodes are 6 digits
- Coordinates: [longitude, latitude]
