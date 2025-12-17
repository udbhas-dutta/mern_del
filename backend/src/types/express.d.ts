// backend/src/types/express.d.ts
import { Server } from 'socket.io';

declare global {
  namespace Express {
    interface Application {
      socketio: Server;
    }
  }
}