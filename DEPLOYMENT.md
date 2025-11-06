# 🚀 TurfSpot Deployment Guide

## Production URLs
- **Backend API**: https://turfspot.onrender.com
- **Frontend**: https://turfspot-1.onrender.com

## Backend Deployment (Render)

### Environment Variables Required
```env
PORT=4000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
```

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

## Frontend Deployment (Render)

### Static Site Settings
- **Build Command**: (Leave empty)
- **Publish Directory**: `/`
- **Auto-Deploy**: Enabled

### Frontend Files
All static files are served from the frontend directory:
- HTML files (index.html, turfs.html, etc.)
- CSS files (styles.css, etc.)
- JavaScript files (js/*.js)

## Post-Deployment Checklist

### Backend
- [x] MongoDB connection string configured
- [x] JWT secret configured
- [x] Razorpay credentials configured
- [x] Firebase credentials configured
- [x] Email service configured
- [x] CORS configured for frontend domain
- [x] Port configured (4000)
- [x] Production mode enabled

### Frontend
- [x] API base URL configured to backend
- [x] All HTML pages updated
- [x] All JavaScript modules working
- [x] Authentication flows tested
- [x] Booking system tested
- [x] Payment integration tested

## API Configuration

The frontend automatically detects the environment and uses the appropriate API URL:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'
    : 'https://turfspot.onrender.com/api';
```

## Testing Deployment

### Backend Health Check
```bash
curl https://turfspot.onrender.com/api/health
```

### Frontend Access
Visit: https://turfspot-1.onrender.com

### Test User Flow
1. Register new account
2. Verify email with OTP
3. Browse turfs
4. Make a booking
5. Process payment
6. View bookings

### Test Owner Flow
1. Register as owner
2. Add turf
3. Wait for admin approval
4. Manage bookings
5. View analytics

### Test Admin Flow
1. Login as admin
2. Approve turfs
3. Manage users
4. View platform analytics

## Monitoring

- Monitor Render dashboard for deployment status
- Check application logs for errors
- Monitor MongoDB Atlas for database performance
- Check Razorpay dashboard for payment transactions

## Common Issues

### CORS Errors
- Ensure backend CORS allows frontend domain
- Check browser console for specific errors

### Authentication Issues
- Verify JWT secret is consistent
- Check token expiration settings

### Payment Failures
- Verify Razorpay credentials
- Check test/live mode settings

### Email Not Sending
- Verify Gmail app password
- Check email service logs

## Rollback Plan

If deployment fails:
1. Check Render logs for errors
2. Verify environment variables
3. Test locally with production URLs
4. Rollback to previous commit if needed

## Support

For issues, check:
- Backend logs on Render
- Browser console errors
- MongoDB Atlas logs
- Email service logs
