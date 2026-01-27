/**
 * Security Log Model - The AIgnc
 * Audit log for security-relevant events
 */

const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login_success',
      'login_failed',
      'logout',
      'register',
      'password_change',
      'password_reset_request',
      'password_reset_complete',
      'email_verified',
      'account_locked',
      'account_unlocked',
      'oauth_login',
      'oauth_link',
      'subscription_change',
      'profile_update',
      'two_factor_enabled',
      'two_factor_disabled',
      'session_revoked'
    ]
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

securityLogSchema.index({ userId: 1, createdAt: -1 });
securityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
