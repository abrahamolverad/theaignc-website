/**
 * n8n Routes - The AIgnc
 * Proxy to n8n API for execution/workflow data
 */

const express = require('express');
const auth = require('../middleware/auth');
const { requireSubscription } = require('../middleware/auth');
const n8nService = require('../services/n8n');

const router = express.Router();

/**
 * GET /api/n8n/workflows
 * List available workflows
 */
router.get('/workflows', auth, requireSubscription(), async (req, res) => {
  try {
    const data = await n8nService.getWorkflows({
      limit: parseInt(req.query.limit) || 50
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error('n8n workflows error:', err.message);
    res.status(502).json({
      success: false,
      message: 'Unable to fetch workflows from n8n'
    });
  }
});

/**
 * GET /api/n8n/workflows/:id
 * Get workflow detail
 */
router.get('/workflows/:id', auth, requireSubscription(), async (req, res) => {
  try {
    const data = await n8nService.getWorkflow(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('n8n workflow detail error:', err.message);
    res.status(502).json({
      success: false,
      message: 'Unable to fetch workflow details'
    });
  }
});

/**
 * GET /api/n8n/executions
 * List executions
 */
router.get('/executions', auth, requireSubscription(), async (req, res) => {
  try {
    const data = await n8nService.getExecutions({
      workflowId: req.query.workflowId,
      status: req.query.status,
      limit: parseInt(req.query.limit) || 20,
      cursor: req.query.cursor
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error('n8n executions error:', err.message);
    res.status(502).json({
      success: false,
      message: 'Unable to fetch executions from n8n'
    });
  }
});

/**
 * GET /api/n8n/executions/:id
 * Get execution detail
 */
router.get('/executions/:id', auth, requireSubscription(), async (req, res) => {
  try {
    const data = await n8nService.getExecution(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('n8n execution detail error:', err.message);
    res.status(502).json({
      success: false,
      message: 'Unable to fetch execution details'
    });
  }
});

module.exports = router;
