# Email Verification Testing Checklist

## Pre-Testing Setup

### 1. Backend Server
- [x] Backend running on port 4000
- [x] MongoDB connected
- [x] No syntax errors in code

### 2. Environment Variables
- [x] EMAIL_HOST=smtp.gmail.com
- [x] EMAIL_PORT=587
- [x] EMAIL_USER=myfree.email.sender@gmail.com
- [x] EMAIL_PASSWORD configured (app-specific password)

### 3. Frontend Files
- [x] index.html has OTP modal
- [x] auth.js has OTP verification logic
- [x] api.js has OTP endpoints
- [x] All JavaScript files have no syntax errors

---

## Test Scenarios

### Test 1: New User Registration with Email Verification ✓

**Steps**:
1. Open `frontend/index.html` in browser
2. Click "Register" button
3. Fill in registration form:
   - Name: Test User
   - Email: YOUR_REAL_EMAIL@gmail.com (use real email to receive OTP)
   - Phone: 9876543210 (10 digits)
   - Password: test123 (6+ characters)
   - Role: Book Turfs
4. Click "Register"

**Expected Results**:
- ✅ Registration successful toast appears
- ✅ OTP modal opens automatically
- ✅ Email address is displayed in modal
- ✅ Email received with 6-digit OTP
- ✅ Email has TurfSpot branding
- ✅ OTP is valid for 10 minutes (mentioned in email)

**Actual Results**: _[To be filled during testing]_

---

### Test 2: OTP Verification ✓

**Steps**:
1. Complete Test 1
2. Check email inbox for OTP
3. Enter 6-digit OTP in modal
4. Click "Verify Email"

**Expected Results**:
- ✅ "Email verified successfully!" toast appears
- ✅ OTP modal closes
- ✅ Welcome email received
- ✅ User redirected to turfs.html (for users) or owner-dashboard.html (for owners)
- ✅ User can access full platform features

**Database Check**:
```javascript
// In MongoDB Compass or Shell
db.users.findOne({ email: "YOUR_EMAIL" })
// Should show: isEmailVerified: true
```

**Actual Results**: _[To be filled during testing]_

---

### Test 3: Invalid OTP ✓

**Steps**:
1. Register new user
2. Receive OTP email
3. Enter wrong 6-digit code (e.g., 000000)
4. Click "Verify Email"

**Expected Results**:
- ✅ Error toast: "Invalid OTP"
- ✅ Modal stays open
- ✅ Can try again with correct OTP
- ✅ Database still shows isEmailVerified: false

**Actual Results**: _[To be filled during testing]_

---

### Test 4: Resend OTP ✓

**Steps**:
1. Register new user
2. OTP modal appears
3. Click "Resend OTP" link
4. Check email for new OTP

**Expected Results**:
- ✅ "OTP sent to your email!" toast appears
- ✅ New OTP email received
- ✅ Old OTP should be invalid
- ✅ New OTP should work
- ✅ 10-minute timer resets

**Database Check**:
```javascript
// In MongoDB
db.users.findOne({ email: "YOUR_EMAIL" }, { emailOTP: 1, otpExpiry: 1 })
// otpExpiry should be ~10 minutes from now
```

**Actual Results**: _[To be filled during testing]_

---

### Test 5: Expired OTP ✓

**Steps**:
1. Register new user
2. Receive OTP
3. Wait 11+ minutes (or manually update otpExpiry in database to past)
4. Try to verify with OTP

**Expected Results**:
- ✅ Error toast: "OTP has expired. Please request a new OTP."
- ✅ Modal stays open
- ✅ User can click "Resend OTP"
- ✅ New OTP works correctly

**Manual Database Update** (to speed up test):
```javascript
db.users.updateOne(
  { email: "YOUR_EMAIL" },
  { $set: { otpExpiry: new Date(Date.now() - 1000) } }
)
```

**Actual Results**: _[To be filled during testing]_

