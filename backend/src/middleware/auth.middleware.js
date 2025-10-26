const jwt = require('jsonwebtoken');
const { getFirebaseAdmin } = require('../config/firebase');
const User = require('../models/User.model');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // First try to verify as Firebase token
      const admin = getFirebaseAdmin();
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Find user by Firebase UID
      const user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (firebaseError) {
      // If Firebase verification fails, try JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'User not found or inactive'
          });
        }

        req.user = user;
        next();
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Optional authentication - sets req.user if token is present but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // No token, continue without setting req.user
      return next();
    }

    try {
      // First try to verify as Firebase token
      const admin = getFirebaseAdmin();
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Find user by Firebase UID
      const user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      if (user) {
        req.user = user;
      }
      next();
    } catch (firebaseError) {
      // If Firebase verification fails, try JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user && user.isActive) {
          req.user = user;
        }
        next();
      } catch (jwtError) {
        // Invalid token, continue without setting req.user
        next();
      }
    }
  } catch (error) {
    // Error in authentication, continue without setting req.user
    next();
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize, optionalAuth };
