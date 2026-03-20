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

export interface GameStateUpdate {
  board: Card[];
  hand: Card[]; // Solamente las cartas del jugador que recibe el evento
  score: { equipo1: number; equipo2: number };
  allowedActions: TrucAction[];
  cartasRival: number; // Mantenemos el conteo ocultando valores reales
}

export interface ClientToServerEvents {
  'game:action': (action: { type: TrucAction; payload?: unknown }) => void;
  'room:join': (roomId: string, playerId: string) => void;
}

export interface ServerToClientEvents {
  'game:state-update': (state: GameStateUpdate) => void;
  'game:error': (message: string) => void;
}
