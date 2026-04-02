import { createMachine, assign, SnapshotFrom } from 'xstate';
import {
  ActionLogEntry,
  ActiveBetState,
  Card,
  RoundAwardReason,
  RoundSummary,
  TeamPoints,
  TrucAction,
} from '@valencia-truc/shared-interfaces';
import {
  VALENCIA_DECK,
  calculateEnvido,
  getCardPower,
} from './shared-game-engine.js';

type Team = 'equipo1' | 'equipo2';
type ResultadoBaza = Team | 'empate';
type EstadoTruc = 'ninguno' | 'truc' | 'retruc' | 'vale_quatre' | 'juego_fuera';
type EstadoEnvido = 'ninguno' | 'envido' | 'torna_cho';

type CartaEnMesa = { jugadorId: string; carta: Card; isOculta?: boolean };
type CartaDesempate = { jugadorId: string; cartaDescubierta: Card };

type MachineSnapshot = SnapshotFrom<typeof trucMachine>;

export interface TrucContext {
  puntuacionCama: TeamPoints;
  cartasJugadores: Record<string, Card[]>;
  bazasGanadas: { equipo1: number; equipo2: number };
  estadoEnvido: EstadoEnvido;
  puntosEnvidoActual: number;
  equipoApostadorEnvido: Team | null;
  respuestaEnvidoPendiente: boolean;
  manoActual: number;
  turnoActual: string;
  manoOriginal: string;
  jugadoresOrden: string[];
  cartasEnMesa: CartaEnMesa[];
  historialBazas: ResultadoBaza[];
  puntosTrucActual: number;
  estadoApuestaTruc: EstadoTruc;
  equipoApostadorTruc: Team | null;
  respuestaTrucPendiente: boolean;
  rondaTerminadaPorRechazo: boolean;
  desempateCartasSeleccionadas: CartaDesempate[];
  puntosPendientesEnvido: TeamPoints;
  puntosPendientesTruc: TeamPoints;
  motivosPendientesEnvido: RoundAwardReason[];
  motivosPendientesTruc: RoundAwardReason[];
  resumenRonda: RoundSummary | null;
  historialAcciones: ActionLogEntry[];
  siguienteAccionId: number;
}

export type TrucEvent =
  | { type: 'REPARTIR'; jugadores: string[] }
  | { type: 'JUGAR_CARTA'; jugadorId: string; carta: Card }
  | {
      type: 'ELEGIR_CARTA_DESEMPATE';
      jugadorId: string;
      cartaDescubierta: Card;
    }
  | { type: 'CANTAR_TRUC'; jugadorId: string }
  | { type: 'RETRUC'; jugadorId: string }
  | { type: 'VALE_QUATRE'; jugadorId: string }
  | { type: 'JUEGO_FUERA'; jugadorId: string }
  | { type: 'CANTAR_ENVIDO'; jugadorId: string }
  | { type: 'TORNA_CHO'; jugadorId: string }
  | { type: 'QUIERO'; jugadorId: string }
  | { type: 'NO_QUIERO'; jugadorId: string }
  | { type: 'FINALIZAR_MANO' };

function getPlayerTeam(context: TrucContext, jugadorId: string): Team | null {
  const playerIndex = context.jugadoresOrden.indexOf(jugadorId);
  if (playerIndex === -1) return null;

  return playerIndex % 2 === 0 ? 'equipo1' : 'equipo2';
}

function hasCard(cards: Card[] | undefined, target: Card): boolean {
  return (
    cards?.some(
      (card) => card.suit === target.suit && card.value === target.value,
    ) ?? false
  );
}

function isRoundPlayable(snapshot: MachineSnapshot): boolean {
  return (
    snapshot.matches({ ronda: 'mano_1' }) ||
    snapshot.matches({ ronda: 'mano_2' }) ||
    snapshot.matches({ ronda: 'mano_3' }) ||
    snapshot.matches({ ronda: 'mano_desempate' }) ||
    snapshot.matches({ ronda: 'esperando_evaluar_1' }) ||
    snapshot.matches({ ronda: 'esperando_evaluar_2' }) ||
    snapshot.matches({ ronda: 'esperando_evaluar_3' }) ||
    snapshot.matches({ ronda: 'esperando_evaluar_desempate' }) ||
    snapshot.matches({ ronda: 'evaluar_baza_1' }) ||
    snapshot.matches({ ronda: 'evaluar_baza_2' }) ||
    snapshot.matches({ ronda: 'evaluar_baza_3' }) ||
    snapshot.matches({ ronda: 'evaluar_baza_desempate' })
  );
}

function getRejectionPointsForTruc(estado: EstadoTruc): number {
  switch (estado) {
    case 'retruc':
      return 2;
    case 'vale_quatre':
      return 3;
    case 'juego_fuera':
      return 4;
    case 'truc':
    case 'ninguno':
    default:
      return 1;
  }
}

function getRejectionPointsForEnvido(estado: EstadoEnvido): number {
  switch (estado) {
    case 'torna_cho':
      return 2;
    case 'envido':
    case 'ninguno':
    default:
      return 1;
  }
}

function resolveEnvidoWinner(context: TrucContext): Team {
  let winningPlayerId = context.manoOriginal;
  let bestScore = -1;

  for (const jugadorId of context.jugadoresOrden) {
    const score = calculateEnvido(context.cartasJugadores[jugadorId] ?? []);
    if (score > bestScore) {
      bestScore = score;
      winningPlayerId = jugadorId;
      continue;
    }

    if (score === bestScore) {
      const currentWinnerIndex =
        context.jugadoresOrden.indexOf(winningPlayerId);
      const challengerIndex = context.jugadoresOrden.indexOf(jugadorId);
      const manoIndex = context.jugadoresOrden.indexOf(context.manoOriginal);
      const winnerDistance =
        (currentWinnerIndex - manoIndex + context.jugadoresOrden.length) %
        context.jugadoresOrden.length;
      const challengerDistance =
        (challengerIndex - manoIndex + context.jugadoresOrden.length) %
        context.jugadoresOrden.length;

      if (challengerDistance < winnerDistance) {
        winningPlayerId = jugadorId;
      }
    }
  }

  return getPlayerTeam(context, winningPlayerId) ?? 'equipo1';
}

