/**
 * Contact Routes - The AIgnc
 */

const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/contact/inquiry
 * @desc    Submit contact inquiry
 */
router.post('/inquiry', async (req, res) => {
  try {
    const { name, email, company, phone, message, service } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    // In production, this would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Create CRM entry
    // 4. Send to Telegram/Slack

    console.log('New inquiry received:', { name, email, company, phone, service });

    res.json({
      success: true,
      message: 'Thank you for your inquiry! Our team will contact you within 24 hours.',
      data: {
        ticketId: `INQ-${Date.now()}`,
        estimatedResponse: '24 hours'
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error submitting inquiry'
    });
  }
});

/**
 * @route   POST /api/contact/schedule
 * @desc    Schedule a discovery call
 */
router.post('/schedule', async (req, res) => {
  try {
    const { name, email, company, phone, preferredDate, preferredTime, timezone, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // In production, integrate with Calendly or similar

    res.json({
      success: true,
      message: 'Your discovery call has been requested! We will confirm the schedule via email.',
      data: {
        requestId: `CALL-${Date.now()}`,
        preferredDate,
        preferredTime,
        timezone
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error scheduling call'
    });
  }
});

/**
 * @route   POST /api/contact/newsletter
 * @desc    Subscribe to newsletter
 */
router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // In production, add to mailing list (Mailchimp, ConvertKit, etc.)

    res.json({
      success: true,
      message: 'Thank you for subscribing! You will receive our latest insights and updates.'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error subscribing to newsletter'
    });
  }
});

module.exports = router;
