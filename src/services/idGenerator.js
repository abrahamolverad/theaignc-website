/**
 * AIGNC ID Generator - The AIgnc
 * Generates unique IDs in format: AIGNC-XXXXXX-XXXX
 */

const crypto = require('crypto');
const User = require('../models/User');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomSegment(length) {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

/**
 * Generate a unique AIGNC ID
 * Format: AIGNC-XXXXXX-XXXX
 * @returns {Promise<string>}
 */
async function generateAigncId() {
  let id;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    id = `AIGNC-${randomSegment(6)}-${randomSegment(4)}`;
    const user = await User.findOne({ aigncId: id });
    exists = !!user;
    attempts++;
  }

  if (exists) {
    throw new Error('Failed to generate unique AIGNC ID after 10 attempts');
  }

  return id;
}

module.exports = { generateAigncId };
