import type { Socket, Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@valencia-truc/shared-interfaces';

export interface GameSocketData {
  playerId?: string;
  roomUid?: string;
}

export type TrucSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  never,
  GameSocketData
>;

export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  never,
  GameSocketData
>;
