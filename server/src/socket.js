import jwt from 'jsonwebtoken';
import { db } from './config/db.js';

let ioInstance;

export function initSocket(io) {
  ioInstance = io;

  // Authentication middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      decoded.id = decoded.sub;
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.id})`);

    socket.on('join_trip', async (tripId) => {
      // Basic check if user is a member of the trip could go here
      const { data: member } = await db.from('trip_members').select('id').eq('trip_id', tripId).eq('user_id', socket.user.id).single();
      if (member) {
        socket.join(`trip_${tripId}`);
        console.log(`User ${socket.user.id} joined trip_${tripId}`);
      } else {
        socket.emit('error', 'You are not a member of this trip');
      }
    });

    socket.on('leave_trip', (tripId) => {
      socket.leave(`trip_${tripId}`);
      console.log(`User ${socket.user.id} left trip_${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}
