import { io } from 'socket.io-client';

let socket;

const apiUrl = import.meta.env.VITE_API_URL || '';
// VITE_API_URL is like "http://localhost:5000/api" — strip the /api suffix for socket origin
const socketOrigin = apiUrl.replace(/\/api\/?$/, '');

export const getSocket = () => {
  if (!socket) {
    socket = io(socketOrigin, {
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
