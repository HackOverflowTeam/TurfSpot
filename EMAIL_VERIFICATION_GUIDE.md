# Email Verification System - TurfSpot

## Overview
TurfSpot now includes a comprehensive email verification system using OTP (One-Time Password) sent via Gmail SMTP. This ensures users have valid email addresses and enhances platform security.

## Features Implemented

### 1. **Backend Components**

#### Email Service (`backend/src/utils/emailService.js`)
- **Gmail SMTP Integration**: Uses nodemailer with Gmail's SMTP server
- **OTP Generation**: Creates secure 6-digit random OTPs
- **Professional Email Templates**:
  - **OTP Verification Email**: Sends verification code with 10-minute expiry
  - **Welcome Email**: Sent after successful email verification
  - **Booking Confirmation**: Existing feature for booking details
  - **Turf Approval/Rejection**: Existing feature for owner notifications

#### User Model Updates (`backend/src/models/User.model.js`)
Added new fields:
```javascript
isEmailVerified: { type: Boolean, default: false }  // Email verification status
emailOTP: { type: String, select: false }           // Stored OTP (hidden by default)
otpExpiry: { type: Date, select: false }            // OTP expiration time
```

#### Auth Controller (`backend/src/controllers/auth.controller.js`)
**Modified Endpoints**:
- `POST /api/auth/register`: Now generates and sends OTP upon registration
- `POST /api/auth/google`: Auto-verifies email for Google OAuth users

**New Endpoints**:
- `POST /api/auth/send-otp`: Resend OTP to user's email
- `POST /api/auth/verify-otp`: Verify submitted OTP and mark email as verified

#### Auth Routes (`backend/src/routes/auth.routes.js`)
Added routes with validation:
```javascript
router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTPValidation, validate, verifyOTP);
```

### 2. **Frontend Components**

#### OTP Modal (`frontend/index.html`)
Beautiful email verification UI with:
- Envelope icon for visual appeal
- Display of user's email address
- 6-digit OTP input field with center alignment
- 10-minute timer indicator
- Resend OTP option
- Responsive design matching TurfSpot theme

#### Auth Manager (`frontend/js/auth.js`)
Enhanced with:
- `sendOTP()`: Request new OTP
- `verifyOTP()`: Submit OTP for verification
- `openOtpModal()`: Display OTP verification modal
- Modified registration flow to trigger OTP modal

#### API Service (`frontend/js/api.js`)
New API methods:
```javascript
async sendOTP()           // POST /api/auth/send-otp
async verifyOTP(otpData)  // POST /api/auth/verify-otp
```

## User Flow

### Registration Flow (Email/Password)
1. User fills registration form
2. Backend creates user account with `isEmailVerified: false`
3. Backend generates 6-digit OTP and stores with 10-minute expiry
4. Backend sends professional OTP email via Gmail SMTP
5. Frontend shows OTP verification modal
6. User enters OTP from email
7. Backend verifies OTP and marks email as verified
8. Backend sends welcome email
9. User is redirected to appropriate dashboard

### Google OAuth Flow
- Email automatically marked as verified (Google verifies emails)
- No OTP required
- Welcome email sent (optional)

### Resend OTP Flow
1. User clicks "Resend OTP" link
2. Backend generates new OTP
3. Previous OTP is invalidated
4. New OTP email sent
5. 10-minute timer resets

## Email Configuration

### Environment Variables (.env)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=myfree.email.sender@gmail.com
EMAIL_PASSWORD=diby oxuo irkp afhu  # App-specific password
```

### Gmail Setup
The system uses Gmail's SMTP server with an app-specific password:
- **Host**: smtp.gmail.com
- **Port**: 587 (STARTTLS)
- **Security**: TLS encryption
- **Authentication**: App-specific password (not regular Gmail password)

**Important**: The EMAIL_PASSWORD is a Gmail app-specific password, not your regular Gmail password. This is required for security when using SMTP.

## Email Templates

### OTP Verification Email
- **Subject**: "Verify Your Email - TurfSpot"
- **Content**:
  - TurfSpot branding with gradient header
  - Personalized greeting
  - Large, easy-to-read OTP code
  - 10-minute expiry notice
  - Security notice (if user didn't request)
  - Professional footer with copyright

### Welcome Email
- **Subject**: "Welcome to TurfSpot! 🏟️"
- **Content**:
  - Congratulations message
  - Role-specific benefits (Owner vs User)
  - Call-to-action button
  - Professional branding

## Security Features

### OTP Security
- **Random Generation**: Cryptographically random 6-digit codes
- **Time-Limited**: 10-minute expiration window
- **One-Time Use**: OTP deleted after successful verification
- **Stored Securely**: `select: false` prevents accidental exposure
- **Invalidation**: Old OTP invalidated when requesting new one

### Email Security
- **TLS Encryption**: All emails sent via encrypted connection
- **App Password**: Uses secure app-specific password
- **Validation**: Email format validation on registration
- **Unique Emails**: Prevents duplicate registrations

## Testing Guide

### Test Registration Flow
1. **Start Backend**: `cd backend && npm start`
2. **Open Frontend**: Open `index.html` in browser
3. **Register New User**:
   - Click "Register" button
   - Fill in: Name, Email, Phone (10 digits), Password (6+ chars), Role
   - Submit form
4. **Check Email**: Look for OTP email in inbox
5. **Verify OTP**:
   - Enter 6-digit code in modal
   - Click "Verify Email"
6. **Check Welcome Email**: Should receive welcome email
7. **Verify Database**: User should have `isEmailVerified: true`

### Test Resend OTP
1. Complete steps 1-4 above
2. Click "Resend OTP" link in modal
3. Check email for new OTP
4. Old OTP should be invalid
5. New OTP should work

### Test OTP Expiry
1. Register and receive OTP
2. Wait 10+ minutes
3. Try to verify with expired OTP
4. Should show error: "OTP has expired"
5. Request new OTP

### Test Invalid OTP
1. Register and receive OTP
2. Enter incorrect 6-digit code
3. Should show error: "Invalid OTP"
4. Correct OTP should still work (until expiry)

## API Endpoints

### Send OTP
```http
POST /api/auth/send-otp
Authorization: Bearer <token>
```

**Response** (Success):
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Authorization: Bearer <token>
Content-Type: application/json

{
  "otp": "123456"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "user": { /* user object with isEmailVerified: true */ }
  }
}
```

