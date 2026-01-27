/**
 * n8n API Client - The AIgnc
 * Communicates with the n8n instance for workflow/execution data
 */

const axios = require('axios');

const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.srv1237523.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;

const client = axios.create({
  baseURL: `${N8N_API_URL}/api/v1`,
  headers: {
    'Accept': 'application/json',
    ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {})
  },
  timeout: 15000
});

/**
 * List workflows
 */
async function getWorkflows({ limit = 50, cursor } = {}) {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await client.get('/workflows', { params });
  return data;
}

/**
 * Get a single workflow detail
 */
async function getWorkflow(workflowId) {
  const { data } = await client.get(`/workflows/${workflowId}`);
  return data;
}

/**
 * List executions, optionally filtered by workflow
 */
async function getExecutions({ workflowId, status, limit = 20, cursor } = {}) {
  const params = { limit };
  if (workflowId) params.workflowId = workflowId;
  if (status) params.status = status;
  if (cursor) params.cursor = cursor;
  const { data } = await client.get('/executions', { params });
  return data;
}

/**
 * Get a single execution detail
 */
async function getExecution(executionId) {
  const { data } = await client.get(`/executions/${executionId}`);
  return data;
}

module.exports = {
  getWorkflows,
  getWorkflow,
  getExecutions,
  getExecution
};
