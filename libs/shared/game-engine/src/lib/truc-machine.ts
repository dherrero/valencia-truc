import { createMachine, assign } from 'xstate';
import { Card } from '@valencia-truc/shared-interfaces';
import { VALENCIA_DECK, getCardPower } from './shared-game-engine.js';

export interface TrucContext {
  puntuacionCama: { equipo1: number; equipo2: number };
  cartasJugadores: { [jugadorId: string]: Card[] };
  bazasGanadas: { equipo1: number; equipo2: number };
  estadoEnvido: number;
  manoActual: number;
  // Añadido para turnos:
  turnoActual: string;
  manoOriginal: string;
  jugadoresOrden: string[];
  cartasEnMesa: { jugadorId: string; carta: Card }[];
}

export type TrucEvent =
  | { type: 'REPARTIR'; jugadores: string[] }
  | { type: 'JUGAR_CARTA'; jugadorId: string; carta: Card }
  | { type: 'CANTAR_TRUC'; jugadorId: string }
  | { type: 'RETRUC'; jugadorId: string }
  | { type: 'VALE_QUATRE'; jugadorId: string }
  | { type: 'CANTAR_ENVIDO'; jugadorId: string }
  | { type: 'QUIERO'; jugadorId: string }
  | { type: 'NO_QUIERO'; jugadorId: string }
  | { type: 'FINALIZAR_MANO' };

