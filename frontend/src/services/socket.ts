import { io } from 'socket.io-client';

// TODO: Replace with your backend URL
const SOCKET_URL = 'http://localhost:5000'; 

export const socket = io(SOCKET_URL, {
  autoConnect: false, // connect manually after login
});