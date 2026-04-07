









// Socket.io utility for emitting events to trip rooms
let io = null;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: { origin: '*' }
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
