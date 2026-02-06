const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { WebSocketServer } = require('ws');
const http = require('http');

const mcpRoutes = require('./routes/mcp');
const a2aRoutes = require('./routes/a2a');
const proxyRoutes = require('./routes/proxy');
const healthRoutes = require('./routes/health');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws/' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to PE Gateway' }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast to all connected WebSocket clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// Make broadcast available to routes
app.set('broadcast', broadcast);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://172.168.1.95:3080',
    'http://localhost:3080',
  ],
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Routes
app.use('/health', healthRoutes);
app.use('/mcp', mcpRoutes);
app.use('/a2a', a2aRoutes);
app.use('/api', proxyRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal gateway error',
    code: err.code || 'GATEWAY_ERROR',
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`PE Gateway running on port ${PORT}`);
  console.log(`WebSocket server ready on ws://0.0.0.0:${PORT}/ws/`);
});
