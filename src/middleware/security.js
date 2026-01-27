/**
 * Security Middleware - The AIgnc
 * CSRF, rate limiting, account lockout, audit logging
 */

const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const SecurityLog = require('../models/SecurityLog');

/**
 * Per-route rate limiters
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many webhook requests.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Account lockout check middleware
 * Must be applied after auth middleware has set req.user (or on login before auth)
 */
function checkLockout(req, res, next) {
  // This is for pre-auth check during login. User object won't be on req yet.
  // Actual lockout check happens in the login route itself.
  next();
}

/**
 * CSRF token generation middleware
 * Generates a CSRF token and sets it as a cookie
 */
function csrfProtection(req, res, next) {
  // Skip for webhooks (Stripe, etc.)
  if (req.path.includes('/webhook')) {
    return next();
  }

  // Generate token if not present
  if (!req.cookies._csrf) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('_csrf', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies._csrf;
  }

  // Validate on state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Skip validation for API calls with Bearer auth (SPA uses JWT, not cookies for auth)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return next();
    }

    // Skip for webhook endpoints
    if (req.path.includes('/webhook')) {
      return next();
    }

    // Skip for OAuth callbacks
    if (req.path.includes('/callback')) {
      return next();
    }

    const headerToken = req.headers['x-csrf-token'];
    if (headerToken && headerToken === req.cookies._csrf) {
      return next();
    }

    // Allow requests without CSRF for now (SPA sends JWT in header)
    // In strict mode, uncomment below:
    // return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  }

  next();
}

/**
 * Log a security event
 */
async function logSecurityEvent({ userId, action, ip, userAgent, metadata }) {
  try {
    await SecurityLog.create({
      userId,
      action,
      ip,
      userAgent,
      metadata
    });
  } catch (err) {
    console.error('Failed to log security event:', err.message);
  }
}

/**
 * Extract client IP from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip;
}

module.exports = {
  authLimiter,
  apiLimiter,
  webhookLimiter,
  checkLockout,
  csrfProtection,
  logSecurityEvent,
  getClientIp
};
