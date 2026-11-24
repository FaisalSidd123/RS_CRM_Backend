import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createWebhookRouter } from './routes/webhook.js';
import { createLeadsRouter } from './routes/leads.js';
import { createFollowUpsRouter } from './routes/followups.js';
import { createVisitsRouter } from './routes/visits.js';
import { createDealsRouter } from './routes/deals.js';
import { usersRouter } from './routes/users.js';
import { whatsappRouter } from './routes/whatsapp.js';
import { authRouter } from './routes/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Setup Socket.IO for real-time portals (Owner, Manager, Agent)
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 [Socket.IO] Portal client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ [Socket.IO] Portal client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'PropertyOS Pakistan — Core Backend Engine',
    portals: ['owner', 'manager', 'agent'],
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/webhook', createWebhookRouter(io));
app.use('/api/leads', createLeadsRouter(io));
app.use('/api/follow-ups', createFollowUpsRouter(io));
app.use('/api/visits', createVisitsRouter(io));
app.use('/api/deals', createDealsRouter(io));
app.use('/api/users', usersRouter);
app.use('/api/whatsapp', whatsappRouter);

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 PropertyOS Pakistan Backend running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log(`📲 Meta Webhook URL: http://localhost:${PORT}/api/webhook`);
  console.log(`🧪 Simulate WhatsApp Lead: POST http://localhost:${PORT}/api/leads/simulate`);
  console.log(`🔒 Manager Claim & Lock: POST http://localhost:${PORT}/api/leads/:id/claim`);
  console.log(`📅 Follow-Up Engine: http://localhost:${PORT}/api/follow-ups`);
  console.log(`🏡 Site Visits & Agent Handoff: http://localhost:${PORT}/api/visits`);
  console.log(`💰 Deals Pipeline: http://localhost:${PORT}/api/deals`);
  console.log(`======================================================\n`);
});
