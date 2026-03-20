import { createMachine, assign } from 'xstate';
import { Card } from '@valencia-truc/shared-interfaces';

export interface TrucContext {
  puntuacionCama: { equipo1: number; equipo2: number };
  cartasJugadores: { [jugadorId: string]: Card[] };
  bazasGanadas: { equipo1: number; equipo2: number };
  estadoEnvido: number;
  manoActual: number;
}

export type TrucEvent =
  | { type: 'REPARTIR' }
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
    },
    states: {
      ronda: {
        initial: 'inicio',
        states: {
          inicio: {
            on: {
              REPARTIR: {
                target: 'repartir',
                actions: 'repartirCartas'
              }
            }
          },
          repartir: {
            always: 'mano_1'
          },
          mano_1: {
            on: {
              FINALIZAR_MANO: 'mano_2'
            }
          },
          mano_2: {
            on: {
              FINALIZAR_MANO: 'mano_3'
            }
          },
          mano_3: {
            on: {
              FINALIZAR_MANO: 'finalizar_ronda'
            }
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
              QUIERO: 'truc_disponible', // State resolves and Truc points increase
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
      isManoValida: (contextOrObj: unknown) => {
        // Handle both XState v4 and v5 context passing gracefully automatically!
        const context = (contextOrObj as { context?: TrucContext }).context || (contextOrObj as TrucContext);
        return context.manoActual === 1;
      }
    },
    actions: {
      resolverEnvido: () => {
        console.log('Resolviendo puntos para Envido...');
      },
      rechazarEnvido: () => {
        console.log('Envido rechazado (se sumará 1 punto a Cama)');
      },
      // Handling TS correctly
      repartirCartas: assign({
        manoActual: 1
      } as Partial<TrucContext>)
    }
  }
);
