const jwt = require('jsonwebtoken');
const { getFirebaseAdmin } = require('../config/firebase');
const User = require('../models/User.model');
const { generateOTP, hashOTP, sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user with email/password
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // PRODUCTION SECURITY: Hash OTP before storing in database
    const hashedOTP = hashOTP(otp);

    // Create user (email not verified yet)
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: role || 'user',
      authProvider: 'email',
      emailOTP: hashedOTP, // Store hashed OTP
      otpExpiry: otpExpiry,
      isEmailVerified: false,
      otpAttempts: 0,
      otpRequestCount: 1, // First OTP request
      lastOtpRequest: new Date()
    });

    // Send OTP email (send plain OTP to user, but we store hashed version)
    try {
      await sendOTPEmail(email, name, otp);
      
      // PRODUCTION SECURITY: Log OTP generation (without exposing OTP)
      console.log(`[SECURITY] OTP generated for new user: ${email} (ID: ${user._id})`);
    } catch (emailError) {
      console.error('[ERROR] Failed to send OTP email:', emailError);
      // Continue registration even if email fails
    }

    // Generate token (user can login but some features may be restricted)
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent to your email address.',
      data: {
        user,
        token,
        requiresEmailVerification: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user with email/password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user (include password field)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login/Register with Google (Firebase)
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify Firebase token
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const { uid, email, name, picture } = decodedToken;

    // Check if user exists
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if email already exists with different auth provider
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered with email/password. Please use email login.'
        });
      }

      // Create new user
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || 'User',
        phone: req.body.phone || '0000000000', // Will need to be updated later
        role: role || 'user',
        profileImage: picture,
        authProvider: 'google',
        isVerified: true,
        isEmailVerified: true // Google already verifies emails
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: user ? 'Login successful' : 'Registration successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phone) fieldsToUpdate.phone = phone;
    if (profileImage) fieldsToUpdate.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check if user uses email auth
    if (user.authProvider !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'Password change not available for Google authenticated users'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send OTP for email verification
// @route   POST /api/auth/send-otp
// @access  Private
exports.sendOTP = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with OTP tracking fields
    const user = await User.findById(userId).select('+emailOTP +otpExpiry +otpRequestCount +lastOtpRequest');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // PRODUCTION SECURITY: Rate limiting - max 5 OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.lastOtpRequest && user.lastOtpRequest > oneHourAgo) {
      if (user.otpRequestCount >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please try again after 1 hour.'
        });
      }
    } else {
      // Reset counter if more than 1 hour has passed
      user.otpRequestCount = 0;
    }

    // PRODUCTION SECURITY: Cooldown period - wait 60 seconds between requests
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    if (user.lastOtpRequest && user.lastOtpRequest > sixtySecondsAgo) {
      const waitTime = Math.ceil((user.lastOtpRequest - sixtySecondsAgo) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // PRODUCTION SECURITY: Hash OTP before storing
    const hashedOTP = hashOTP(otp);

    // Update user with new OTP and tracking info
    user.emailOTP = hashedOTP; // Store hashed OTP
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0; // Reset failed attempts when new OTP is sent
    user.otpRequestCount = (user.otpRequestCount || 0) + 1;
    user.lastOtpRequest = new Date();
    await user.save();

    // Send OTP email (send plain OTP to user)
    await sendOTPEmail(user.email, user.name, otp);

    // PRODUCTION SECURITY: Log OTP request (without exposing OTP)
    console.log(`[SECURITY] OTP requested for user: ${user.email} (ID: ${user._id}) - Request #${user.otpRequestCount}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('[ERROR] Failed to send OTP:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-otp
// @access  Private
exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    // Get user with OTP fields
    const user = await User.findById(userId).select('+emailOTP +otpExpiry +otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check if OTP exists
    if (!user.emailOTP) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // PRODUCTION SECURITY: Check if too many failed attempts (max 5 attempts)
    if (user.otpAttempts >= 5) {
      // Invalidate current OTP after 5 failed attempts
      user.emailOTP = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      await user.save();

      console.log(`[SECURITY] Max OTP attempts exceeded for user: ${user.email} (ID: ${user._id})`);

      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. OTP has been invalidated. Please request a new OTP.'
      });
    }

    // Verify OTP
    const hashedInputOTP = hashOTP(otp.trim());
    if (user.emailOTP !== hashedInputOTP) {
      // PRODUCTION SECURITY: Increment failed attempts
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      const remainingAttempts = 5 - user.otpAttempts;

      console.log(`[SECURITY] Invalid OTP attempt for user: ${user.email} (ID: ${user._id}) - Remaining attempts: ${remainingAttempts}`);

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // PRODUCTION SECURITY: OTP is correct - Update user as verified
    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpRequestCount = 0; // Reset request count on successful verification
    user.lastOtpRequest = undefined;
    await user.save();

    // PRODUCTION SECURITY: Log successful verification
    console.log(`[SECURITY] Email verified successfully for user: ${user.email} (ID: ${user._id})`);

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name, user.role);
    } catch (emailError) {
      console.error('[ERROR] Failed to send welcome email:', emailError);
      // Continue even if welcome email fails
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('[ERROR] OTP verification failed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
