/**
 * Portal Routes - The AIgnc
 * Dashboard data endpoints for the client portal
 */

const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Payment = require('../models/Payment');
const SecurityLog = require('../models/SecurityLog');
const ExecutionLog = require('../models/ExecutionLog');

const router = express.Router();

/**
 * GET /api/portal/overview
 * Dashboard summary
 */
router.get('/overview', auth, async (req, res) => {
  try {
    const user = req.user;

    // Recent payments
    const recentPayments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent executions
    const recentExecutions = await ExecutionLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Activity count
    const activityCount = await SecurityLog.countDocuments({ userId: user._id });

    res.json({
      success: true,
      overview: {
        user: user.toPublicJSON(),
        subscription: user.subscription,
        stats: {
          totalExecutions: recentExecutions.length,
          recentPayments: recentPayments.length,
          activityEvents: activityCount
        },
        recentExecutions,
        recentPayments
      }
    });
  } catch (err) {
    console.error('Portal overview error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

/**
 * PUT /api/portal/profile
 * Update user profile
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar, organizationName } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (organizationName) {
      user.organization.name = organizationName;
      user.organization.slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      user: user.toPublicJSON()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

/**
 * PUT /api/portal/settings
 * Update notification/theme settings
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const { notifications, timezone, language, theme } = req.body;
    const user = await User.findById(req.user._id);

    if (notifications) {
      user.settings.notifications = { ...user.settings.notifications.toObject(), ...notifications };
    }
    if (timezone) user.settings.timezone = timezone;
    if (language) user.settings.language = language;
    if (theme) user.settings.theme = theme;

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated',
      settings: user.settings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

/**
 * GET /api/portal/activity
 * Recent security/activity log
 */
router.get('/activity', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      SecurityLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SecurityLog.countDocuments({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activity log'
    });
  }
});

module.exports = router;
