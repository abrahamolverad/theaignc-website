/**
 * Payment Model - The AIgnc
 * Stripe payment and subscription records
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true
  },
  stripeInvoiceId: {
    type: String,
    sparse: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['succeeded', 'pending', 'failed', 'refunded'],
    default: 'pending'
  },
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    required: true
  },
  invoiceUrl: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
