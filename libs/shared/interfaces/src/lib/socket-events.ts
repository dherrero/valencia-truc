import { Card } from './shared-interfaces.js';

export enum TrucAction {
  TRUC = 'TRUC',
  RETRUC = 'RETRUC',
  VALE_QUATRE = 'VALE_QUATRE',
  ENVIDO = 'ENVIDO',
  TORNA_CHO = 'TORNA_CHO',
  QUIERO = 'QUIERO',
  NO_QUIERO = 'NO_QUIERO',
  JUGAR_CARTA = 'JUGAR_CARTA',
}

export interface PlayerSeat {
  playerId: string;
  cardCount: number;
  isPartner: boolean;           // true = teammate, false = rival
  position: 'top' | 'right' | 'left';
}

export interface GameStateUpdate {
  board: Card[];
  hand: Card[];
  score: { equipo1: number; equipo2: number };
  allowedActions: TrucAction[];
  cartasRival: number;          // kept for backwards compat (first rival)
  otherPlayers: PlayerSeat[];   // all other 3 seats (right, top, left)
}

export interface RoomSummary {
  uid: string;
  name: string;
  playerCount: number;
  botCount: number;
  maxPlayers: 4;
  status: 'waiting' | 'playing';
}

export interface ClientToServerEvents {
  'room:create': (payload: { name?: string; bots?: number; playerId: string }) => void;
  'room:join': (payload: { uid: string; playerId: string }) => void;
  'game:action': (action: { type: string; payload?: unknown }) => void;
}

export interface ServerToClientEvents {
  'rooms:list': (rooms: RoomSummary[]) => void;
  'room:created': (room: RoomSummary) => void;
  'room:joined': (room: RoomSummary) => void;
  'room:error': (message: string) => void;
  'room:destroyed': (message: string) => void;
  'game:state-update': (state: GameStateUpdate) => void;
  'game:error': (message: string) => void;
}
