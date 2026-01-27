/**
 * Authentication Middleware - The AIgnc
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'theaignc-secret-key-change-in-production';

const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }

    next();
  };
};

/**
 * Require an active subscription of specific plans
 */
const requireSubscription = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const { subscription } = req.user;

    if (subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'An active subscription is required to access this resource.'
      });
    }

    if (plans.length > 0 && !plans.includes(subscription.plan)) {
      return res.status(403).json({
        success: false,
        message: `This resource requires one of these plans: ${plans.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Require email verification
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification is required. Please check your inbox.'
    });
  }

  next();
};

module.exports = auth;
module.exports.requireRole = requireRole;
module.exports.requireSubscription = requireSubscription;
module.exports.requireVerified = requireVerified;