function addPoints(
  score: TrucContext['puntuacionCama'],
  equipo: Team,
  puntos: number,
) {
  return {
    equipo1: score.equipo1 + (equipo === 'equipo1' ? puntos : 0),
    equipo2: score.equipo2 + (equipo === 'equipo2' ? puntos : 0),
  };
}

function addTeamPoints(left: TeamPoints, right: TeamPoints): TeamPoints {
  return {
    equipo1: left.equipo1 + right.equipo1,
    equipo2: left.equipo2 + right.equipo2,
  };
}

function emptyTeamPoints(): TeamPoints {
  return { equipo1: 0, equipo2: 0 };
}

function appendAwardReason(
  reasons: RoundAwardReason[],
  team: Team,
  points: number,
  reasonKey: string,
): RoundAwardReason[] {
  return [...reasons, { team, points, reasonKey }];
}

function getEnvidoReason(estado: EstadoEnvido, accepted: boolean) {
  if (estado === 'torna_cho') {
    return accepted ? 'torna-cho-accepted' : 'torna-cho-rejected';
  }

  return accepted ? 'envido-accepted' : 'envido-rejected';
}

function getTrucReason(estado: EstadoTruc, accepted: boolean) {
  switch (estado) {
    case 'retruc':
      return accepted ? 'retruc-won' : 'retruc-rejected';
    case 'vale_quatre':
      return accepted ? 'vale-quatre-won' : 'vale-quatre-rejected';
    case 'juego_fuera':
      return accepted ? 'juego-fuera-won' : 'juego-fuera-rejected';
    case 'truc':
    case 'ninguno':
    default:
      return accepted ? 'truc-won' : 'truc-rejected';
  }
}

function appendActionLog(
  context: TrucContext,
  entry: Omit<ActionLogEntry, 'id'>,
) {
  return {
    historialAcciones: [
      ...context.historialAcciones,
      { id: context.siguienteAccionId, ...entry },
    ].slice(-8),
    siguienteAccionId: context.siguienteAccionId + 1,
  };
}

function getTrucDisplayPoints(estado: EstadoTruc) {
  switch (estado) {
    case 'truc':
      return 2;
    case 'retruc':
      return 3;
    case 'vale_quatre':
      return 4;
    case 'juego_fuera':
      return 24;
    case 'ninguno':
    default:
      return 0;
  }
}

function getTrucLabel(estado: EstadoTruc) {
  switch (estado) {
    case 'truc':
      return 'Truc';
    case 'retruc':
      return 'Retruc';
    case 'vale_quatre':
      return 'Vale quatre';
    case 'juego_fuera':
      return 'Joc fora';
    case 'ninguno':
    default:
      return '';
  }
}

function getEnvidoLabel(estado: EstadoEnvido) {
  switch (estado) {
    case 'torna_cho':
      return 'Torna-cho';
    case 'envido':
      return 'Envido';
    case 'ninguno':
    default:
      return '';
  }
}

export function getActiveBetState(
  snapshot: MachineSnapshot,
): ActiveBetState | undefined {
  const { context } = snapshot;

  if (context.estadoEnvido !== 'ninguno') {
    return {
      family: 'envido',
      label: getEnvidoLabel(context.estadoEnvido),
      points: context.puntosEnvidoActual,
      waitingResponse: context.respuestaEnvidoPendiente,
    };
  }

  if (context.estadoApuestaTruc !== 'ninguno') {
    return {
      family: 'truc',
      label: getTrucLabel(context.estadoApuestaTruc),
      points: getTrucDisplayPoints(context.estadoApuestaTruc),
      waitingResponse: context.respuestaTrucPendiente,
    };
  }

  return undefined;
}

function playerCanRespondToTeamBet(
  context: TrucContext,
  jugadorId: string,
  equipoApostador: Team | null,
) {
  const playerTeam = getPlayerTeam(context, jugadorId);
  return (
    playerTeam != null &&
    equipoApostador != null &&
    playerTeam !== equipoApostador
  );
}

