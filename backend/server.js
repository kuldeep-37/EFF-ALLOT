require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-mock-role']
}));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eff-allot')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io for Realtime Layer
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (joinedCaseId) => {
    console.log('[JOIN] socket', socket.id, 'joining room', joinedCaseId);
    socket.join(joinedCaseId);
  });

  socket.on('leave_case', (caseId) => {
    socket.leave(caseId);
    console.log(`Socket ${socket.id} left room ${caseId}`);
  });

  // Generic broadcaster for interactive features
  socket.on('action', (data) => {
    console.log('Action received:', data);
    io.emit('action', data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

// Pass io to routes
app.set('io', io);

// Routes Placeholder
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/case'));
app.use('/api/engine', require('./routes/engine'));
app.get('/health', (req, res) => res.status(200).send('EFF-ALLOT Backend Running'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
