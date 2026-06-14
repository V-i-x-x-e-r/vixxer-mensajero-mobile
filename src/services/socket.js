// Conexión Socket.IO autenticada por JWT. Un solo socket compartido en la app.
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/env.js';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