export function getAllowedActions(
  snapshot: MachineSnapshot,
  jugadorId: string,
): TrucAction[] {
  const { context } = snapshot;
  const allowedActions: TrucAction[] = [];
  const playerTeam = getPlayerTeam(context, jugadorId);
  const hand = context.cartasJugadores[jugadorId] ?? [];
  const hasHandCards = hand.length > 0;

  if (!hasHandCards) {
    if (
      snapshot.matches({ ronda: 'inicio' }) ||
      snapshot.matches({ ronda: 'finalizar_ronda' })
    ) {
      allowedActions.push(TrucAction.REPARTIR);
    }
    return allowedActions;
  }

  if (!isRoundPlayable(snapshot) || playerTeam == null) {
    return allowedActions;
  }

  if (context.respuestaEnvidoPendiente) {
    if (
      playerCanRespondToTeamBet(
        context,
        jugadorId,
        context.equipoApostadorEnvido,
      )
    ) {
      allowedActions.push(TrucAction.QUIERO, TrucAction.NO_QUIERO);
      if (snapshot.matches({ envido: 'cantado' })) {
        allowedActions.push(TrucAction.TORNA_CHO);
      }
    }

    return allowedActions;
  }

  if (context.respuestaTrucPendiente) {
    if (
      playerCanRespondToTeamBet(context, jugadorId, context.equipoApostadorTruc)
    ) {
      allowedActions.push(TrucAction.QUIERO, TrucAction.NO_QUIERO);

      if (snapshot.matches({ truc: 'truc_cantado' })) {
        allowedActions.push(TrucAction.RETRUC);
      }
      if (snapshot.matches({ truc: 'retruc_cantado' })) {
        allowedActions.push(TrucAction.VALE_QUATRE);
      }
      if (snapshot.matches({ truc: 'vale_quatre_cantado' })) {
        allowedActions.push(TrucAction.JUEGO_FUERA);
      }
    }

    return allowedActions;
  }

  if (snapshot.matches({ ronda: 'mano_desempate' })) {
    const alreadySelected = context.desempateCartasSeleccionadas.some(
      (selection) => selection.jugadorId === jugadorId,
    );
    if (!alreadySelected && hand.length >= 2) {
      allowedActions.push(TrucAction.ELEGIR_CARTA_DESEMPATE);
    }

    return allowedActions;
  }

  if (context.turnoActual === jugadorId) {
    allowedActions.push(TrucAction.JUGAR_CARTA);
  }

  if (
    snapshot.matches({ envido: 'disponible' }) &&
    context.manoActual === 1 &&
    context.estadoApuestaTruc === 'ninguno'
  ) {
    allowedActions.push(TrucAction.ENVIDO);
  }

  if (snapshot.matches({ truc: 'truc_disponible' })) {
    allowedActions.push(TrucAction.TRUC);
  }

  if (
    snapshot.matches({ truc: 'retruc_disponible' }) &&
    playerCanRespondToTeamBet(context, jugadorId, context.equipoApostadorTruc)
  ) {
    allowedActions.push(TrucAction.RETRUC);
  }

  if (
    snapshot.matches({ truc: 'vale_quatre_disponible' }) &&
    playerCanRespondToTeamBet(context, jugadorId, context.equipoApostadorTruc)
  ) {
    allowedActions.push(TrucAction.VALE_QUATRE);
  }

  if (
    snapshot.matches({ truc: 'juego_fuera_disponible' }) &&
    playerCanRespondToTeamBet(context, jugadorId, context.equipoApostadorTruc)
  ) {
    allowedActions.push(TrucAction.JUEGO_FUERA);
  }

  return Array.from(new Set(allowedActions));
}

