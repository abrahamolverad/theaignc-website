/**
 * Billing Routes - The AIgnc
 * Stripe checkout, portal, webhook
 */

const express = require('express');
const auth = require('../middleware/auth');
const { stripe, PLANS } = require('../config/stripe');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { logSecurityEvent, getClientIp } = require('../middleware/security');
const { sendPaymentConfirmationEmail } = require('../services/email');

const router = express.Router();

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session
 */
router.post('/checkout', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

    if (!planConfig || !planConfig.priceId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    const user = req.user;

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.getFullName(),
        metadata: {
          aigncId: user.aigncId,
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: planConfig.priceId,
        quantity: 1
      }],
      success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/portal?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/portal?status=cancelled`,
      metadata: {
        userId: user._id.toString(),
        plan
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session'
    });
  }
});

/**
 * POST /api/billing/portal
 * Create a Stripe Customer Portal session
 */
router.post('/portal', auth, async (req, res) => {
  try {
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No billing account found. Please subscribe first.'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/portal`
    });

    res.json({
      success: true,
      url: session.url
    });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating billing portal session'
    });
  }
});

/**
 * GET /api/billing/status
 * Get current subscription status
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = req.user;

    const data = {
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId
    };

    // Get recent payments
    const payments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      subscription: data,
      payments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching billing status'
    });
  }
});

/**
 * POST /api/billing/webhook
 * Handle Stripe webhooks
 * NOTE: This route uses raw body parser (configured in server.js)
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.stripeSubscriptionId = session.subscription;
            user.subscription.plan = session.metadata.plan || 'starter';
            user.subscription.status = 'active';
            user.subscription.startDate = new Date();
            await user.save();

            await logSecurityEvent({
              userId: user._id,
              action: 'subscription_change',
              metadata: { plan: session.metadata.plan, event: 'checkout_completed' }
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });

        if (user) {
          const payment = await Payment.create({
            userId: user._id,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            plan: user.subscription.plan,
            invoiceUrl: invoice.hosted_invoice_url
          });

          await sendPaymentConfirmationEmail(user, payment);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });

        if (user) {
          user.subscription.status = 'past_due';
          await user.save();

          await Payment.create({
            userId: user._id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'failed',
            plan: user.subscription.plan
          });

          await logSecurityEvent({
            userId: user._id,
            action: 'subscription_change',
            metadata: { event: 'payment_failed' }
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });

        if (user) {
          user.stripeSubscriptionId = subscription.id;
          user.subscription.status = subscription.status === 'active' ? 'active' :
            subscription.status === 'past_due' ? 'past_due' :
              subscription.status === 'canceled' ? 'cancelled' : 'inactive';
          await user.save();
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });

        if (user) {
          user.subscription.status = 'cancelled';
          user.subscription.endDate = new Date();
          user.stripeSubscriptionId = null;
          await user.save();

          await logSecurityEvent({
            userId: user._id,
            action: 'subscription_change',
            metadata: { event: 'subscription_deleted' }
          });
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
