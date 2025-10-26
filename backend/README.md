# TurfSpot Backend API

RESTful API for TurfSpot - Sports Turf Booking Platform

## Features

- 🔐 **Authentication**: Email/Password & Google OAuth (Firebase)
- 🏟️ **Turf Management**: CRUD operations with admin approval workflow
- 📅 **Booking System**: Real-time slot availability & booking management
- 💳 **Payment Integration**: Razorpay payment gateway with refund support
- 📊 **Analytics**: Owner dashboard with revenue tracking
- 👥 **Role-Based Access**: User, Owner, and Admin roles
- 🔒 **Security**: JWT tokens, rate limiting, data sanitization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Admin SDK + JWT
- **Payment**: Razorpay
- **Validation**: Express Validator

## Prerequisites

- Node.js v16 or higher
- MongoDB Atlas account or local MongoDB
- Firebase project with Admin SDK
- Razorpay account (test mode)

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Update `.env` file with your credentials:
   - MongoDB connection string
   - Firebase Admin SDK credentials
   - Razorpay API keys
   - JWT secret

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login/Register with Google
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Turfs
- `GET /api/turfs` - Get all approved turfs (with filters)
- `GET /api/turfs/:id` - Get single turf
- `GET /api/turfs/:id/available-slots` - Get available slots
- `POST /api/turfs` - Create turf (Owner only)
- `PUT /api/turfs/:id` - Update turf (Owner only)
- `DELETE /api/turfs/:id` - Delete turf (Owner only)
- `GET /api/turfs/owner/my-turfs` - Get owner's turfs

### Bookings
- `POST /api/bookings` - Create booking
- `POST /api/bookings/:id/verify-payment` - Verify payment
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/owner/bookings` - Get owner's bookings

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/turfs/pending` - Get pending turfs
- `PUT /api/admin/turfs/:id/approve` - Approve turf
- `PUT /api/admin/turfs/:id/reject` - Reject turf
- `PUT /api/admin/turfs/:id/suspend` - Suspend turf
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/bookings` - Get all bookings

### Analytics
- `GET /api/analytics/owner` - Get owner analytics
- `GET /api/analytics/owner/revenue` - Get revenue report
- `GET /api/analytics/owner/calendar` - Get booking calendar

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `GET /api/payments/:paymentId` - Get payment details

## Query Parameters

### Get Turfs
```
GET /api/turfs?city=Mumbai&sport=cricket&minPrice=500&maxPrice=2000&amenities=parking,floodlights
```

### Get Bookings
```
GET /api/bookings/my-bookings?status=confirmed&page=1&limit=10
```

### Get Analytics
```
GET /api/analytics/owner?turfId=123&period=30
```

## Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Responses

```json
{
  "success": false,
  "message": "Error message here",
  "errors": []
}
```

## Success Responses

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

## Role-Based Access Control

- **User**: Can browse turfs, make bookings
- **Owner**: Can create/manage turfs, view analytics
- **Admin**: Full access, approve turfs, manage users

## Security Features

- ✅ Helmet.js for security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ MongoDB injection protection
- ✅ JWT token authentication
- ✅ Firebase token verification
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization

## Database Models

### User
- Email/password or Google authentication
- Roles: user, owner, admin
- Profile information

### Turf
- Owner reference
- Location and address
- Pricing and amenities
- Operating hours
- Approval status

### Booking
- User and turf references
- Date and time slot
- Payment information
- Status tracking

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (development/production) |
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase private key |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRE` | JWT expiration time |
| `PLATFORM_COMMISSION` | Platform commission percentage |

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

ISC

## Support

For support, email support@turfspot.com