---

### Test 6: Google OAuth Auto-Verification ✓

**Steps**:
1. Click "Register" or "Login"
2. Click "Continue with Google"
3. Sign in with Google account
4. Complete registration if new user

**Expected Results**:
- ✅ No OTP modal appears
- ✅ Email automatically verified
- ✅ User redirected to dashboard immediately
- ✅ Database shows isEmailVerified: true

**Database Check**:
```javascript
db.users.findOne({ email: "GOOGLE_EMAIL" })
// Should show: 
// authProvider: "google"
// isEmailVerified: true
// emailOTP: undefined
```

**Actual Results**: _[To be filled during testing]_

---

### Test 7: Already Verified User ✓

**Steps**:
1. Login with user who already verified email
2. Try to access `/api/auth/send-otp` endpoint

**API Test**:
```bash
# After logging in, copy token
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Results**:
- ✅ Error: "Email is already verified"
- ✅ No OTP email sent
- ✅ Database unchanged

**Actual Results**: _[To be filled during testing]_

---

## Email Content Verification

### OTP Email Checklist
- [ ] Subject: "Verify Your Email - TurfSpot"
- [ ] From: "TurfSpot <myfree.email.sender@gmail.com>"
- [ ] Contains user's name
- [ ] OTP displayed clearly (large font, centered)
- [ ] 10-minute expiry notice
- [ ] TurfSpot green branding (#10b981)
- [ ] Professional footer
- [ ] No broken images or formatting

### Welcome Email Checklist
- [ ] Subject: "Welcome to TurfSpot! 🏟️"
- [ ] From: "TurfSpot <myfree.email.sender@gmail.com>"
- [ ] Contains user's name
- [ ] Role-specific content (Owner vs User)
- [ ] Call-to-action button
- [ ] TurfSpot branding
- [ ] Professional footer

---

## Error Handling Tests

### Test 8: Network Error During Email Send ✓

**Steps**:
1. Temporarily disable internet or update EMAIL_PASSWORD to wrong value
2. Register new user
3. Check response

**Expected Results**:
- ✅ Registration still succeeds (user created)
- ✅ Token returned
- ✅ OTP modal appears
- ✅ Backend logs show email error
- ✅ User can still request OTP later

**Actual Results**: _[To be filled during testing]_

---

### Test 9: Database Connection Error ✓

**Steps**:
1. Stop MongoDB
2. Try to register
3. Check error handling

**Expected Results**:
- ✅ Graceful error message
- ✅ No server crash
- ✅ User informed of issue

**Actual Results**: _[To be filled during testing]_

---

## UI/UX Tests

### Test 10: OTP Modal UI ✓

**Visual Checks**:
- [ ] Modal centers on screen
- [ ] Email address displayed correctly
- [ ] OTP input has proper styling:
  - [ ] Centered text
  - [ ] Large font size
  - [ ] Letter spacing
  - [ ] 6-digit limit enforced
- [ ] Clock icon visible
- [ ] "10 minutes" text visible
- [ ] "Resend OTP" link styled correctly
- [ ] Close button (×) works
- [ ] Can close by clicking outside modal
- [ ] Mobile responsive (test on small screen)

### Test 11: Toast Notifications ✓

**Verify Toast Messages**:
- [ ] "Registration successful!" - Success (green)
- [ ] "OTP sent to your email!" - Success (green)
- [ ] "Email verified successfully!" - Success (green)
- [ ] "Invalid OTP" - Error (red)
- [ ] "OTP has expired" - Error (red)
- [ ] All toasts auto-dismiss after 3-5 seconds

---

## Performance Tests

### Test 12: Email Delivery Time ✓

**Measure**:
1. Click "Register"
2. Start timer
3. Check email inbox
4. Note time until OTP email arrives

**Expected**: < 10 seconds (usually 2-5 seconds)

**Actual**: _[To be filled]_ seconds

### Test 13: OTP Verification Speed ✓

**Measure**:
1. Enter OTP
2. Click "Verify Email"
3. Note time until success message

**Expected**: < 2 seconds

**Actual**: _[To be filled]_ seconds

---

## Security Tests

### Test 14: OTP Brute Force Protection ✓

**Steps**:
1. Register user
2. Try 10 different wrong OTPs rapidly

**Expected** (Current behavior):
- ✅ All attempts processed (no rate limiting yet)
- ✅ Correct OTP still works

**Future Enhancement**: Add rate limiting (max 5 attempts)

### Test 15: OTP Reuse Prevention ✓

**Steps**:
1. Register and verify email
2. Note the OTP used
3. Request new OTP
4. Try to use old OTP

**Expected Results**:
- ✅ Old OTP is invalid (overwritten)
- ✅ Only new OTP works

**Database Check**:
```javascript
// After requesting new OTP
db.users.findOne({ email: "YOUR_EMAIL" }, { emailOTP: 1 })
// Should show new OTP, not old one
```

---

## Integration Tests

### Test 16: Complete Registration → Turf Booking Flow ✓

**Full User Journey**:
1. Register new user
2. Verify email with OTP
3. Browse turfs
4. Book a turf
5. Make payment

**Expected Results**:
- ✅ All steps work smoothly
- ✅ No errors in any flow
- ✅ Booking confirmation email received

### Test 17: Complete Owner Registration → Turf Listing Flow ✓

**Full Owner Journey**:
1. Register as owner
2. Verify email with OTP
3. Add new turf (with file upload)
4. Submit for approval
5. Admin approves
6. Turf approval email received

**Expected Results**:
- ✅ All steps work smoothly
- ✅ Turf approval email sent
- ✅ Owner can manage turf

---

## Regression Tests

### Test 18: Existing Features Still Work ✓

**Verify**:
- [ ] Login with existing users still works
- [ ] Google OAuth still works
- [ ] Booking flow unchanged
- [ ] Payment flow unchanged
- [ ] Admin dashboard functional
- [ ] Owner dashboard functional

---

## Browser Compatibility

### Test 19: Cross-Browser Testing ✓

**Test in**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (iOS/Android)
- [ ] Mobile Safari (iOS)

**Check**:
- [ ] OTP modal displays correctly
- [ ] File upload works
- [ ] Email verification flow completes

---

## API Endpoint Tests

### Using cURL/Postman

**Test 20: Send OTP Endpoint**
```bash
# First register and get token
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "apitest@example.com",
    "phone": "9876543210",
    "password": "test123",
    "role": "user"
  }'

# Copy token from response, then:
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

**Test 21: Verify OTP Endpoint**
```bash
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otp": "123456"}'
```

**Expected Response** (if valid):
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "user": { /* user object */ }
  }
}
```

---

## Test Results Summary

### Overall Results
- **Total Tests**: 21
- **Passed**: _[To be filled]_
- **Failed**: _[To be filled]_
- **Skipped**: _[To be filled]_

### Critical Bugs Found
_[List any bugs found during testing]_

### Minor Issues Found
_[List any minor issues]_

### Performance Notes
_[Any performance observations]_

---

## Sign-Off

**Tested By**: _________________

**Date**: _________________

**Environment**:
- Node.js version: _________________
- MongoDB version: _________________
- Browser(s): _________________

**Notes**: 
_[Any additional notes]_

---

## Quick Test Commands

```bash
# Start backend
cd backend && npm start

# Open frontend
open frontend/index.html

# Check MongoDB
mongo turfspot

# View users collection
db.users.find().pretty()

# Check latest user
db.users.find().sort({createdAt: -1}).limit(1).pretty()

# Check user's OTP fields
db.users.findOne(
  { email: "test@example.com" },
  { isEmailVerified: 1, emailOTP: 1, otpExpiry: 1 }
)
```