**Response** (Error - Invalid OTP):
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

**Response** (Error - Expired OTP):
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

## Database Schema Changes

### Before
```javascript
{
  email: String,
  isVerified: Boolean,  // General verification
  // ... other fields
}
```

### After
```javascript
{
  email: String,
  isVerified: Boolean,        // General verification (existing)
  isEmailVerified: Boolean,   // Email-specific verification (NEW)
  emailOTP: String,           // Current OTP (NEW, hidden)
  otpExpiry: Date,            // OTP expiration time (NEW, hidden)
  // ... other fields
}
```

## UI/UX Design

### OTP Modal Styling
- **Clean Design**: Minimalist modal with focus on OTP input
- **Brand Colors**: TurfSpot green (#10b981) accents
- **Clear Typography**: Large, centered OTP input with letter spacing
- **Visual Hierarchy**: Icon → Title → Email → OTP Input → CTA
- **Accessibility**: High contrast, clear labels, keyboard navigation
- **Mobile Responsive**: Works on all screen sizes

### User Feedback
- **Toast Notifications**: Success/error messages for all actions
- **Email Display**: Shows user's email in modal for confirmation
- **Timer Display**: Clock icon with "10 minutes" text
- **Loading States**: Button disabled during submission
- **Error Handling**: Clear error messages for all failure cases

## Troubleshooting

### OTP Email Not Received
**Possible Causes**:
1. Email in spam folder
2. Gmail SMTP credentials incorrect
3. App password expired
4. Network/firewall blocking SMTP port 587

**Solutions**:
1. Check spam/junk folder
2. Verify EMAIL_USER and EMAIL_PASSWORD in .env
3. Regenerate Gmail app password
4. Check firewall settings for port 587

### OTP Verification Fails
**Possible Causes**:
1. OTP expired (>10 minutes)
2. Incorrect OTP entered
3. Database connection issue
4. OTP field not selected from DB

**Solutions**:
1. Request new OTP
2. Carefully re-enter OTP from email
3. Check MongoDB connection
4. Ensure query includes `.select('+emailOTP +otpExpiry')`

### Welcome Email Not Sent
**Non-Critical**: If welcome email fails, verification still succeeds
- Check console logs for email errors
- Verify Gmail SMTP connection
- Ensure sendWelcomeEmail is not throwing errors

## Future Enhancements

### Potential Improvements
1. **SMS OTP**: Add phone verification with SMS OTP
2. **Email Templates**: More email types (password reset, booking reminders)
3. **Rate Limiting**: Prevent OTP spam (max 5 requests per hour)
4. **Analytics**: Track verification rates and email delivery
5. **Customizable Expiry**: Allow admins to configure OTP expiry time
6. **Multi-Language**: Support for regional language emails
7. **Email Preferences**: Let users choose email notification types

## Dependencies

### Backend
- **nodemailer**: ^6.x - Email sending library
- **express-validator**: Form validation for OTP
- **mongoose**: Database with OTP fields

### Frontend
- **Vanilla JavaScript**: No additional dependencies
- **Font Awesome**: Icons for email/clock/check
- **Existing CSS**: Modal styling from TurfSpot theme

## Deployment Notes

### Production Checklist
- [ ] Update FRONTEND_URL in .env for production domain
- [ ] Ensure Gmail app password is valid
- [ ] Test email delivery from production server
- [ ] Configure SPF/DKIM records (optional, for better deliverability)
- [ ] Monitor email sending logs
- [ ] Set up error alerting for failed emails
- [ ] Consider email service upgrade (SendGrid/AWS SES) for scale

### Email Service Alternatives
For production scale, consider:
- **SendGrid**: 100 emails/day free, excellent deliverability
- **AWS SES**: $0.10 per 1000 emails, highly scalable
- **Mailgun**: 5000 emails/month free, good analytics
- **Postmark**: Premium transactional emails

## Support

### Email Issues
Check logs for detailed error messages:
```bash
# Backend logs
cd backend
npm start

# Look for:
# "Email sent: <message-id>"  # Success
# "Email error: <error>"       # Failure
```

### Database Issues
Verify OTP fields exist:
```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "test@example.com" }, { 
  isEmailVerified: 1, 
  emailOTP: 1, 
  otpExpiry: 1 
})
```

## Summary

The email verification system is now fully integrated into TurfSpot:
- ✅ Professional OTP emails via Gmail SMTP
- ✅ Secure 6-digit OTP with 10-minute expiry
- ✅ Beautiful OTP verification modal
- ✅ Welcome emails after verification
- ✅ Resend OTP functionality
- ✅ Google OAuth auto-verification
- ✅ Complete error handling
- ✅ Mobile-responsive UI
- ✅ Database schema updated
- ✅ API endpoints secured

Users can now register with confidence knowing their email is verified, and the platform has an additional layer of security against fake accounts.
