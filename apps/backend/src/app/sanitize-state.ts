import { TrucAction, GameStateUpdate, Card } from '@valencia-truc/shared-interfaces';
import { TrucContext } from '@valencia-truc/shared-game-engine';

export function sanitizeGameState(context: TrucContext, playerId: string, allowedActions: TrucAction[], board: Card[]): GameStateUpdate {
  const myCards = context.cartasJugadores ? context.cartasJugadores[playerId] || [] : [];
  
  const otherPlayerId = context.cartasJugadores ? Object.keys(context.cartasJugadores).find(id => id !== playerId) : undefined;
  const rivalCards = otherPlayerId && context.cartasJugadores[otherPlayerId] ? context.cartasJugadores[otherPlayerId].length : 0;

  return {
    board,
    hand: myCards,
    score: context.puntuacionCama,
    allowedActions,
    cartasRival: rivalCards
  };
}
