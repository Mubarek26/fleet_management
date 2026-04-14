// Simple Socket.IO client to test real-time driver-location updates
// Usage: node test-socket-client.js

const io = require('socket.io-client');

const TRIP_ID = '69db99380fef74b3e2365fd1'; // <-- Replace with a real trip ID
const SOCKET_URL = 'http://localhost:5000'; // <-- Replace with your backend URL/port

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
  // Join the trip room
  socket.emit('join', `trip_${TRIP_ID}`);
  console.log(`Joined room: trip_${TRIP_ID}`);
});

socket.on('driver-location', (data) => {
  console.log('Received real-time driver-location update:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});
