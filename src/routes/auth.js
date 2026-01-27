/**
 * Authentication Routes - The AIgnc
 * Local + OAuth authentication, refresh tokens, password reset
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const { v4: uuidv4 } = require('uuid');
const { generateAigncId } = require('../services/idGenerator');
const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');
const { authLimiter, logSecurityEvent, getClientIp } = require('../middleware/security');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'theaignc-secret-key-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Issue tokens and set cookies
function issueTokens(res, user) {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken();
  const refreshExpires = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  // Store refresh token on user
  user.refreshTokens = user.refreshTokens || [];
  // Keep only last 5 refresh tokens
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens = user.refreshTokens.slice(-4);
  }
  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
    expiresAt: refreshExpires
  });

  // Set cookies
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  });

  return { token, refreshToken };
}

/**
 * POST /api/auth/register
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, organizationName, industry } = req.body;

    if (!email || !password || !firstName || !lastName || !organizationName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const aigncId = await generateAigncId();

    const user = await User.create({
      aigncId,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      organization: {
        name: organizationName,
        industry: industry || 'other'
      },
      verificationToken: uuidv4()
    });

    const { token, refreshToken } = issueTokens(res, user);
    await user.save();

    // Send emails (non-blocking)
    sendWelcomeEmail(user).catch(err => console.error('Welcome email error:', err.message));
    sendVerificationEmail(user).catch(err => console.error('Verification email error:', err.message));

    await logSecurityEvent({
      userId: user._id,
      action: 'register',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: { method: 'email' }
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      refreshToken,
      user: user.toPublicJSON()
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check lockout
    if (user.isLocked) {
      await logSecurityEvent({
        userId: user._id,
        action: 'login_failed',
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        metadata: { reason: 'account_locked' }
      });
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed attempts. Please try again later.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      await logSecurityEvent({
        userId: user._id,
        action: 'login_failed',
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        metadata: { reason: 'invalid_password' }
      });

      // Check if this attempt triggered lockout
      const updatedUser = await User.findById(user._id);
      if (updatedUser.failedLoginAttempts >= 5) {
        await logSecurityEvent({
          userId: user._id,
          action: 'account_locked',
          ip: getClientIp(req),
          userAgent: req.headers['user-agent']
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset failed attempts on successful login
    await user.resetLoginAttempts();

    // Update login stats
    user.lastLogin = new Date();
    user.loginCount += 1;

    const { token, refreshToken } = issueTokens(res, user);
    await user.save();

    await logSecurityEvent({
      userId: user._id,
      action: 'login_success',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: user.toPublicJSON()
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh token rotation
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Remove old refresh token (rotation)
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);

    const tokens = issueTokens(res, user);
    await user.save();

    res.json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    // Remove the refresh token
    await User.updateOne(
      { 'refreshTokens.token': refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  }

  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0), path: '/api/auth/refresh' });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toPublicJSON()
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

/**
 * GET /api/auth/verify-email
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    await logSecurityEvent({
      userId: user._id,
      action: 'email_verified',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent']
    });

    // Redirect to portal with success
    res.redirect('/portal?verified=true');
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error verifying email' });
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a reset link will be sent'
      });
    }

    user.resetPasswordToken = uuidv4();
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(user);

    await logSecurityEvent({
      userId: user._id,
      action: 'password_reset_request',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'If an account exists, a reset link will be sent'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error processing request'
    });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    await logSecurityEvent({
      userId: user._id,
      action: 'password_reset_complete',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// ========================
// OAuth Routes
// ========================

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    const { token } = issueTokens(res, req.user);
    req.user.save().catch(err => console.error('Save error:', err));
    res.redirect(`/portal?token=${token}`);
  }
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    const { token } = issueTokens(res, req.user);
    req.user.save().catch(err => console.error('Save error:', err));
    res.redirect(`/portal?token=${token}`);
  }
);

// Microsoft
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    const { token } = issueTokens(res, req.user);
    req.user.save().catch(err => console.error('Save error:', err));
    res.redirect(`/portal?token=${token}`);
  }
);

// LinkedIn
router.get('/linkedin', passport.authenticate('linkedin'));
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    const { token } = issueTokens(res, req.user);
    req.user.save().catch(err => console.error('Save error:', err));
    res.redirect(`/portal?token=${token}`);
  }
);

module.exports = router;