export const trucMachine = createMachine(
  {
    types: {} as { context: TrucContext; events: TrucEvent },
    id: 'trucValenciano',
    type: 'parallel',
    context: {
      puntuacionCama: { equipo1: 0, equipo2: 0 },
      cartasJugadores: {},
      bazasGanadas: { equipo1: 0, equipo2: 0 },
      estadoEnvido: 0,
      manoActual: 1,
      turnoActual: '',
      manoOriginal: '',
      jugadoresOrden: [],
      cartasEnMesa: []
    },
    states: {
      ronda: {
        initial: 'inicio',
        states: {
          inicio: {
            on: {
              REPARTIR: {
                target: 'mano_1',
                actions: 'repartirCartas'
              }
            }
          },
          mano_1: {
            always: {
              guard: 'mesaLlena',
              target: 'evaluar_baza_1'
            },
            on: {
              JUGAR_CARTA: {
                actions: 'jugarCarta',
                guard: 'esSuTurnoYTieneCarta'
              }
            }
          },
          evaluar_baza_1: {
            entry: 'evaluarGanadorBaza',
            always: 'mano_2'
          },
          mano_2: {
            always: {
              guard: 'mesaLlena',
              target: 'evaluar_baza_2'
            },
            on: {
              JUGAR_CARTA: {
                actions: 'jugarCarta',
                guard: 'esSuTurnoYTieneCarta'
              }
            }
          },
          evaluar_baza_2: {
            entry: 'evaluarGanadorBaza',
            always: [
              { guard: 'equipo1GanaRonda', target: 'finalizar_ronda', actions: 'anotarRondaEq1' },
              { guard: 'equipo2GanaRonda', target: 'finalizar_ronda', actions: 'anotarRondaEq2' },
              { target: 'mano_3' }
            ]
          },
          mano_3: {
            always: {
              guard: 'mesaLlena',
              target: 'evaluar_baza_3'
            },
            on: {
              JUGAR_CARTA: {
                actions: 'jugarCarta',
                guard: 'esSuTurnoYTieneCarta'
              }
            }
          },
          evaluar_baza_3: {
            entry: 'evaluarGanadorBaza',
            always: [
              { guard: 'equipo1GanaRonda', target: 'finalizar_ronda', actions: 'anotarRondaEq1' },
              { guard: 'equipo2GanaRonda', target: 'finalizar_ronda', actions: 'anotarRondaEq2' },
              { target: 'finalizar_ronda', actions: 'anotarRondaEmpate' }
            ]
          },
          finalizar_ronda: {
            type: 'final'
          }
        }
      },
      envido: {
        initial: 'disponible',
        states: {
          disponible: {
            on: {
              CANTAR_ENVIDO: {
                target: 'cantado',
                guard: 'isManoValida'
              }
            }
          },
          cantado: {
            on: {
              QUIERO: {
                target: 'respondido',
                actions: 'resolverEnvido'
              },
              NO_QUIERO: {
                target: 'finalizado',
                actions: 'rechazarEnvido'
              }
            }
          },
          respondido: {
            always: 'finalizado'
          },
          finalizado: {
            type: 'final'
          }
        }
      },
      truc: {
        initial: 'truc_disponible',
        states: {
          truc_disponible: {
            on: {
              CANTAR_TRUC: 'truc_cantado'
            }
          },
          truc_cantado: {
            on: {
              QUIERO: 'truc_disponible',
              NO_QUIERO: 'finalizar_juego_por_rechazo',
              RETRUC: 'retruc_cantado'
            }
          },
          retruc_cantado: {
            on: {
              QUIERO: 'truc_disponible',
              NO_QUIERO: 'finalizar_juego_por_rechazo',
              VALE_QUATRE: 'vale_quatre_cantado'
            }
          },
          vale_quatre_cantado: {
            on: {
              QUIERO: 'truc_disponible',
              NO_QUIERO: 'finalizar_juego_por_rechazo'
            }
          },
          finalizar_juego_por_rechazo: {
            type: 'final'
          }
        }
      }
    }
  },
  {
    guards: {
      isManoValida: (args: any) => {
        const { context } = args;
        return context.manoActual === 1;
      },
      mesaLlena: (args: any) => {
        const { context } = args;
        return context.cartasEnMesa.length === context.jugadoresOrden.length;
      },
      esSuTurnoYTieneCarta: (args: any) => {
        const { context, event } = args;
        if (event.type !== 'JUGAR_CARTA') return false;
        if (context.turnoActual !== event.jugadorId) return false;
        
        const tieneCarta = context.cartasJugadores[event.jugadorId]?.some(
          (c: Card) => c.suit === event.carta.suit && c.value === event.carta.value
        );
        return tieneCarta;
      },
      equipo1GanaRonda: (args: any) => args.context.bazasGanadas.equipo1 >= 2,
      equipo2GanaRonda: (args: any) => args.context.bazasGanadas.equipo2 >= 2
    },
    actions: {
      resolverEnvido: () => console.log('Resolviendo puntos para Envido...'),
      rechazarEnvido: () => console.log('Envido rechazado (se sumará 1 punto a Cama)'),
      
      anotarRondaEq1: assign((args: any) => {
        // En un juego completo se suma cama
        return { puntuacionCama: { ...args.context.puntuacionCama, equipo1: args.context.puntuacionCama.equipo1 + 1 }};
      }),
      anotarRondaEq2: assign((args: any) => {
        return { puntuacionCama: { ...args.context.puntuacionCama, equipo2: args.context.puntuacionCama.equipo2 + 1 }};
      }),
      anotarRondaEmpate: assign((args: any) => {
        // Gana la mano por empate (Asumimos Eq1 por ahora)
        return { puntuacionCama: { ...args.context.puntuacionCama, equipo1: args.context.puntuacionCama.equipo1 + 1 }};
      }),

      repartirCartas: assign((args: any) => {
        const { event } = args;
        const jugadores = event.type === 'REPARTIR' && event.jugadores?.length > 0
          ? event.jugadores
          : []; 
          
        const jugadoresOrden = jugadores.length === 4 ? jugadores : ['p1', 'p2', 'p3', 'p4'];
        const manoOriginal = jugadoresOrden[Math.floor(Math.random() * 4)];

        const shuffled = [...VALENCIA_DECK].sort(() => Math.random() - 0.5);
        const cartasJugadores: Record<string, Card[]> = {};
        jugadoresOrden.forEach((id: string, i: number) => {
          cartasJugadores[id] = shuffled.slice(i * 3, (i + 1) * 3);
        });

        return {
          manoActual: 1,
          bazasGanadas: { equipo1: 0, equipo2: 0 },
          estadoEnvido: 0,
          cartasJugadores,
          jugadoresOrden,
          manoOriginal,
          turnoActual: manoOriginal,
          cartasEnMesa: [],
        } as Partial<TrucContext>;
      }),

      jugarCarta: assign((args: any) => {
        const { context, event } = args;
        if (event.type !== 'JUGAR_CARTA') return context;

        const mano = context.cartasJugadores[event.jugadorId].filter(
          (c: Card) => !(c.suit === event.carta.suit && c.value === event.carta.value)
        );

        const nuevasCartasEnMesa = [...context.cartasEnMesa, { jugadorId: event.jugadorId, carta: event.carta }];

        // Calcular turno
        const currIdx = context.jugadoresOrden.indexOf(event.jugadorId);
        const nextIdx = (currIdx + 1) % context.jugadoresOrden.length;
        const siguienteTurno = context.jugadoresOrden[nextIdx];

        return {
          cartasJugadores: { ...context.cartasJugadores, [event.jugadorId]: mano },
          cartasEnMesa: nuevasCartasEnMesa,
          turnoActual: siguienteTurno
        };
      }),

      evaluarGanadorBaza: assign((args: any) => {
        const { context } = args;
        const mesa = context.cartasEnMesa;
        if (mesa.length === 0) return context;

        let bestPlay = mesa[0];
        let bestPower = getCardPower(mesa[0].carta);

        for (let i = 1; i < mesa.length; i++) {
          const p = getCardPower(mesa[i].carta);
          if (p > bestPower) {
            bestPlay = mesa[i];
            bestPower = p;
          }
        }

        const ganadorId = bestPlay.jugadorId;
        const currIdx = context.jugadoresOrden.indexOf(ganadorId);
        const esEq1 = currIdx % 2 === 0;

        const nuevasBazas = {
          equipo1: context.bazasGanadas.equipo1 + (esEq1 ? 1 : 0),
          equipo2: context.bazasGanadas.equipo2 + (!esEq1 ? 1 : 0),
        };

        return {
          bazasGanadas: nuevasBazas,
          cartasEnMesa: [], 
          turnoActual: ganadorId,
          manoActual: context.manoActual + 1
        };
      })
    }
  }
);
