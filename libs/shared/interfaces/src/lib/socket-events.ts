import { Card } from './shared-interfaces.js';

export interface ActionLogEntry {
  id: number;
  type: string;
  jugadorId?: string;
}

export interface ActiveBetState {
  family: 'truc' | 'envido';
  label: string;
  points: number;
  waitingResponse: boolean;
}

export interface TeamPoints {
  equipo1: number;
  equipo2: number;
}

export interface RoundAwardReason {
  team: 'equipo1' | 'equipo2';
  points: number;
  reasonKey: string;
}

export interface RoundSummary {
  envido: TeamPoints;
  truc: TeamPoints;
  awarded: TeamPoints;
  scoreAfter: TeamPoints;
  reasons: RoundAwardReason[];
}

export enum TrucAction {
  REPARTIR = 'REPARTIR',
  TRUC = 'TRUC',
  RETRUC = 'RETRUC',
  VALE_QUATRE = 'VALE_QUATRE',
  JUEGO_FUERA = 'JUEGO_FUERA',
  ENVIDO = 'ENVIDO',
  TORNA_CHO = 'TORNA_CHO',
  QUIERO = 'QUIERO',
  NO_QUIERO = 'NO_QUIERO',
  JUGAR_CARTA = 'JUGAR_CARTA',
  ELEGIR_CARTA_DESEMPATE = 'ELEGIR_CARTA_DESEMPATE',
}

export interface PlayerSeat {
  playerId: string;
  displayName: string;
  cardCount: number;
  isPartner: boolean; // true = teammate, false = rival
  position: 'top' | 'right' | 'left';
}

export interface GameStateUpdate {
  board: Card[];
  hand: Card[];
  score: TeamPoints;
  phase: 'lobby' | 'playing' | 'roundSummary';
  allowedActions: TrucAction[];
  actionLog: ActionLogEntry[];
  activeBet?: ActiveBetState;
  roundSummary?: RoundSummary;
  cartasRival: number; // kept for backwards compat (first rival)
  otherPlayers: PlayerSeat[]; // all other 3 seats (right, top, left)
  totalPlayers: number;
  myTeam: 'equipo1' | 'equipo2';
  turnoActual?: string;
  manoOriginal?: string;
  cartasEnMesa?: { jugadorId: string; carta: Card }[];
  bazaResults?: Array<'equipo1' | 'equipo2' | 'empate'>;
}

export interface GameOverState {
  ganador: 'equipo1' | 'equipo2';
  score: TeamPoints;
  summary?: RoundSummary;
}

export interface RoomNoticeState {
  kind: 'player-disconnected' | 'player-reconnected';
  playerName: string;
  gracePeriodMs?: number;
}

export interface RoomDestroyedState {
  reason: 'manual' | 'abandonment';
  message: string;
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
    payload: {
      name?: string;
      bots?: number;
      playerId: string;
      playerName: string;
    },
    callback: (res: {
      status: 'ok' | 'error';
      message?: string;
      room?: RoomSummary;
    }) => void,
  ) => void;
  'room:join': (
    payload: { uid: string; playerId: string; playerName: string },
    callback: (res: {
      status: 'ok' | 'error';
      message?: string;
      room?: RoomSummary;
    }) => void,
  ) => void;
  'game:action': (
    action: { type: string; payload?: unknown },
    callback: (res: { status: 'ok' | 'error'; message?: string }) => void,
  ) => void;
  'room:destroy': (
    callback: (res: { status: 'ok' | 'error'; message?: string }) => void,
  ) => void;
}

export interface ServerToClientEvents {
  'rooms:list': (rooms: RoomSummary[]) => void;
  'room:notice': (notice: RoomNoticeState) => void;
  'room:destroyed': (payload: RoomDestroyedState) => void;
  'game:state-update': (state: GameStateUpdate) => void;
  'game:over': (data: GameOverState) => void;
}
