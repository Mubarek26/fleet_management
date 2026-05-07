









// Socket.io utility for emitting events to trip rooms
let io = null;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: { 
        origin: [
          "http://localhost:5173", 
          "http://localhost:5174", 
          "http://127.0.0.1:5173",
          "http://localhost:8080",
          "https://fleet-command-center-21.vercel.app",
          "https://cargo-gold-ten.vercel.app"
        ],
        credentials: true
      }
    });
    io.on('connection', (socket) => {
      // Listen for join event to join a trip room
      socket.on('join', (room) => {
        socket.join(room);
      });
      // Optional: handle leave event
      socket.on('leave', (room) => {
        socket.leave(room);
      });

      // Join a chat conversation room
      socket.on('join-chat', (conversationId) => {
        socket.join(`chat_${conversationId}`);
      });

      // Leave a chat conversation room
      socket.on('leave-chat', (conversationId) => {
        socket.leave(`chat_${conversationId}`);
      });

      // Join user-specific room for notifications
      socket.on('join-user', (userId) => {
        socket.join(`user_${userId}`);
      });

      // Handle typing indicator
      socket.on('typing', ({ conversationId, userId, userName, isTyping }) => {
        socket.to(`chat_${conversationId}`).emit('typing', {
          userId,
          userName,
          isTyping
        });
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
  },
  emitToTrip: (tripId, payload) => {
    if (!io) return;
    io.to(`trip_${tripId}`).emit('driver-location', payload);
  }
};
