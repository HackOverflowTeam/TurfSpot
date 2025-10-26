# 🏟️ TurfSpot - Complete Turf Booking Platform

A full-stack web application for booking sports turfs with payment integration, built with Node.js backend and vanilla JavaScript frontend.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Default Credentials](#default-credentials)
- [Screenshots](#screenshots)

## ✨ Features

### 👥 For Users
- 🔍 **Search & Browse** - Find turfs by city, sport, price range, and amenities
- 📍 **Location-based Search** - Find turfs near your location
- 📅 **Real-time Availability** - Check available time slots instantly
- 💳 **Secure Payments** - Integrated Razorpay payment gateway
- 📱 **Booking Management** - View, track, and cancel bookings
- ⭐ **Reviews & Ratings** - See ratings and reviews from other users

### 🏢 For Turf Owners
- ➕ **List Turfs** - Add and manage multiple turf properties
- 📊 **Analytics Dashboard** - Track bookings, revenue, and performance
- 💰 **Revenue Tracking** - Monitor earnings and platform fees
- 📅 **Booking Calendar** - View all bookings in calendar format
- ✏️ **Easy Management** - Update pricing, amenities, and operating hours

### 👑 For Admins
- ✅ **Turf Approval** - Review and approve new turf listings
- 👥 **User Management** - Manage users and owners
- 📊 **Platform Analytics** - View comprehensive platform statistics
- 🚫 **Moderation** - Suspend problematic turfs or users
- 💵 **Revenue Monitoring** - Track platform revenue and fees

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** - Database (MongoDB Atlas)
- **JWT** - Authentication
- **Razorpay** - Payment processing
- **Firebase Admin** - Google authentication
- **Mongoose** - ODM

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling (with CSS Variables)
- **Vanilla JavaScript** - No frameworks
- **Razorpay Checkout** - Payment UI
- **Font Awesome** - Icons

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (already configured)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/sourabhyadav/Documents/turfspot
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the application**
   ```bash
   # From project root
   ./start.sh
   ```
   
   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   python3 -m http.server 3000
   ```

4. **Access the application**
   - Frontend: **http://localhost:3000**
   - Backend API: **http://localhost:4000/api**

## 📁 Project Structure

```
turfspot/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── config/            # Database, Firebase, Razorpay config
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth & validation middleware
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Helper utilities
│   │   └── server.js          # Entry point
│   ├── package.json
│   └── .env                   # Environment variables
│
├── frontend/                   # Vanilla JS frontend
│   ├── index.html             # Homepage
│   ├── turfs.html             # Browse turfs
│   ├── turf-details.html      # Turf details & booking
│   ├── my-bookings.html       # User bookings
│   ├── owner-dashboard.html   # Owner panel
│   ├── admin-dashboard.html   # Admin panel
│   ├── css/
│   │   └── styles.css         # Complete styling
│   └── js/
│       ├── api.js             # API service layer
│       ├── auth.js            # Authentication
│       ├── main.js            # Homepage
│       ├── turfs.js           # Turf listing
│       ├── turf-details.js    # Booking flow
│       ├── my-bookings.js     # Bookings management
│       ├── owner-dashboard.js # Owner features
│       └── admin-dashboard.js # Admin features
│
├── start.sh                    # Quick start script
└── README.md                   # This file
```

## 📚 API Documentation

Full API documentation is available in `backend/API_DOCUMENTATION.md`

### Base URL
```
http://localhost:4000/api
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/google` - Google authentication
- `GET /auth/me` - Get current user

#### Turfs
- `GET /turfs` - Get all turfs (with filters)
- `GET /turfs/:id` - Get turf details
- `GET /turfs/:id/available-slots` - Get available slots
- `POST /turfs` - Create turf (owner)
- `PUT /turfs/:id` - Update turf (owner)
- `DELETE /turfs/:id` - Delete turf (owner)

#### Bookings
- `POST /bookings` - Create booking
- `POST /bookings/:id/verify-payment` - Verify payment
- `GET /bookings/my-bookings` - Get user bookings
- `PUT /bookings/:id/cancel` - Cancel booking

#### Admin
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/turfs/pending` - Pending turfs
- `PUT /admin/turfs/:id/approve` - Approve turf
- `PUT /admin/turfs/:id/reject` - Reject turf
- `GET /admin/users` - Get all users

#### Analytics
- `GET /analytics/owner` - Owner analytics
- `GET /analytics/owner/revenue` - Revenue report
- `GET /analytics/owner/calendar` - Booking calendar

## 🔑 Default Credentials

### Admin
```
Email: admin@turfspot.com
Password: admin123456
```

### Test Owner
```
Email: owner1@example.com
Password: password123
```

### Test User
```
Email: user1@example.com
Password: password123
```

## 🎯 User Flows

### Booking a Turf (User)
1. Browse turfs or search by city/sport
2. Click on a turf to view details
3. Select date and available time slot
4. Enter player details
5. Complete payment via Razorpay
6. Receive booking confirmation

### Managing Turfs (Owner)
1. Register as owner
2. Add new turf with details
3. Wait for admin approval
4. View bookings for your turfs
5. Track revenue and analytics

### Platform Management (Admin)
1. Login to admin dashboard
2. Review pending turf submissions
3. Approve or reject turfs
4. Monitor users and bookings
5. View platform statistics

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Payment signature verification
- Input validation and sanitization
- CORS protection
- Rate limiting ready

## 💳 Payment Integration

- **Razorpay** integrated for payments
- Test mode enabled by default
- Automatic payment verification
- Refund support for cancellations
- Platform fee calculation (12%)

## 📱 Responsive Design

- Mobile-first approach
- Works on all screen sizes
- Touch-friendly interface
- Optimized for performance

## 🧪 Testing

### Using Postman
Import the collection: `backend/TurfSpot_API.postman_collection.json`

### Test Payments
Use Razorpay test cards:
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

## 📦 Database

- **MongoDB Atlas** - Cloud database
- Pre-configured connection
- Collections: users, turfs, bookings, reviews

## 🌟 Features Implemented

✅ User authentication (email & Google)  
✅ Turf search & filtering  
✅ Real-time slot availability  
✅ Booking with payment  
✅ Owner dashboard with analytics  
✅ Admin approval workflow  
✅ Booking cancellation & refunds  
✅ Revenue tracking  
✅ Responsive design  
✅ Role-based access control  

## 🚧 Future Enhancements

- [ ] Reviews and ratings system
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced analytics charts
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Social media sharing
- [ ] Loyalty programs

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
npm install
npm start
```

### Frontend not loading
```bash
cd frontend
python3 -m http.server 3000
```

### Payment not working
- Check Razorpay keys in `.env`
- Ensure backend is running
- Check browser console for errors

### CORS errors
- Backend should be on port 4000
- Frontend should be on port 3000
- Check CORS settings in `backend/src/server.js`

## 📄 License

This project is part of the TurfSpot platform.

## 🤝 Contributing

This is a complete implementation of the TurfSpot platform as per PRD.

## 📞 Support

For issues or questions:
1. Check `backend/API_DOCUMENTATION.md`
2. Check `backend/QUICK_REFERENCE.md`
3. Review implementation in `backend/IMPLEMENTATION_SUMMARY.md`

---

**Built with ❤️ for sports enthusiasts**

**Happy Booking! 🏏⚽🏀🎾🏸**
