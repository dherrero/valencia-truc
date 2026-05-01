import {
  TrucAction,
  GameStateUpdate,
  PlayerSeat,
  Card,
} from '@valencia-truc/shared-interfaces';
import {
  getActiveBetState,
  isDesempateActive,
  TrucContext,
} from '@valencia-truc/shared-game-engine';

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
  allPlayerIds: string[] = [],
  playerNames: Record<string, string> = {},
  phase: 'lobby' | 'playing' | 'roundSummary' = 'playing',
  snapshot?: { matches: (s: Record<string, string>) => boolean },
): GameStateUpdate {
  const myCards = context.cartasJugadores?.[playerId] ?? [];

  // Build ordered seated positions relative to this player
  // allPlayerIds order is: [creator, p1, p2, p3] (seat indices 0-3)
  const myIndex = allPlayerIds.indexOf(playerId);
  const myTeam = myIndex % 2 === 0 ? 'equipo1' : 'equipo2';

  const positions: Array<'right' | 'top' | 'left'> = ['right', 'top', 'left'];
  const otherPlayers: PlayerSeat[] = [];

  // Always use modulo 4 so physical seat positions are consistent regardless of
  // how many players have joined. Wrapping on totalPlayers causes duplicates and
  // self-references when fewer than 4 players are present.
  for (let offset = 1; offset <= 3; offset++) {
    const seatIndex = (myIndex + offset) % 4;
    const otherId = allPlayerIds[seatIndex] ?? '';
    const cardCount = context.cartasJugadores?.[otherId]?.length ?? 0;
    const isPartner = offset === 2;
    const position = positions[offset - 1];
    const displayName =
      playerNames[otherId] ??
      (otherId.startsWith('bot-') ? `Bot ${offset}` : `Jugador ${offset}`);

    otherPlayers.push({
      playerId: otherId,
      displayName,
      cardCount,
      isPartner,
      position,
    });
  }

  // First rival for backwards compat
  const firstRival = otherPlayers.find((p) => !p.isPartner);
  const cartasRival = firstRival?.cardCount ?? 0;

  // Para tapadas (isOculta=true): el propio jugador ve su carta, los demás ven el dorso
  const cartasEnMesa = (context.cartasEnMesa || []).map((entry) => {
    if (!entry.isOculta || entry.jugadorId === playerId) return entry;
    // Ocultar carta tapada rival — enviar valor 0 / palo genérico como señal de dorso
    return { jugadorId: entry.jugadorId, carta: entry.carta, isOculta: true };
  });

  const inDesempate = snapshot ? isDesempateActive(snapshot as never) : false;
  const desempateSubmittedCount = Object.keys(context.cartasDesempate ?? {}).length;

  // Block REPARTIR until all 4 seats are filled
  const filteredActions =
    allPlayerIds.length < 4
      ? allowedActions.filter((a) => a !== TrucAction.REPARTIR)
      : allowedActions;

  return {
    board,
    hand: myCards,
    score: context.puntuacionCama,
    phase,
    allowedActions: filteredActions,
    actionLog: context.historialAcciones,
    activeBet: getActiveBetState({ context } as never),
    roundSummary: context.resumenRonda ?? undefined,
    cartasRival,
    otherPlayers,
    totalPlayers,
    myTeam,
    turnoActual: context.turnoActual,
    manoOriginal: context.manoOriginal,
    cartasEnMesa,
    bazaResults: context.historialBazas,
    desempateSubmittedCount: inDesempate ? desempateSubmittedCount : undefined,
    playerCount: allPlayerIds.length,
  };
}
