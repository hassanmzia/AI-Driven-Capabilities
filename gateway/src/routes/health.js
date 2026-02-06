const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

router.get('/', async (req, res) => {
  let backendStatus = 'unknown';
  try {
    const resp = await axios.get(`${BACKEND_URL}/api/v1/health/`, { timeout: 5000 });
    backendStatus = resp.data.status || 'healthy';
  } catch {
    backendStatus = 'unreachable';
  }

  res.json({
    status: 'healthy',
    service: 'pe-gateway',
    backend: backendStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    features: {
      mcp: true,
      a2a: true,
      websocket: true,
      multiAgent: true,
    },
  });
});

module.exports = router;
