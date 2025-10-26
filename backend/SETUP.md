# TurfSpot Backend - Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
The `.env` file is already configured with your credentials. Verify the settings:
- ✅ MongoDB URI
- ✅ Firebase Admin SDK
- ✅ Razorpay credentials
- ✅ JWT secret

### 3. Create Admin User
```bash
node src/scripts/createAdmin.js
```

This will create an admin account:
- **Email**: admin@turfspot.com
- **Password**: admin123456

⚠️ **Change the password after first login!**

### 4. (Optional) Seed Sample Data
```bash
node src/scripts/seedData.js
```

This creates:
- 1 Admin user
- 1 Owner user (with 2 turfs)
- 1 Regular user

**Login Credentials:**
- Admin: `admin@turfspot.com` / `admin123456`
- Owner: `owner1@example.com` / `password123`
- User: `user1@example.com` / `password123`

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on: **http://localhost:5000**

### 6. Test the API

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "TurfSpot API is running",
  "timestamp": "2024-10-26T..."
}
```

---

## 📋 API Testing

### Option 1: Postman
Import the collection file: `TurfSpot_API.postman_collection.json`

### Option 2: cURL Examples

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "9876543210",
    "role": "user"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get turfs:**
```bash
curl http://localhost:5000/api/turfs
```

**Get turfs in Mumbai:**
```bash
curl "http://localhost:5000/api/turfs?city=Mumbai"
```

---

## 🔑 User Roles & Permissions

### User (Player)
- Browse and search turfs
- Create bookings
- Make payments
- View booking history
- Cancel bookings

### Owner
- Register turfs
- Manage turf information
- View bookings for their turfs
- Access analytics dashboard
- View revenue reports

### Admin
- Approve/reject turf registrations
- View all users and turfs
- View all bookings
- Manage user accounts
- Access platform analytics

---

## 🌐 API Endpoints Overview

### Authentication (`/api/auth`)
- POST `/register` - Register with email/password
- POST `/login` - Login with email/password
- POST `/google` - Login/Register with Google
- GET `/me` - Get current user (protected)
- PUT `/profile` - Update profile (protected)
- PUT `/change-password` - Change password (protected)

### Turfs (`/api/turfs`)
- GET `/` - Get all approved turfs (with filters)
- GET `/:id` - Get single turf details
- GET `/:id/available-slots` - Get available time slots
- POST `/` - Create turf (owner only)
- PUT `/:id` - Update turf (owner only)
- DELETE `/:id` - Delete turf (owner only)
- GET `/owner/my-turfs` - Get owner's turfs (owner only)

### Bookings (`/api/bookings`)
- POST `/` - Create booking
- POST `/:id/verify-payment` - Verify Razorpay payment
- GET `/my-bookings` - Get user's bookings
- GET `/:id` - Get single booking
- PUT `/:id/cancel` - Cancel booking
- GET `/owner/bookings` - Get owner's bookings (owner only)

### Admin (`/api/admin`)
- GET `/dashboard` - Dashboard statistics
- GET `/turfs/pending` - Pending turf approvals
- PUT `/turfs/:id/approve` - Approve turf
- PUT `/turfs/:id/reject` - Reject turf
- PUT `/turfs/:id/suspend` - Suspend turf
- GET `/users` - Get all users
- PUT `/users/:id/status` - Update user status
- GET `/bookings` - Get all bookings

### Analytics (`/api/analytics`)
- GET `/owner` - Owner analytics
- GET `/owner/revenue` - Revenue report
- GET `/owner/calendar` - Booking calendar

---

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get token from login/register response:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 💳 Payment Flow

1. **Create Booking**: POST `/api/bookings`
   - Returns Razorpay order details
   
2. **Client-side**: Use Razorpay Checkout
   - Display payment interface
   - Collect payment details
   
3. **Verify Payment**: POST `/api/bookings/:id/verify-payment`
   - Verify signature
   - Confirm booking

---

## 📊 Sample Workflow

### For Users:
1. Register/Login
2. Browse turfs (filter by city, sport, price)
3. View turf details
4. Check available slots
5. Create booking
6. Complete payment
7. Receive confirmation

### For Owners:
1. Register as owner
2. Create turf listing
3. Wait for admin approval
4. Manage bookings
5. View analytics

### For Admins:
1. Login as admin
2. Review pending turfs
3. Approve/Reject turfs
4. Monitor platform activity
5. Manage users

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB Connection Error
```
**Solution**: Check `MONGODB_URI` in `.env` file

### Firebase Error
```
❌ Firebase initialization error
```
**Solution**: Verify Firebase credentials in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change `PORT` in `.env` or kill process using port 5000

### Razorpay Error
```
Payment creation failed
```
**Solution**: Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Firebase token verification
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ MongoDB injection protection
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation & sanitization

---

## 📝 Notes

- Default platform commission: **12%**
- Booking cancellation: Minimum **2 hours** before slot
- Refund amount: **90%** of total payment
- Slot durations: 30, 60, 90, or 120 minutes
- JWT token expiry: **7 days**

---

## 🆘 Support

For issues or questions:
- Check API documentation in `README.md`
- Review Postman collection for examples
- Verify environment variables in `.env`

---

## ✅ Ready to Go!

Your TurfSpot backend is now set up and ready to use! 🎉

Start the server and begin testing the API endpoints.
