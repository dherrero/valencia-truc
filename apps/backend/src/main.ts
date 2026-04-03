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

const roomManager = createRoomManager(io);

registerHttpRoutes(app, roomManager);
registerSocketHandlers(io, roomManager);
void setupRedisAdapter(io);

const port = process.env.PORT || 3333;
httpServer.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
