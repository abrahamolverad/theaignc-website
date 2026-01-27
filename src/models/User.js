/**
 * User Model - The AIgnc
 * Supports multi-tenant architecture, OAuth, Stripe, and security features
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // AIGNC ID
  aigncId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Basic Info
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },

  // Profile
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },

  // OAuth Providers
  providers: [{
    provider: {
      type: String,
      enum: ['google', 'apple', 'github', 'microsoft', 'linkedin']
    },
    providerId: String,
    email: String,
    avatar: String
  }],

  // Stripe
  stripeCustomerId: {
    type: String,
    sparse: true
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true
  },

  // Organization (Multi-tenant support)
  organization: {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    logo: {
      type: String,
      default: null
    },
    industry: {
      type: String,
      enum: ['fitness', 'healthcare', 'retail', 'finance', 'manufacturing', 'technology', 'professional_services', 'other'],
      default: 'other'
    }
  },

  // Role & Permissions
  role: {
    type: String,
    enum: ['admin', 'manager', 'user', 'viewer'],
    default: 'user'
  },
  permissions: [{
    type: String
  }],

  // Subscription & Plan
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise', 'growth', 'scale', 'trial'],
      default: 'trial'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  // Refresh Tokens
  refreshTokens: [{
    token: String,
    device: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],

  // Tracking
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },

  // Settings
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    timezone: {
      type: String,
      default: 'Asia/Dubai'
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ aigncId: 1 });
userSchema.index({ 'organization.slug': 1 });
userSchema.index({ 'organization.name': 1 });
userSchema.index({ stripeCustomerId: 1 });

// Virtual: isLocked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save: Hash password & generate org slug
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate organization slug
  if (this.organization && this.organization.name && !this.organization.slug) {
    this.organization.slug = this.organization.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  next();
});

// Method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Get full name
userSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Method: Increment failed login attempts
userSchema.methods.incLoginAttempts = async function () {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Lock after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Method: Reset failed login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method: Get public profile
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    aigncId: this.aigncId,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.getFullName(),
    avatar: this.avatar,
    providers: (this.providers || []).map(p => ({ provider: p.provider, email: p.email })),
    organization: this.organization,
    role: this.role,
    subscription: this.subscription,
    settings: this.settings,
    isVerified: this.isVerified,
    stripeCustomerId: this.stripeCustomerId,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
