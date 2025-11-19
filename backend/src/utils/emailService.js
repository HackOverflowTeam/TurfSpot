const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const crypto = require('crypto');

// PRODUCTION SECURITY: Hash OTP before storing
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp.toString()).digest('hex');
};

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const resendClient = new Resend(process.env.RESEND_API_KEY || 're_SqeXoBWa_CqAuLmKBAiQWJLE3xcyweuyS');
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';

// Send email
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `TurfSpot <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for email verification
const sendOTPEmail = async (email, name, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏟️ TurfSpot Email Verification</h1>
        </div>
        <div class="content">
          <p>Hi ${name || 'there'},</p>
          <p>Thank you for registering with TurfSpot! Please use the following OTP to verify your email address:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <p style="margin-top: 10px; color: #6b7280;">This OTP is valid for 10 minutes</p>
          </div>
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br><strong>TurfSpot Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} TurfSpot. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Your TurfSpot verification OTP is: ${otp}. This OTP is valid for 10 minutes.`;

  try {
    await resendClient.emails.send({
      from: `TurfSpot <${RESEND_FROM}>`,
      to: email,
      subject: 'Verify Your Email - TurfSpot',
      html,
      text
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    throw error;
  }
};

// Send welcome email after successful verification
const sendWelcomeEmail = async (email, name, role) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .feature-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to TurfSpot!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Congratulations! Your email has been verified successfully. Welcome to India's premier turf booking platform!</p>
          ${role === 'owner' ? `
          <div class="feature-box">
            <h3>🏟️ As a Turf Owner, you can:</h3>
            <ul>
              <li>List and manage your turfs</li>
              <li>Track bookings and revenue</li>
              <li>Choose flexible payment plans</li>
              <li>Access detailed analytics</li>
            </ul>
          </div>
          ` : `
          <div class="feature-box">
            <h3>⚽ As a Player, you can:</h3>
            <ul>
              <li>Discover turfs near you</li>
              <li>Book slots instantly</li>
              <li>Secure online payments</li>
              <li>Track your bookings</li>
            </ul>
          </div>
          `}
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta-button">Get Started</a>
          </p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br><strong>TurfSpot Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TurfSpot. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to TurfSpot! 🏟️',
    html,
    text: `Welcome to TurfSpot! Your email has been verified successfully. Start ${role === 'owner' ? 'listing your turfs' : 'booking your favorite turfs'} now!`
  });
};

// Booking confirmation email
const sendBookingConfirmation = async (booking, user, turf) => {
  const html = `
    <h1>Booking Confirmed!</h1>
    <p>Hi ${user.name},</p>
    <p>Your booking has been confirmed.</p>
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Turf:</strong> ${turf.name}</li>
      <li><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</li>
      <li><strong>Time:</strong> ${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}</li>
      <li><strong>Sport:</strong> ${booking.sport}</li>
      <li><strong>Amount Paid:</strong> ₹${booking.pricing.totalAmount}</li>
    </ul>
    <p><strong>Address:</strong><br>
    ${turf.address.street}, ${turf.address.city}, ${turf.address.state} - ${turf.address.pincode}</p>
    <p>Contact: ${turf.contactInfo.phone}</p>
    <hr>
    <p>Thank you for choosing TurfSpot!</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Booking Confirmation - TurfSpot',
    html
  });
};

// Booking cancellation email
const sendBookingCancellation = async (booking, user, turf) => {
  const html = `
    <h1>Booking Cancelled</h1>
    <p>Hi ${user.name},</p>
    <p>Your booking has been cancelled.</p>
    <h3>Cancelled Booking Details:</h3>
    <ul>
      <li><strong>Turf:</strong> ${turf.name}</li>
      <li><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</li>
      <li><strong>Time:</strong> ${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}</li>
      <li><strong>Refund Amount:</strong> ₹${booking.cancellation.refundAmount}</li>
    </ul>
    <p>Refund will be processed within 5-7 business days.</p>
    <hr>
    <p>We hope to see you again soon!</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Booking Cancelled - TurfSpot',
    html
  });
};

// Turf approval email
const sendTurfApproval = async (turf, owner) => {
  const html = `
    <h1>Turf Approved!</h1>
    <p>Hi ${owner.name},</p>
    <p>Congratulations! Your turf <strong>${turf.name}</strong> has been approved and is now live on TurfSpot.</p>
    <p>Users can now discover and book your turf.</p>
    <p>Login to your dashboard to manage bookings and view analytics.</p>
    <hr>
    <p>Best regards,<br>TurfSpot Team</p>
  `;

  await sendEmail({
    to: owner.email,
    subject: 'Turf Approved - TurfSpot',
    html
  });
};

// Turf rejection email
const sendTurfRejection = async (turf, owner, reason) => {
  const html = `
    <h1>Turf Registration Update</h1>
    <p>Hi ${owner.name},</p>
    <p>Unfortunately, your turf <strong>${turf.name}</strong> has not been approved.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please update your turf information and resubmit for approval.</p>
    <hr>
    <p>Best regards,<br>TurfSpot Team</p>
  `;

  await sendEmail({
    to: owner.email,
    subject: 'Turf Registration Update - TurfSpot',
    html
  });
};

module.exports = {
  sendEmail,
  generateOTP,
  hashOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendTurfApproval,
  sendTurfRejection
};
