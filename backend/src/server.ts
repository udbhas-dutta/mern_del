// backend/src/server.ts
import express, { Request, Response, Application } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io (The magic part)
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev simplicity, restrict in prod
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Make io accessible in routes via req.app.get('socketio')
app.set('socketio', io);

// Simple Route
app.get('/', (req, res) => {
  res.send('Delivery System API is running');
});

// Socket Connection Listener
io.on('connection', (socket) => {
  console.log('⚡ User Connected:', socket.id);

  socket.on('join_room', (role) => {
    socket.join(role);
    console.log(`User ${socket.id} joined room: ${role}`);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/delivery-app';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.log('❌ DB Error:', err));