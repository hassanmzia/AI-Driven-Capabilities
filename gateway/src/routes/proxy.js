const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

// Proxy all /api requests to Django backend
router.all('/*', async (req, res) => {
  try {
    const url = `${BACKEND_URL}/api${req.path}`;
    const isExport = req.path.includes('/export/');
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
      responseType: isExport ? 'arraybuffer' : 'json',
    });

    // File download responses (export endpoints)
    if (isExport && response.headers['content-disposition']) {
      res.set('Content-Type', response.headers['content-type']);
      res.set('Content-Disposition', response.headers['content-disposition']);
      return res.status(response.status).send(Buffer.from(response.data));
    }

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
    const errStatus = error.response?.status || 502;
    let data = { error: 'Backend unavailable' };
    if (error.response?.data) {
      // Handle arraybuffer error responses from export endpoints
      if (error.response.data instanceof ArrayBuffer || Buffer.isBuffer(error.response.data)) {
        try { data = JSON.parse(Buffer.from(error.response.data).toString()); } catch { /* keep default */ }
      } else {
        data = error.response.data;
      }
    }
    res.status(errStatus).json(data);
  }
});

module.exports = router;
