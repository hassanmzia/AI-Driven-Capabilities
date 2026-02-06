const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

// Proxy all /api requests to Django backend
router.all('/*', async (req, res) => {
  try {
    const url = `${BACKEND_URL}/api${req.path}`;
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      params: req.query,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      timeout: 120000,
    });

    // Broadcast execution events via WebSocket
    if (req.method === 'POST' && req.path.includes('/execute/')) {
      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast({
          type: 'execution_complete',
          category: req.path.split('/execute/')[1]?.replace('/', ''),
          execution_id: response.data.execution_id,
          latency_ms: response.data.latency_ms,
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data || { error: 'Backend unavailable' };
    res.status(status).json(data);
  }
});

module.exports = router;
