/**
 * Execution Log Model - The AIgnc
 * Caches n8n execution data for the portal
 */

const mongoose = require('mongoose');

const executionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workflowId: {
    type: String,
    required: true
  },
  workflowName: {
    type: String
  },
  executionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['running', 'success', 'error', 'waiting', 'unknown'],
    default: 'unknown'
  },
  startedAt: {
    type: Date
  },
  finishedAt: {
    type: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

executionLogSchema.index({ userId: 1, createdAt: -1 });
executionLogSchema.index({ workflowId: 1, executionId: 1 });

module.exports = mongoose.model('ExecutionLog', executionLogSchema);
