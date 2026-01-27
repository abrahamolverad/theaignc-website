/**
 * Email Service - The AIgnc
 * Nodemailer via Google Workspace SMTP
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM = process.env.EMAIL_FROM || 'The AIgnc <support@theaignc.com>';
const BASE_URL = process.env.BASE_URL || 'https://theaignc.com';

/**
 * Send an email
 */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured - skipping send to:', to);
    return null;
  }

  return transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
    text
  });
}

/**
 * Send welcome email after registration
 */
async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to The AIgnc',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0a1628, #1a2744); padding: 40px; text-align: center;">
          <h1 style="color: #c17f59; margin: 0;">THE AIGNC</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #0a1628;">Welcome, ${user.firstName}!</h2>
          <p>Your account has been created successfully. Your AIGNC ID is:</p>
          <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center; font-size: 1.2em; font-weight: bold; letter-spacing: 2px;">
            ${user.aigncId}
          </div>
          <p style="margin-top: 20px;">Get started by logging in to your client portal:</p>
          <a href="${BASE_URL}/portal" style="display: inline-block; background: #c17f59; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Go to Portal</a>
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>The AIgnc - AI-Powered Workflow Automation</p>
        </div>
      </div>
    `,
    text: `Welcome to The AIgnc, ${user.firstName}! Your AIGNC ID is ${user.aigncId}. Visit ${BASE_URL}/portal to get started.`
  });
}

/**
 * Send email verification link
 */
async function sendVerificationEmail(user) {
  const link = `${BASE_URL}/api/auth/verify-email?token=${user.verificationToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - The AIgnc',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0a1628, #1a2744); padding: 40px; text-align: center;">
          <h1 style="color: #c17f59; margin: 0;">THE AIGNC</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #0a1628;">Verify Your Email</h2>
          <p>Hi ${user.firstName}, please verify your email address by clicking the button below:</p>
          <a href="${link}" style="display: inline-block; background: #c17f59; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Verify Email</a>
          <p style="margin-top: 20px; color: #666; font-size: 13px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `Hi ${user.firstName}, verify your email by visiting: ${link}`
  });
}

/**
 * Send password reset link
 */
async function sendPasswordResetEmail(user) {
  const link = `${BASE_URL}/reset-password?token=${user.resetPasswordToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset Your Password - The AIgnc',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0a1628, #1a2744); padding: 40px; text-align: center;">
          <h1 style="color: #c17f59; margin: 0;">THE AIGNC</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #0a1628;">Reset Your Password</h2>
          <p>Hi ${user.firstName}, we received a request to reset your password. Click the button below:</p>
          <a href="${link}" style="display: inline-block; background: #c17f59; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p style="margin-top: 20px; color: #666; font-size: 13px;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
        </div>
      </div>
    `,
    text: `Hi ${user.firstName}, reset your password by visiting: ${link}. This link expires in 1 hour.`
  });
}

/**
 * Send payment confirmation email
 */
async function sendPaymentConfirmationEmail(user, payment) {
  return sendEmail({
    to: user.email,
    subject: 'Payment Confirmation - The AIgnc',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0a1628, #1a2744); padding: 40px; text-align: center;">
          <h1 style="color: #c17f59; margin: 0;">THE AIGNC</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #0a1628;">Payment Confirmed</h2>
          <p>Hi ${user.firstName}, your payment has been processed.</p>
          <div style="background: #f0f4f8; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> $${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()}</p>
            <p><strong>Plan:</strong> ${payment.plan}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
          </div>
          ${payment.invoiceUrl ? `<p style="margin-top: 15px;"><a href="${payment.invoiceUrl}" style="color: #c17f59;">View Invoice</a></p>` : ''}
        </div>
      </div>
    `,
    text: `Hi ${user.firstName}, your payment of $${(payment.amount / 100).toFixed(2)} for the ${payment.plan} plan has been confirmed.`
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail
};
