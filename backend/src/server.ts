import express, { Request, Response, Application } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authroutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Define Allowed Origins
const allowedOrigins = [
  "http://localhost:5173",                          // local
  "https://mern-logistics-frontend.onrender.com"    // production
];

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// 3. Initialize Express CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authroutes);
app.use('/api/orders', orderRoutes);

// making io accessible in routes via req.app.get('socketio')
app.set('socketio', io);

// Simple Route
app.get('/', (req, res) => {
  res.send('Delivery System API is running');
});

// Socket Connection Listener
io.on('connection', (socket) => {
  console.log('⚡ WebSocket User Connected:', socket.id);

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
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern_del';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.log('❌ DB Error:', err));