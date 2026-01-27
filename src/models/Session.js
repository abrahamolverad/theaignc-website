/**
 * Session Model - The AIgnc
 * Tracks active user sessions
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  device: {
    type: String,
    default: 'unknown'
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

sessionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Session', sessionSchema);
