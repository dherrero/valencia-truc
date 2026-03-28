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
  turnoActual?: string;
  manoOriginal?: string;
  cartasEnMesa?: { jugadorId: string; carta: Card }[];
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
  'room:create': (
    payload: { name?: string; bots?: number; playerId: string },
    callback: (res: { status: 'ok' | 'error'; message?: string; room?: RoomSummary }) => void
  ) => void;
  'room:join': (
    payload: { uid: string; playerId: string },
    callback: (res: { status: 'ok' | 'error'; message?: string; room?: RoomSummary }) => void
  ) => void;
  'game:action': (
    action: { type: string; payload?: unknown },
    callback: (res: { status: 'ok' | 'error'; message?: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  'rooms:list': (rooms: RoomSummary[]) => void;
  'room:destroyed': (message: string) => void;
  'game:state-update': (state: GameStateUpdate) => void;
}
