import { TrucAction, RoomSummary } from '@valencia-truc/shared-interfaces';
import type { Room } from './room-types';

export type GamePhase = 'lobby' | 'playing' | 'roundSummary';

export const actionToEvent: Record<string, string> = {
  [TrucAction.REPARTIR]: 'REPARTIR',
  [TrucAction.JUGAR_CARTA]: 'JUGAR_CARTA',
  [TrucAction.TRUC]: 'CANTAR_TRUC',
  [TrucAction.RETRUC]: 'RETRUC',
  [TrucAction.VALE_QUATRE]: 'VALE_QUATRE',
  [TrucAction.JUEGO_FUERA]: 'JUEGO_FUERA',
  [TrucAction.ENVIDO]: 'CANTAR_ENVIDO',
  [TrucAction.TORNA_CHO]: 'TORNA_CHO',
  [TrucAction.QUIERO]: 'QUIERO',
  [TrucAction.NO_QUIERO]: 'NO_QUIERO',
  [TrucAction.ELEGIR_CARTA_DESEMPATE]: 'ELEGIR_CARTA_DESEMPATE',
};

export function getRoomSummary(room: Room): RoomSummary {
  return {
    uid: room.uid,
    name: room.name,
    playerCount: room.playerIds.length + room.botCount,
    botCount: room.botCount,
    maxPlayers: 4,
    status: room.status,
  };
}

export function normalizePlayerName(name: string, fallback: string) {
  const trimmed = name.trim();
  return trimmed || fallback;
}

export function getGamePhase(snapshot: {
  matches: (state: Record<string, string>) => boolean;
}) {
  if (snapshot.matches({ ronda: 'inicio' })) return 'lobby' as const;
  if (snapshot.matches({ ronda: 'finalizar_ronda' })) {
    return 'roundSummary' as const;
  }

  return 'playing' as const;
}
