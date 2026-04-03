import type { Express } from 'express';
import type { RoomManager } from './room-manager';

export function registerHttpRoutes(app: Express, roomManager: RoomManager) {
  app.get('/api/rooms', (_req, res) => {
    res.json(roomManager.listRooms());
  });
}
