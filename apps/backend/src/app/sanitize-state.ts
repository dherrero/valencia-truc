import { TrucAction, GameStateUpdate, PlayerSeat, Card } from '@valencia-truc/shared-interfaces';
import { TrucContext } from '@valencia-truc/shared-game-engine';

/**
 * Sanitizes the XState context for a specific player.
 * - Returns only their own cards
 * - Assigns the 3 other players to table positions: right, top, left
 * - In pairs: partner sits opposite (top), rivals sit on the sides
 *
 * Player order from room: [p0, p1, p2, p3]
 * If I am p0: partner = p2, rival-right = p1, rival-left = p3
 * If I am p1: partner = p3, rival-right = p2, rival-left = p0
 * etc.
 */
export function sanitizeGameState(
  context: TrucContext,
  playerId: string,
  allowedActions: TrucAction[],
  board: Card[],
  allPlayerIds: string[] = []
): GameStateUpdate {
  const myCards = context.cartasJugadores?.[playerId] ?? [];

  // Build ordered seated positions relative to this player
  // allPlayerIds order is: [creator, p1, p2, p3] (seat indices 0-3)
  const totalPlayers = allPlayerIds.length;
  const myIndex = allPlayerIds.indexOf(playerId);

  const positions: Array<'right' | 'top' | 'left'> = ['right', 'top', 'left'];
  const otherPlayers: PlayerSeat[] = [];

  for (let offset = 1; offset <= 3; offset++) {
    const seatIndex = (myIndex + offset) % totalPlayers;
    const otherId = allPlayerIds[seatIndex] ?? `seat-${offset}`;
    const cardCount = context.cartasJugadores?.[otherId]?.length ?? 0;
    // In 4-player Truc, pairs are (0,2) vs (1,3)
    // Partner is at offset 2 (diagonal)
    const isPartner = offset === 2;
    const position = positions[offset - 1];

    otherPlayers.push({ playerId: otherId, cardCount, isPartner, position });
  }

  // Pad to 3 seats if fewer than 4 players
  while (otherPlayers.length < 3) {
    const pos = positions[otherPlayers.length];
    otherPlayers.push({ playerId: '', cardCount: 0, isPartner: otherPlayers.length === 1, position: pos });
  }

  // First rival for backwards compat
  const firstRival = otherPlayers.find(p => !p.isPartner);
  const cartasRival = firstRival?.cardCount ?? 0;

  return {
    board,
    hand: myCards,
    score: context.puntuacionCama,
    allowedActions,
    cartasRival,
    otherPlayers,
    turnoActual: context.turnoActual,
    manoOriginal: context.manoOriginal,
    // Eliminamos 'board' nativo y enviamos 'cartasEnMesa' (frontend usará cartasEnMesa o mapeará)
    cartasEnMesa: context.cartasEnMesa || [],
  };
}
