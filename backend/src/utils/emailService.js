const nodemailer = require('nodemailer');

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
  sendBookingConfirmation,
  sendBookingCancellation,
  sendTurfApproval,
  sendTurfRejection
};
