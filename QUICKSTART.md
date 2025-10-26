# 🚀 Quick Start Guide - TurfSpot

## ✅ Fixed Issues

1. **Authentication Flow** - Fixed async initialization causing auto-logout
2. **CORS Configuration** - Added support for localhost:3000
3. **Dashboard Access** - Proper auth checking before page load

## 🏃 How to Run

### Step 1: Start Backend (Terminal 1)
```bash
cd /Users/sourabhyadav/Documents/turfspot/backend
npm start
```

**Expected Output:**
```
🚀 Server running in development mode on port 4000
✅ MongoDB Connected
```

### Step 2: Start Frontend (Terminal 2)
```bash
cd /Users/sourabhyadav/Documents/turfspot/frontend
python3 -m http.server 3000
```

**Expected Output:**
```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

### Step 3: Open Browser
Open: **http://localhost:3000**

---

## 🔑 Login Credentials

### Admin Dashboard Access
```
Email: admin@turfspot.com
Password: admin123456
URL: http://localhost:3000/admin-dashboard.html
```

### Owner Dashboard Access
```
Email: owner1@example.com
Password: password123
URL: http://localhost:3000/owner-dashboard.html
```

### User Account
```
Email: user1@example.com
Password: password123
URL: http://localhost:3000/my-bookings.html
```

---

## 🧪 Testing Steps

### Test Admin Dashboard:
1. Go to http://localhost:3000
2. Click "Login" button
3. Enter admin credentials
4. After successful login, click on "Admin" link in navigation
5. OR directly go to: http://localhost:3000/admin-dashboard.html
6. You should see:
   - Dashboard statistics
   - Pending turfs tab
   - All turfs, users, and bookings tabs

### Test Owner Dashboard:
1. Logout (if logged in as admin)
2. Login with owner credentials
3. Click "My Dashboard" in navigation
4. OR go to: http://localhost:3000/owner-dashboard.html
5. You should see:
   - Revenue statistics
   - My Turfs list
   - Add Turf button
   - Bookings and Analytics tabs

### Test User Features:
1. Logout
2. Login with user credentials
3. Browse turfs at http://localhost:3000/turfs.html
4. Click on a turf to view details
5. Book a slot (requires payment)
6. View bookings at http://localhost:3000/my-bookings.html

---

## 🐛 Troubleshooting

### Problem: "Automatically logged out when accessing dashboard"

**Solution:**
1. Open browser console (Press F12)
2. Run: `localStorage.clear()`
3. Close and reopen the browser
4. Go to http://localhost:3000
5. Login again
6. Now try accessing the dashboard

### Problem: "Backend not responding"

**Check if backend is running:**
```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Expected response:
# {"success":true,"message":"TurfSpot API is running",...}
```

**If port 4000 is busy:**
```bash
# Find and kill the process
lsof -i :4000
kill -9 <PID>

# Restart backend
cd backend
npm start
```

### Problem: "CORS Error"

**Make sure:**
- Backend is on port 4000
- Frontend is on port 3000
- Both are running on localhost

### Problem: "Cannot read token"

**Clear browser data:**
1. Open Console (F12)
2. Run: `localStorage.clear()`
3. Refresh page
4. Login again

---

## 📋 Feature Checklist

After logging in, you should be able to:

### ✅ Admin Features
- [ ] View dashboard statistics
- [ ] See pending turfs requiring approval
- [ ] Approve/reject turfs
- [ ] View all turfs
- [ ] Manage users
- [ ] View all bookings
- [ ] Suspend problematic turfs

### ✅ Owner Features
- [ ] Add new turf
- [ ] Edit turf details
- [ ] View bookings for your turfs
- [ ] See revenue analytics
- [ ] Track performance

### ✅ User Features
- [ ] Browse turfs
- [ ] Filter by city, sport, price
- [ ] View turf details
- [ ] Check available slots
- [ ] Make bookings
- [ ] View booking history
- [ ] Cancel bookings

---

## 🔧 Common Commands

### Backend Commands
```bash
# Start backend
cd backend && npm start

# Create admin user
cd backend && node src/scripts/createAdmin.js

# Seed sample data
cd backend && node src/scripts/seedData.js
```

### Frontend Commands
```bash
# Serve frontend
cd frontend && python3 -m http.server 3000

# Alternative (if you have npx)
cd frontend && npx serve -p 3000
```

### Debug Commands
```bash
# Check if ports are in use
lsof -i :4000
lsof -i :3000

# Test API
curl http://localhost:4000/api/health

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@turfspot.com","password":"admin123456"}'
```

---

## 🎯 URLs Reference

| Page | URL |
|------|-----|
| Homepage | http://localhost:3000/ |
| Browse Turfs | http://localhost:3000/turfs.html |
| Turf Details | http://localhost:3000/turf-details.html?id=XXX |
| My Bookings | http://localhost:3000/my-bookings.html |
| Owner Dashboard | http://localhost:3000/owner-dashboard.html |
| Admin Dashboard | http://localhost:3000/admin-dashboard.html |
| Testing Guide | http://localhost:3000/testing-guide.html |

---

## 📞 Still Having Issues?

1. **Check browser console** (F12) for errors
2. **Check backend logs** in the terminal
3. **Clear localStorage**: `localStorage.clear()`
4. **Restart both servers**
5. **Use incognito/private mode** to test

---

## ✨ Everything Working?

Once you can access the dashboards:

1. **As Admin:** Approve some pending turfs
2. **As Owner:** Add a new turf
3. **As User:** Make a test booking

**Happy Testing! 🎉**
