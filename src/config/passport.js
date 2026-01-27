/**
 * Passport Configuration - The AIgnc
 * OAuth strategies: Google, Apple, GitHub, Microsoft, LinkedIn
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');
const { generateAigncId } = require('../services/idGenerator');
const SecurityLog = require('../models/SecurityLog');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Common OAuth callback handler
 * Finds or creates user, links provider
 */
async function handleOAuthCallback(provider, profile, done) {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
    const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User';
    const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';

    // Look for existing user by provider ID or email
    let user = await User.findOne({
      $or: [
        { 'providers.provider': provider, 'providers.providerId': profile.id },
        ...(email ? [{ email: email.toLowerCase() }] : [])
      ]
    });

    if (user) {
      // Link provider if not already linked
      const hasProvider = user.providers.some(
        p => p.provider === provider && p.providerId === profile.id
      );

      if (!hasProvider) {
        user.providers.push({
          provider,
          providerId: profile.id,
          email,
          avatar
        });
        await user.save();

        await SecurityLog.create({
          userId: user._id,
          action: 'oauth_link',
          metadata: { provider }
        });
      }
    } else {
      // Create new user
      if (!email) {
        return done(null, false, { message: 'Email is required for registration' });
      }

      const aigncId = await generateAigncId();

      user = await User.create({
        aigncId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        avatar,
        isVerified: true,
        organization: {
          name: `${firstName}'s Organization`
        },
        providers: [{
          provider,
          providerId: profile.id,
          email,
          avatar
        }]
      });

      await SecurityLog.create({
        userId: user._id,
        action: 'register',
        metadata: { provider, method: 'oauth' }
      });
    }

    // Update login stats
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      action: 'oauth_login',
      metadata: { provider }
    });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}

function configurePassport() {
  // Serialize/Deserialize
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google OAuth 2.0
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/google/callback`,
      scope: ['profile', 'email']
    }, (accessToken, refreshToken, profile, done) => {
      handleOAuthCallback('google', profile, done);
    }));
  }

  // GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/github/callback`,
      scope: ['user:email']
    }, (accessToken, refreshToken, profile, done) => {
      handleOAuthCallback('github', profile, done);
    }));
  }

  // Microsoft OAuth
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(new MicrosoftStrategy({
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/microsoft/callback`,
      scope: ['user.read']
    }, (accessToken, refreshToken, profile, done) => {
      handleOAuthCallback('microsoft', profile, done);
    }));
  }

  // LinkedIn OAuth 2.0
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/linkedin/callback`,
      scope: ['openid', 'profile', 'email']
    }, (accessToken, refreshToken, profile, done) => {
      handleOAuthCallback('linkedin', profile, done);
    }));
  }
}

module.exports = configurePassport;