export const trucMachine = createMachine(
  {
    types: {} as { context: TrucContext; events: TrucEvent },
    id: 'trucValenciano',
    type: 'parallel',
    context: {
      puntuacionCama: { equipo1: 0, equipo2: 0 },
      cartasJugadores: {},
      bazasGanadas: { equipo1: 0, equipo2: 0 },
      estadoEnvido: 'ninguno',
      puntosEnvidoActual: 0,
      equipoApostadorEnvido: null,
      respuestaEnvidoPendiente: false,
      manoActual: 1,
      turnoActual: '',
      manoOriginal: '',
      jugadoresOrden: [],
      cartasEnMesa: [],
      historialBazas: [],
      puntosTrucActual: 1,
      estadoApuestaTruc: 'ninguno',
      equipoApostadorTruc: null,
      respuestaTrucPendiente: false,
      rondaTerminadaPorRechazo: false,
      desempateCartasSeleccionadas: [],
      puntosPendientesEnvido: { equipo1: 0, equipo2: 0 },
      puntosPendientesTruc: { equipo1: 0, equipo2: 0 },
      motivosPendientesEnvido: [],
      motivosPendientesTruc: [],
      resumenRonda: null,
      historialAcciones: [],
      siguienteAccionId: 1,
    },
    states: {
      ronda: {
        initial: 'inicio',
        always: [
          { guard: 'equipoGana24', target: '.game_over' },
          { guard: 'rondaTerminadaPorRechazo', target: '.finalizar_ronda' },
        ],
        states: {
          inicio: {
            on: {
              REPARTIR: {
                target: 'mano_1',
                actions: 'repartirCartas',
              },
            },
          },
          mano_1: {
            always: {
              guard: 'mesaLlena',
              target: 'esperando_evaluar_1',
            },
            on: {
              JUGAR_CARTA: {
                actions: 'jugarCarta',
                guard: 'esSuTurnoYTieneCarta',
              },
            },
          },
          esperando_evaluar_1: {
            after: {
              1500: {
                target: 'evaluar_baza_1',
                actions: 'evaluarGanadorBaza',
              },
            },
          },
          evaluar_baza_1: {
            always: [
              { guard: 'bazaEmpatada', target: 'mano_desempate' },
              { target: 'mano_2' },
            ],
          },
          mano_desempate: {
            always: {
              guard: 'todosEligieronDesempate',
              target: 'esperando_evaluar_desempate',
            },
            on: {
              ELEGIR_CARTA_DESEMPATE: {
                actions: 'elegirCartaDesempate',
                guard: 'tieneCartaYNoHaElegidoDesempate',
              },
            },
          },
          esperando_evaluar_desempate: {
            after: {
              1500: {
                target: 'evaluar_baza_desempate',
                actions: 'evaluarDesempateMano1',
              },
            },
          },
          evaluar_baza_desempate: {
            always: [
              {
                guard: 'equipo1GanaRonda',
                target: 'finalizar_ronda',
                actions: 'anotarRondaEq1',
              },
              {
                guard: 'equipo2GanaRonda',
                target: 'finalizar_ronda',
                actions: 'anotarRondaEq2',
              },
              { target: 'finalizar_ronda', actions: 'anotarRondaManoOriginal' },
            ],
          },
          mano_2: {
            always: {
              guard: 'mesaLlena',
              target: 'esperando_evaluar_2',
            },
            on: {
              JUGAR_CARTA: {
                actions: 'jugarCarta',
                guard: 'esSuTurnoYTieneCarta',
              },
            },
          },
          esperando_evaluar_2: {
            after: {
              1500: {
                target: 'evaluar_baza_2',
                actions: 'evaluarGanadorBaza',
              },
            },
          },
          evaluar_baza_2: {
            always: [
              {
                guard: 'equipo1GanaRonda',
                target: 'finalizar_ronda',
                actions: 'anotarRondaEq1',
              },
              {
                guard: 'equipo2GanaRonda',
                target: 'finalizar_ronda',
                actions: 'anotarRondaEq2',
              },
              { target: 'mano_3' },
            ],
          },
          mano_3: {
            always: {
              guard: 'mesaLlena',
              target: 'esperando_evaluar_3',
            },
            on: {
              JUGAR_CARTA: {
                actions: 'jugarCarta',
                guard: 'esSuTurnoYTieneCarta',
              },
            },
          },
          esperando_evaluar_3: {
            after: {
              1500: {
                target: 'evaluar_baza_3',
                actions: 'evaluarGanadorBaza',
              },
            },
          },
          evaluar_baza_3: {
            always: [
              {
                guard: 'equipo1GanaRonda',
                target: 'finalizar_ronda',
                actions: 'anotarRondaEq1',
              },
              {
                guard: 'equipo2GanaRonda',
                target: 'finalizar_ronda',
                actions: 'anotarRondaEq2',
              },
              { target: 'finalizar_ronda', actions: 'anotarRondaManoOriginal' },
            ],
          },
          finalizar_ronda: {
            entry: ['cerrarResumenRonda', 'limpiarEstadoPendienteRonda'],
            always: [{ guard: 'equipoGana24', target: 'game_over' }],
            on: {
              REPARTIR: {
                target: 'mano_1',
                actions: 'repartirCartas',
              },
            },
          },
          game_over: {
            type: 'final',
          },
        },
      },
      envido: {
        initial: 'disponible',
        states: {
          disponible: {
            on: {
              CANTAR_ENVIDO: {
                target: 'cantado',
                guard: 'puedeCantarEnvido',
                actions: 'registrarCantadaEnvido',
              },
              REPARTIR: { target: 'disponible' },
            },
          },
          cantado: {
            on: {
              QUIERO: {
                target: 'finalizado',
                guard: 'respondeEquipoContrarioEnvido',
                actions: 'resolverEnvido',
              },
              NO_QUIERO: {
                target: 'finalizado',
                guard: 'respondeEquipoContrarioEnvido',
                actions: 'rechazarEnvido',
              },
              TORNA_CHO: {
                target: 'torna_cho_cantado',
                guard: 'respondeEquipoContrarioEnvido',
                actions: 'registrarTornaCho',
              },
              REPARTIR: { target: 'disponible' },
            },
          },
          torna_cho_cantado: {
            on: {
              QUIERO: {
                target: 'finalizado',
                guard: 'respondeEquipoContrarioEnvido',
                actions: 'resolverEnvido',
              },
              NO_QUIERO: {
                target: 'finalizado',
                guard: 'respondeEquipoContrarioEnvido',
                actions: 'rechazarEnvido',
              },
              REPARTIR: { target: 'disponible' },
            },
          },
          finalizado: {
            on: {
              REPARTIR: { target: 'disponible' },
            },
          },
        },
      },
      truc: {
        initial: 'truc_disponible',
        states: {
          truc_disponible: {
            on: {
              CANTAR_TRUC: {
                target: 'truc_cantado',
                guard: 'puedeCantarTruc',
                actions: 'registrarCantadaTruc',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          truc_cantado: {
            on: {
              QUIERO: {
                target: 'retruc_disponible',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'aceptarTruc',
              },
              NO_QUIERO: {
                target: 'finalizar_juego_por_rechazo',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'rechazarTruc',
              },
              RETRUC: {
                target: 'retruc_cantado',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'registrarCantadaRetruc',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          retruc_disponible: {
            on: {
              RETRUC: {
                target: 'retruc_cantado',
                guard: 'puedeSubirTruc',
                actions: 'registrarCantadaRetruc',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          retruc_cantado: {
            on: {
              QUIERO: {
                target: 'vale_quatre_disponible',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'aceptarRetruc',
              },
              NO_QUIERO: {
                target: 'finalizar_juego_por_rechazo',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'rechazarTruc',
              },
              VALE_QUATRE: {
                target: 'vale_quatre_cantado',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'registrarCantadaValeQuatre',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          vale_quatre_disponible: {
            on: {
              VALE_QUATRE: {
                target: 'vale_quatre_cantado',
                guard: 'puedeSubirTruc',
                actions: 'registrarCantadaValeQuatre',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          vale_quatre_cantado: {
            on: {
              QUIERO: {
                target: 'juego_fuera_disponible',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'aceptarValeQuatre',
              },
              NO_QUIERO: {
                target: 'finalizar_juego_por_rechazo',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'rechazarTruc',
              },
              JUEGO_FUERA: {
                target: 'juego_fuera_cantado',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'registrarCantadaJuegoFuera',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          juego_fuera_disponible: {
            on: {
              JUEGO_FUERA: {
                target: 'juego_fuera_cantado',
                guard: 'puedeSubirTruc',
                actions: 'registrarCantadaJuegoFuera',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          juego_fuera_cantado: {
            on: {
              QUIERO: {
                target: 'esperando_fin_juego',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'aceptarJuegoFuera',
              },
              NO_QUIERO: {
                target: 'finalizar_juego_por_rechazo',
                guard: 'respondeEquipoContrarioTruc',
                actions: 'rechazarTruc',
              },
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          esperando_fin_juego: {
            on: {
              REPARTIR: { target: 'truc_disponible' },
            },
          },
          finalizar_juego_por_rechazo: {
            entry: 'abortarRondaPorRechazo',
            on: {
              REPARTIR: { target: 'truc_disponible' },
            },
          },
        },
      },
    },
  },
  {
    guards: {
      equipoGana24: ({ context }) => {
        const { equipo1, equipo2 } = context.puntuacionCama;
        return equipo1 >= 24 || equipo2 >= 24;
      },
      rondaTerminadaPorRechazo: ({ context }) =>
        context.rondaTerminadaPorRechazo,
      puedeCantarEnvido: ({ context, event }) => {
        if (event.type !== 'CANTAR_ENVIDO') return false;

        return (
          context.manoActual === 1 &&
          context.estadoApuestaTruc === 'ninguno' &&
          !context.respuestaEnvidoPendiente &&
          !context.respuestaTrucPendiente &&
          (context.cartasJugadores[event.jugadorId]?.length ?? 0) > 0
        );
      },
      puedeCantarTruc: ({ context, event }) => {
        if (event.type !== 'CANTAR_TRUC') return false;

        return (
          !context.respuestaEnvidoPendiente &&
          !context.respuestaTrucPendiente &&
          (context.cartasJugadores[event.jugadorId]?.length ?? 0) > 0
        );
      },
      puedeSubirTruc: ({ context, event }) => {
        if (!('jugadorId' in event)) return false;

        return (
          !context.respuestaEnvidoPendiente &&
          !context.respuestaTrucPendiente &&
          playerCanRespondToTeamBet(
            context,
            event.jugadorId,
            context.equipoApostadorTruc,
          ) &&
          (context.cartasJugadores[event.jugadorId]?.length ?? 0) > 0
        );
      },
      respondeEquipoContrarioEnvido: ({ context, event }) => {
        if (!('jugadorId' in event)) return false;
        return (
          context.respuestaEnvidoPendiente &&
          playerCanRespondToTeamBet(
            context,
            event.jugadorId,
            context.equipoApostadorEnvido,
          )
        );
      },
      respondeEquipoContrarioTruc: ({ context, event }) => {
        if (!('jugadorId' in event)) return false;
        return (
          context.respuestaTrucPendiente &&
          playerCanRespondToTeamBet(
            context,
            event.jugadorId,
            context.equipoApostadorTruc,
          )
        );
      },
      mesaLlena: ({ context }) =>
        context.cartasEnMesa.length === context.jugadoresOrden.length,
      bazaEmpatada: ({ context }) => {
        const historial = context.historialBazas;
        return (
          historial.length > 0 && historial[historial.length - 1] === 'empate'
        );
      },
      esSuTurnoYTieneCarta: ({ context, event }) => {
        if (event.type !== 'JUGAR_CARTA') return false;
        if (context.respuestaEnvidoPendiente || context.respuestaTrucPendiente)
          return false;
        if (context.turnoActual !== event.jugadorId) return false;

        return hasCard(context.cartasJugadores[event.jugadorId], event.carta);
      },
      todosEligieronDesempate: ({ context }) =>
        context.desempateCartasSeleccionadas.length ===
        context.jugadoresOrden.length,
      tieneCartaYNoHaElegidoDesempate: ({ context, event }) => {
        if (event.type !== 'ELEGIR_CARTA_DESEMPATE') return false;

        const alreadySelected = context.desempateCartasSeleccionadas.some(
          (selection) => selection.jugadorId === event.jugadorId,
        );
        if (alreadySelected) return false;

        return hasCard(
          context.cartasJugadores[event.jugadorId],
          event.cartaDescubierta,
        );
      },
      equipo1GanaRonda: ({ context }) => {
        const historial = context.historialBazas;
        const equipo1 = historial.filter((baza) => baza === 'equipo1').length;

        if (equipo1 >= 2) return true;
        if (historial[0] === 'equipo1' && historial[1] === 'empate')
          return true;
        if (
          historial[0] === 'equipo1' &&
          historial[1] === 'equipo2' &&
          historial[2] === 'empate'
        )
          return true;
        if (historial[0] === 'empate' && historial[1] === 'equipo1')
          return true;
        if (historial[0] === 'empate' && historial[1] === 'empate') {
          return context.jugadoresOrden.indexOf(context.manoOriginal) % 2 === 0;
        }

        return false;
      },
      equipo2GanaRonda: ({ context }) => {
        const historial = context.historialBazas;
        const equipo2 = historial.filter((baza) => baza === 'equipo2').length;

        if (equipo2 >= 2) return true;
        if (historial[0] === 'equipo2' && historial[1] === 'empate')
          return true;
        if (
          historial[0] === 'equipo2' &&
          historial[1] === 'equipo1' &&
          historial[2] === 'empate'
        )
          return true;
        if (historial[0] === 'empate' && historial[1] === 'equipo2')
          return true;
        if (historial[0] === 'empate' && historial[1] === 'empate') {
          return context.jugadoresOrden.indexOf(context.manoOriginal) % 2 !== 0;
        }

        return false;
      },
    },
    actions: {
      registrarCantadaEnvido: assign(({ context, event }) => {
        if (event.type !== 'CANTAR_ENVIDO') return {};

        return {
          ...appendActionLog(context, {
            type: 'ENVIDO',
            jugadorId: event.jugadorId,
          }),
          estadoEnvido: 'envido' as const,
          puntosEnvidoActual: 2,
          equipoApostadorEnvido: getPlayerTeam(context, event.jugadorId),
          respuestaEnvidoPendiente: true,
        };
      }),
      registrarTornaCho: assign(({ context, event }) => {
        if (event.type !== 'TORNA_CHO') return {};

        return {
          ...appendActionLog(context, {
            type: 'TORNA_CHO',
            jugadorId: event.jugadorId,
          }),
          estadoEnvido: 'torna_cho' as const,
          puntosEnvidoActual: 4,
          equipoApostadorEnvido: getPlayerTeam(context, event.jugadorId),
          respuestaEnvidoPendiente: true,
        };
      }),
      resolverEnvido: assign(({ context, event }) => {
        const ganador = resolveEnvidoWinner(context);
        const puntos = context.puntosEnvidoActual;

        return {
          ...appendActionLog(
            context,
            'jugadorId' in event
              ? { type: 'QUIERO', jugadorId: event.jugadorId }
              : { type: 'QUIERO' },
          ),
          puntosPendientesEnvido: addPoints(
            context.puntosPendientesEnvido,
            ganador,
            puntos,
          ),
          motivosPendientesEnvido: appendAwardReason(
            context.motivosPendientesEnvido,
            ganador,
            puntos,
            getEnvidoReason(context.estadoEnvido, true),
          ),
          estadoEnvido: 'ninguno' as const,
          puntosEnvidoActual: 0,
          equipoApostadorEnvido: null,
          respuestaEnvidoPendiente: false,
        };
      }),
      rechazarEnvido: assign(({ context, event }) => {
        const ganador = context.equipoApostadorEnvido;
        if (ganador == null) return {};
        const puntos = getRejectionPointsForEnvido(context.estadoEnvido);

        return {
          ...appendActionLog(
            context,
            'jugadorId' in event
              ? { type: 'NO_QUIERO', jugadorId: event.jugadorId }
              : { type: 'NO_QUIERO' },
          ),
          puntosPendientesEnvido: addPoints(
            context.puntosPendientesEnvido,
            ganador,
            puntos,
          ),
          motivosPendientesEnvido: appendAwardReason(
            context.motivosPendientesEnvido,
            ganador,
            puntos,
            getEnvidoReason(context.estadoEnvido, false),
          ),
          estadoEnvido: 'ninguno' as const,
          puntosEnvidoActual: 0,
          equipoApostadorEnvido: null,
          respuestaEnvidoPendiente: false,
        };
      }),
      registrarCantadaTruc: assign(({ context, event }) => {
        if (event.type !== 'CANTAR_TRUC') return {};

        return {
          ...appendActionLog(context, {
            type: 'TRUC',
            jugadorId: event.jugadorId,
          }),
          estadoApuestaTruc: 'truc' as const,
          equipoApostadorTruc: getPlayerTeam(context, event.jugadorId),
          respuestaTrucPendiente: true,
        };
      }),
      aceptarTruc: assign(({ context, event }) => ({
        ...appendActionLog(
          context,
          'jugadorId' in event
            ? { type: 'QUIERO', jugadorId: event.jugadorId }
            : { type: 'QUIERO' },
        ),
        puntosTrucActual: 2,
        respuestaTrucPendiente: false,
      })),
      registrarCantadaRetruc: assign(({ context, event }) => {
        if (event.type !== 'RETRUC') return {};

        return {
          ...appendActionLog(context, {
            type: 'RETRUC',
            jugadorId: event.jugadorId,
          }),
          estadoApuestaTruc: 'retruc' as const,
          equipoApostadorTruc: getPlayerTeam(context, event.jugadorId),
          respuestaTrucPendiente: true,
        };
      }),
      aceptarRetruc: assign(({ context, event }) => ({
        ...appendActionLog(
          context,
          'jugadorId' in event
            ? { type: 'QUIERO', jugadorId: event.jugadorId }
            : { type: 'QUIERO' },
        ),
        puntosTrucActual: 3,
        respuestaTrucPendiente: false,
      })),
      registrarCantadaValeQuatre: assign(({ context, event }) => {
        if (event.type !== 'VALE_QUATRE') return {};

        return {
          ...appendActionLog(context, {
            type: 'VALE_QUATRE',
            jugadorId: event.jugadorId,
          }),
          estadoApuestaTruc: 'vale_quatre' as const,
          equipoApostadorTruc: getPlayerTeam(context, event.jugadorId),
          respuestaTrucPendiente: true,
        };
      }),
      aceptarValeQuatre: assign(({ context, event }) => ({
        ...appendActionLog(
          context,
          'jugadorId' in event
            ? { type: 'QUIERO', jugadorId: event.jugadorId }
            : { type: 'QUIERO' },
        ),
        puntosTrucActual: 4,
        respuestaTrucPendiente: false,
      })),
      registrarCantadaJuegoFuera: assign(({ context, event }) => {
        if (event.type !== 'JUEGO_FUERA') return {};

        return {
          ...appendActionLog(context, {
            type: 'JUEGO_FUERA',
            jugadorId: event.jugadorId,
          }),
          estadoApuestaTruc: 'juego_fuera' as const,
          equipoApostadorTruc: getPlayerTeam(context, event.jugadorId),
          respuestaTrucPendiente: true,
        };
      }),
      aceptarJuegoFuera: assign(({ context, event }) => ({
        ...appendActionLog(
          context,
          'jugadorId' in event
            ? { type: 'QUIERO', jugadorId: event.jugadorId }
            : { type: 'QUIERO' },
        ),
        puntosTrucActual: 24,
        respuestaTrucPendiente: false,
      })),
      rechazarTruc: assign(({ context, event }) => {
        const ganador = context.equipoApostadorTruc;
        if (ganador == null) return {};
        const puntos = getRejectionPointsForTruc(context.estadoApuestaTruc);

        return {
          ...appendActionLog(
            context,
            'jugadorId' in event
              ? { type: 'NO_QUIERO', jugadorId: event.jugadorId }
              : { type: 'NO_QUIERO' },
          ),
          puntosPendientesTruc: addPoints(
            context.puntosPendientesTruc,
            ganador,
            puntos,
          ),
          motivosPendientesTruc: appendAwardReason(
            context.motivosPendientesTruc,
            ganador,
            puntos,
            getTrucReason(context.estadoApuestaTruc, false),
          ),
          respuestaTrucPendiente: false,
          rondaTerminadaPorRechazo: true,
        };
      }),
      abortarRondaPorRechazo: () => {
        console.log('Ronda finalizada porque se rechazó una apuesta de Truc.');
      },
      cerrarResumenRonda: assign(({ context }) => {
        const scoreWithEnvido = addTeamPoints(
          context.puntuacionCama,
          context.puntosPendientesEnvido,
        );
        const envidoCierraPartida =
          scoreWithEnvido.equipo1 >= 24 || scoreWithEnvido.equipo2 >= 24;
        const awarded = envidoCierraPartida
          ? context.puntosPendientesEnvido
          : addTeamPoints(
              context.puntosPendientesEnvido,
              context.puntosPendientesTruc,
            );
        const scoreAfter = addTeamPoints(context.puntuacionCama, awarded);

        return {
          puntuacionCama: scoreAfter,
          resumenRonda: {
            envido: context.puntosPendientesEnvido,
            truc: envidoCierraPartida
              ? emptyTeamPoints()
              : context.puntosPendientesTruc,
            awarded,
            scoreAfter,
            reasons: envidoCierraPartida
              ? context.motivosPendientesEnvido
              : [
                  ...context.motivosPendientesEnvido,
                  ...context.motivosPendientesTruc,
                ],
          },
          puntosPendientesEnvido: emptyTeamPoints(),
          puntosPendientesTruc: emptyTeamPoints(),
          motivosPendientesEnvido: [],
          motivosPendientesTruc: [],
        };
      }),
      limpiarEstadoPendienteRonda: assign({
        rondaTerminadaPorRechazo: false,
        respuestaTrucPendiente: false,
        respuestaEnvidoPendiente: false,
      }),
      anotarRondaEq1: assign(({ context }) => ({
        puntosPendientesTruc: addPoints(
          context.puntosPendientesTruc,
          'equipo1',
          context.puntosTrucActual,
        ),
        motivosPendientesTruc: appendAwardReason(
          context.motivosPendientesTruc,
          'equipo1',
          context.puntosTrucActual,
          getTrucReason(context.estadoApuestaTruc, true),
        ),
      })),
      anotarRondaEq2: assign(({ context }) => ({
        puntosPendientesTruc: addPoints(
          context.puntosPendientesTruc,
          'equipo2',
          context.puntosTrucActual,
        ),
        motivosPendientesTruc: appendAwardReason(
          context.motivosPendientesTruc,
          'equipo2',
          context.puntosTrucActual,
          getTrucReason(context.estadoApuestaTruc, true),
        ),
      })),
      anotarRondaManoOriginal: assign(({ context }) => {
        const ganador =
          getPlayerTeam(context, context.manoOriginal) ?? 'equipo1';

        return {
          puntosPendientesTruc: addPoints(
            context.puntosPendientesTruc,
            ganador,
            context.puntosTrucActual,
          ),
          motivosPendientesTruc: appendAwardReason(
            context.motivosPendientesTruc,
            ganador,
            context.puntosTrucActual,
            getTrucReason(context.estadoApuestaTruc, true),
          ),
        };
      }),
      repartirCartas: assign(({ context, event }) => {
        const jugadores =
          event.type === 'REPARTIR' && event.jugadores.length > 0
            ? event.jugadores
            : [];
        const jugadoresOrden =
          jugadores.length === 4 ? jugadores : ['p1', 'p2', 'p3', 'p4'];

        let manoOriginal = context.manoOriginal;
        if (manoOriginal && jugadoresOrden.includes(manoOriginal)) {
          const nextIndex =
            (jugadoresOrden.indexOf(manoOriginal) + 1) % jugadoresOrden.length;
          manoOriginal = jugadoresOrden[nextIndex];
        } else {
          manoOriginal =
            jugadoresOrden[Math.floor(Math.random() * jugadoresOrden.length)];
        }

        const shuffled = [...VALENCIA_DECK].sort(() => Math.random() - 0.5);
        const cartasJugadores: Record<string, Card[]> = {};
        jugadoresOrden.forEach((jugadorId, index) => {
          cartasJugadores[jugadorId] = shuffled.slice(
            index * 3,
            (index + 1) * 3,
          );
        });

        return {
          ...appendActionLog(context, { type: 'REPARTIR' }),
          manoActual: 1,
          bazasGanadas: { equipo1: 0, equipo2: 0 },
          historialBazas: [],
          estadoEnvido: 'ninguno' as const,
          puntosEnvidoActual: 0,
          equipoApostadorEnvido: null,
          respuestaEnvidoPendiente: false,
          puntosTrucActual: 1,
          estadoApuestaTruc: 'ninguno' as const,
          equipoApostadorTruc: null,
          respuestaTrucPendiente: false,
          rondaTerminadaPorRechazo: false,
          desempateCartasSeleccionadas: [],
          puntosPendientesEnvido: emptyTeamPoints(),
          puntosPendientesTruc: emptyTeamPoints(),
          motivosPendientesEnvido: [],
          motivosPendientesTruc: [],
          resumenRonda: null,
          cartasJugadores,
          jugadoresOrden,
          manoOriginal,
          turnoActual: manoOriginal,
          cartasEnMesa: [],
        } as Partial<TrucContext>;
      }),
      jugarCarta: assign(({ context, event }) => {
        if (event.type !== 'JUGAR_CARTA') return {};

        const nextHand = context.cartasJugadores[event.jugadorId].filter(
          (card) =>
            !(
              card.suit === event.carta.suit && card.value === event.carta.value
            ),
        );
        const nuevasCartasEnMesa = [
          ...context.cartasEnMesa,
          { jugadorId: event.jugadorId, carta: event.carta, isOculta: false },
        ];
        const currentIndex = context.jugadoresOrden.indexOf(event.jugadorId);
        const nextIndex = (currentIndex + 1) % context.jugadoresOrden.length;

        return {
          ...appendActionLog(context, {
            type: 'JUGAR_CARTA',
            jugadorId: event.jugadorId,
          }),
          cartasJugadores: {
            ...context.cartasJugadores,
            [event.jugadorId]: nextHand,
          },
          cartasEnMesa: nuevasCartasEnMesa,
          turnoActual: context.jugadoresOrden[nextIndex],
        };
      }),
      elegirCartaDesempate: assign(({ context, event }) => {
        if (event.type !== 'ELEGIR_CARTA_DESEMPATE') return {};

        return {
          ...appendActionLog(context, {
            type: 'ELEGIR_CARTA_DESEMPATE',
            jugadorId: event.jugadorId,
          }),
          desempateCartasSeleccionadas: [
            ...context.desempateCartasSeleccionadas,
            {
              jugadorId: event.jugadorId,
              cartaDescubierta: event.cartaDescubierta,
            },
          ],
        };
      }),
      evaluarDesempateMano1: assign(({ context }) => {
        let maxAbierta = -1;
        let mejoresJugadas: Array<{
          jugadorId: string;
          cartaDescubierta: Card;
          cartaOculta?: Card;
        }> = [];

        const jugadasMesa = context.desempateCartasSeleccionadas.map(
          (selection) => {
            const cartasRestantes =
              context.cartasJugadores[selection.jugadorId] ?? [];
            const cartaOculta = cartasRestantes.find(
              (card) =>
                !(
                  card.suit === selection.cartaDescubierta.suit &&
                  card.value === selection.cartaDescubierta.value
                ),
            );

            return {
              jugadorId: selection.jugadorId,
              cartaDescubierta: selection.cartaDescubierta,
              cartaOculta,
            };
          },
        );

        jugadasMesa.forEach((jugada) => {
          const power = getCardPower(jugada.cartaDescubierta);
          if (power > maxAbierta) {
            maxAbierta = power;
            mejoresJugadas = [jugada];
            return;
          }

          if (power === maxAbierta) {
            mejoresJugadas.push(jugada);
          }
        });

        const equiposEmpatadosAbierta = new Set(
          mejoresJugadas.map((jugada) =>
            getPlayerTeam(context, jugada.jugadorId),
          ),
        );
        let ganadorBaza: ResultadoBaza = 'empate';

        if (equiposEmpatadosAbierta.size === 1) {
          ganadorBaza = (Array.from(equiposEmpatadosAbierta)[0] ??
            'empate') as ResultadoBaza;
        } else {
          let maxOculta = -1;
          let finalistasOcultos: typeof mejoresJugadas = [];

          mejoresJugadas.forEach((jugada) => {
            if (!jugada.cartaOculta) {
              finalistasOcultos.push(jugada);
              return;
            }

            let powerOculta = getCardPower(jugada.cartaOculta);
            const powerAbierta = getCardPower(jugada.cartaDescubierta);
            if (powerOculta >= powerAbierta) {
              powerOculta = 0;
            }

            if (powerOculta > maxOculta) {
              maxOculta = powerOculta;
              finalistasOcultos = [jugada];
              return;
            }

            if (powerOculta === maxOculta) {
              finalistasOcultos.push(jugada);
            }
          });

          const equiposEmpatadosOculta = new Set(
            finalistasOcultos.map((jugada) =>
              getPlayerTeam(context, jugada.jugadorId),
            ),
          );
          if (equiposEmpatadosOculta.size === 1) {
            ganadorBaza = (Array.from(equiposEmpatadosOculta)[0] ??
              'empate') as ResultadoBaza;
          }
        }

        const historialBazas = [...context.historialBazas, ganadorBaza];
        const cartasVacias: Record<string, Card[]> = {};
        context.jugadoresOrden.forEach((jugadorId) => {
          cartasVacias[jugadorId] = [];
        });

        return {
          historialBazas,
          desempateCartasSeleccionadas: [],
          cartasEnMesa: [],
          cartasJugadores: cartasVacias,
        };
      }),
      evaluarGanadorBaza: assign(({ context }) => {
        if (context.cartasEnMesa.length === 0) return {};

        let maxPower = -1;
        let mejoresJugadas: CartaEnMesa[] = [];

        context.cartasEnMesa.forEach((jugada) => {
          const power = getCardPower(jugada.carta);
          if (power > maxPower) {
            maxPower = power;
            mejoresJugadas = [jugada];
            return;
          }

          if (power === maxPower) {
            mejoresJugadas.push(jugada);
          }
        });

        const equiposEmpatados = new Set(
          mejoresJugadas.map((jugada) =>
            getPlayerTeam(context, jugada.jugadorId),
          ),
        );
        let ganadorBaza: ResultadoBaza = 'empate';
        let ganadorId = context.turnoActual;

        if (equiposEmpatados.size === 1) {
          ganadorBaza = (Array.from(equiposEmpatados)[0] ??
            'empate') as ResultadoBaza;
          ganadorId = mejoresJugadas[0].jugadorId;
        }

        return {
          historialBazas: [...context.historialBazas, ganadorBaza],
          cartasEnMesa: [],
          turnoActual: ganadorId,
          manoActual: context.manoActual + 1,
        };
      }),
    },
  },
);
