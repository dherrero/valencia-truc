import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@valencia-truc/shared-interfaces';
import { createRoomManager } from './app/room-manager';
import { registerHttpRoutes } from './app/http-routes';
import { registerSocketHandlers } from './app/socket-handlers';
import { setupRedisAdapter } from './app/redis-adapter';
import type { GameSocketData } from './app/socket-types';

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  never,
  GameSocketData
>(httpServer, {
  cors: { origin: '*' },
});

// Redis Setup
setupRedisAdapter(io);

// Room Manager
const roomManager = createRoomManager(io);

// HTTP Routes
registerHttpRoutes(app, roomManager);

// Socket Handlers
registerSocketHandlers(io, roomManager);

// Idle Room Cleanup — destroys rooms inactive for >5 minutes
const IDLE_ROOM_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_ROOM_CHECK_INTERVAL_MS = 60 * 1000;
roomManager.startIdleCleanup(IDLE_ROOM_TIMEOUT_MS, IDLE_ROOM_CHECK_INTERVAL_MS);

const port = process.env.PORT || 3333;
httpServer.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
