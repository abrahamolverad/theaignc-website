/**
 * Stripe Configuration - The AIgnc
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    amount: 9900, // $99/mo in cents
    features: ['5 Workflows', 'Basic Analytics', 'Email Support']
  },
  professional: {
    name: 'Professional',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    amount: 29900, // $299/mo
    features: ['25 Workflows', 'Advanced Analytics', 'Priority Support', 'API Access']
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    amount: 99900, // $999/mo
    features: ['Unlimited Workflows', 'Custom Integrations', 'Dedicated Support', 'SLA', 'White Label']
  }
};

module.exports = { stripe, PLANS };
