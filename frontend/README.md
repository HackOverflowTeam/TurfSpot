# TurfSpot Frontend

A modern, responsive web application for booking sports turfs built with HTML, CSS, and vanilla JavaScript.

## 🚀 Features

### For Users
- Browse and search turfs by city, sport, price, and amenities
- View detailed turf information with images and amenities
- Check real-time slot availability
- Book turfs with integrated Razorpay payment
- View and manage bookings
- Cancel bookings with refund

### For Turf Owners
- List and manage multiple turfs
- View bookings for all turfs
- Track revenue and analytics
- Update turf details and pricing

### For Admins
- Approve/reject turf listings
- Manage users and owners
- View platform statistics
- Monitor all bookings
- Suspend problematic turfs

## 📁 Project Structure

```
frontend/
├── index.html              # Homepage with search
├── turfs.html             # Browse turfs with filters
├── turf-details.html      # Turf details and booking
├── my-bookings.html       # User bookings
├── owner-dashboard.html   # Owner management panel
├── admin-dashboard.html   # Admin panel
├── css/
│   └── styles.css         # Complete styling
└── js/
    ├── api.js             # API service layer
    ├── auth.js            # Authentication management
    ├── main.js            # Homepage functionality
    ├── turfs.js           # Turf listing and filters
    ├── turf-details.js    # Booking and payment
    ├── my-bookings.js     # User bookings management
    ├── owner-dashboard.js # Owner features
    └── admin-dashboard.js # Admin features
```

## 🛠️ Setup

1. **No build required!** This is a pure HTML/CSS/JS application.

2. **Configure API endpoint** (already set to localhost:4000):
   - Open `js/api.js`
   - Update `API_BASE_URL` if your backend runs on a different port

3. **Open in browser**:
   ```bash
   # Option 1: Direct file open
   open index.html
   
   # Option 2: Use a simple HTTP server (recommended)
   python3 -m http.server 8000
   # or
   npx serve
   ```

4. **Access the application**:
   - http://localhost:8000 (if using HTTP server)
   - Or directly open index.html in your browser

## 🔌 Backend Integration

This frontend integrates with the TurfSpot backend API running on **http://localhost:4000/api**

### Required Backend Endpoints
All endpoints from the backend API documentation are integrated:

- **Auth**: /auth/register, /auth/login, /auth/me
- **Turfs**: /turfs, /turfs/:id, /turfs/:id/available-slots
- **Bookings**: /bookings, /bookings/my-bookings, /bookings/:id/cancel
- **Admin**: /admin/dashboard, /admin/turfs/pending, /admin/users
- **Analytics**: /analytics/owner

### Default Credentials (from backend)
```
Admin:
Email: admin@turfspot.com
Password: admin123456

Test Owner:
Email: owner1@example.com
Password: password123

Test User:
Email: user1@example.com
Password: password123
```

## 💳 Payment Integration

Uses **Razorpay** for payment processing:
- Razorpay Checkout integration in turf-details.js
- Payment verification through backend API
- Test mode configured by default

## 🎨 Features Implementation

### User Flow
1. **Search** → Enter city/sport on homepage
2. **Browse** → View turfs with filters (price, amenities, location)
3. **Select** → Click turf to view details
4. **Book** → Select date, slot, and complete payment
5. **Manage** → View/cancel bookings

### Owner Flow
1. **Register** → Create owner account
2. **Add Turf** → Submit turf for approval
3. **Manage** → Edit turf details, pricing
4. **Monitor** → View bookings and analytics

### Admin Flow
1. **Review** → Approve/reject pending turfs
2. **Monitor** → View platform statistics
3. **Manage** → Control users and turfs
4. **Analyze** → Track bookings and revenue

## 🌟 Key Features

- ✅ **Fully Responsive** - Works on desktop, tablet, and mobile
- ✅ **Real-time Updates** - Dynamic data from API
- ✅ **Secure Authentication** - JWT token-based auth
- ✅ **Role-based Access** - Different views for users/owners/admins
- ✅ **Payment Integration** - Razorpay checkout
- ✅ **Search & Filters** - Advanced filtering options
- ✅ **Modern UI** - Clean, professional design
- ✅ **No Dependencies** - Pure vanilla JavaScript

## 🔧 Customization

### Update API URL
Edit `js/api.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url:port/api';
```

### Update Styling
Edit `css/styles.css` - Uses CSS variables for easy theming:
```css
:root {
    --primary-color: #10b981;
    --secondary-color: #059669;
    /* ... */
}
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🐛 Troubleshooting

### CORS Issues
If you encounter CORS errors:
1. Make sure backend is running on port 4000
2. Backend should have CORS enabled for your frontend origin

### Payment Not Working
1. Check Razorpay script is loaded: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
2. Verify Razorpay key is configured in backend

### Authentication Issues
1. Clear localStorage: `localStorage.clear()`
2. Logout and login again
3. Check token in localStorage: `localStorage.getItem('token')`

## 📝 Notes

- All bookings require authentication
- Owners need admin approval for turfs
- Payment is mandatory for booking confirmation
- Cancellations trigger refund process
- Admin credentials are required for admin dashboard

## 🚀 Deployment

For production deployment:

1. Update API_BASE_URL to production backend URL
2. Enable HTTPS
3. Update Razorpay keys to production keys
4. Deploy to any static hosting:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront

## 📄 License

Part of the TurfSpot platform.

## 🤝 Support

For issues or questions, refer to the backend API documentation.

---

**Happy Booking! 🏏⚽🏀**
