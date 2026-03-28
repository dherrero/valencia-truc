import { createMachine, assign } from 'xstate';
import { Card } from '@valencia-truc/shared-interfaces';
import { VALENCIA_DECK, getCardPower } from './shared-game-engine.js';

export interface TrucContext {
  puntuacionCama: { equipo1: number; equipo2: number };
  cartasJugadores: { [jugadorId: string]: Card[] };
  bazasGanadas: { equipo1: number; equipo2: number };
  estadoEnvido: number;
  manoActual: number;
  turnoActual: string;
  manoOriginal: string;
  jugadoresOrden: string[];
  cartasEnMesa: { jugadorId: string; carta: Card; isOculta?: boolean }[];
  
  // Nuevas variables Truc
  historialBazas: ('equipo1' | 'equipo2' | 'empate')[];
  puntosTrucActual: number;
  estadoApuestaTruc: 'ninguno' | 'truc' | 'retruc' | 'vale_quatre' | 'juego_fuera';
  equipoApostadorTruc: 'equipo1' | 'equipo2' | null;
  
  // Variables especiales para la mano de desempate
  desempateCartasSeleccionadas: { jugadorId: string; cartaDescubierta: Card }[];
}

export type TrucEvent =
  | { type: 'REPARTIR'; jugadores: string[] }
  | { type: 'JUGAR_CARTA'; jugadorId: string; carta: Card }
  | { type: 'ELEGIR_CARTA_DESEMPATE'; jugadorId: string; cartaDescubierta: Card }
  | { type: 'CANTAR_TRUC'; jugadorId: string }
  | { type: 'RETRUC'; jugadorId: string }
  | { type: 'VALE_QUATRE'; jugadorId: string }
  | { type: 'JUEGO_FUERA'; jugadorId: string }
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
      cartasEnMesa: [],
      historialBazas: [],
      puntosTrucActual: 1,
      estadoApuestaTruc: 'ninguno',
      equipoApostadorTruc: null,
      desempateCartasSeleccionadas: []
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
            always: [
              { guard: 'bazaEmpatada', target: 'mano_desempate' },
              { target: 'mano_2' }
            ]
          },
          mano_desempate: {
            always: {
              guard: 'todosEligieronDesempate',
              target: 'evaluar_baza_desempate'
            },
            on: {
              ELEGIR_CARTA_DESEMPATE: {
                actions: 'elegirCartaDesempate',
                guard: 'tieneCartaYNoHaElegidoDesempate'
              }
            }
          },
          evaluar_baza_desempate: {
            entry: 'evaluarDesempateMano1',
            always: [
              { guard: 'equipo1GanaRonda', target: 'finalizar_ronda', actions: 'anotarRondaEq1' },
              { guard: 'equipo2GanaRonda', target: 'finalizar_ronda', actions: 'anotarRondaEq2' },
              { target: 'finalizar_ronda', actions: 'anotarRondaManoOriginal' }
            ]
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
              { target: 'finalizar_ronda', actions: 'anotarRondaManoOriginal' }
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
                guard: 'isManoValida_Envido'
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
              CANTAR_TRUC: { target: 'truc_cantado', actions: 'registrarCantadaTruc' }
            }
          },
          truc_cantado: {
            on: {
              QUIERO: { target: 'retruc_disponible', actions: 'aceptarTruc' },
              NO_QUIERO: { target: 'finalizar_juego_por_rechazo', actions: 'rechazarTruc' },
              RETRUC: { target: 'retruc_cantado', actions: 'registrarCantadaRetruc', guard: 'esEquipoContrario' }
            }
          },
          retruc_disponible: {
            on: {
              RETRUC: { target: 'retruc_cantado', actions: 'registrarCantadaRetruc', guard: 'esEquipoContrario' }
            }
          },
          retruc_cantado: {
            on: {
              QUIERO: { target: 'vale_quatre_disponible', actions: 'aceptarRetruc' },
              NO_QUIERO: { target: 'finalizar_juego_por_rechazo', actions: 'rechazarTruc' },
              VALE_QUATRE: { target: 'vale_quatre_cantado', actions: 'registrarCantadaValeQuatre', guard: 'esEquipoContrario' }
            }
          },
          vale_quatre_disponible: {
            on: {
              VALE_QUATRE: { target: 'vale_quatre_cantado', actions: 'registrarCantadaValeQuatre', guard: 'esEquipoContrario' }
            }
          },
          vale_quatre_cantado: {
            on: {
              QUIERO: { target: 'juego_fuera_disponible', actions: 'aceptarValeQuatre' },
              NO_QUIERO: { target: 'finalizar_juego_por_rechazo', actions: 'rechazarTruc' },
              JUEGO_FUERA: { target: 'juego_fuera_cantado', actions: 'registrarCantadaJuegoFuera', guard: 'esEquipoContrario' }
            }
          },
          juego_fuera_disponible: {
            on: {
              JUEGO_FUERA: { target: 'juego_fuera_cantado', actions: 'registrarCantadaJuegoFuera', guard: 'esEquipoContrario' }
            }
          },
          juego_fuera_cantado: {
            on: {
              QUIERO: { target: 'esperando_fin_juego', actions: 'aceptarJuegoFuera' },
              NO_QUIERO: { target: 'finalizar_juego_por_rechazo', actions: 'rechazarTruc' }
            }
          },
          esperando_fin_juego: {
            type: 'final'
          },
          finalizar_juego_por_rechazo: {
            type: 'final',
            entry: 'abortarRondaPorRechazo'
          }
        }
      }
    }
  },
  {
    guards: {
      isManoValida_Envido: (args: any) => args.context.manoActual === 1,
      mesaLlena: (args: any) => args.context.cartasEnMesa.length === args.context.jugadoresOrden.length,
      bazaEmpatada: (args: any) => {
        const h = args.context.historialBazas;
        return h.length > 0 && h[h.length - 1] === 'empate';
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
      todosEligieronDesempate: (args: any) => args.context.desempateCartasSeleccionadas.length === args.context.jugadoresOrden.length,
      tieneCartaYNoHaElegidoDesempate: (args: any) => {
        const { context, event } = args;
        if (event.type !== 'ELEGIR_CARTA_DESEMPATE') return false;
        const jIdx = context.desempateCartasSeleccionadas.findIndex((s: any) => s.jugadorId === event.jugadorId);
        if (jIdx !== -1) return false;
        const tieneCarta = context.cartasJugadores[event.jugadorId]?.some(
          (c: Card) => c.suit === event.cartaDescubierta.suit && c.value === event.cartaDescubierta.value
        );
        return tieneCarta;
      },
      esEquipoContrario: (args: any) => {
        const { context, event } = args;
        if (!context.equipoApostadorTruc || !('jugadorId' in event)) return true;
        const jIdx = context.jugadoresOrden.indexOf(event.jugadorId);
        if (jIdx === -1) return false;
        const eqTurno = jIdx % 2 === 0 ? 'equipo1' : 'equipo2';
        return eqTurno !== context.equipoApostadorTruc;
      },
      
      equipo1GanaRonda: (args: any) => {
        const h = args.context.historialBazas;
        const e1 = h.filter((b: string) => b === 'equipo1').length;
        if (e1 >= 2) return true;
        if (h[0] === 'equipo1' && h[1] === 'empate') return true;
        if (h[0] === 'equipo1' && h[1] === 'equipo2' && h[2] === 'empate') return true;
        if (h[0] === 'empate' && h[1] === 'equipo1') return true;
        if (h[0] === 'empate' && h[1] === 'empate') {
          return args.context.jugadoresOrden.indexOf(args.context.manoOriginal) % 2 === 0;
        }
        return false;
      },
      equipo2GanaRonda: (args: any) => {
        const h = args.context.historialBazas;
        const e2 = h.filter((b: string) => b === 'equipo2').length;
        if (e2 >= 2) return true;
        if (h[0] === 'equipo2' && h[1] === 'empate') return true;
        if (h[0] === 'equipo2' && h[1] === 'equipo1' && h[2] === 'empate') return true;
        if (h[0] === 'empate' && h[1] === 'equipo2') return true;
        if (h[0] === 'empate' && h[1] === 'empate') {
          return args.context.jugadoresOrden.indexOf(args.context.manoOriginal) % 2 !== 0;
        }
        return false;
      }
    },
    actions: {
      resolverEnvido: () => console.log('Resolviendo puntos para Envido...'),
      rechazarEnvido: () => console.log('Envido rechazado (se sumará 1 punto a Cama)'),
      
      registrarCantadaTruc: assign((args: any) => {
        const { context, event } = args;
        const jIdx = context.jugadoresOrden.indexOf(event.jugadorId);
        const eq = jIdx % 2 === 0 ? 'equipo1' : 'equipo2';
        return { equipoApostadorTruc: eq };
      }),
      aceptarTruc: assign({ puntosTrucActual: 2, estadoApuestaTruc: 'truc', equipoApostadorTruc: null }),
      
      registrarCantadaRetruc: assign((args: any) => {
        const { context, event } = args;
        const jIdx = context.jugadoresOrden.indexOf(event.jugadorId);
        return { equipoApostadorTruc: jIdx % 2 === 0 ? 'equipo1' : 'equipo2' };
      }),
      aceptarRetruc: assign({ puntosTrucActual: 3, estadoApuestaTruc: 'retruc', equipoApostadorTruc: null }),
      
      registrarCantadaValeQuatre: assign((args: any) => {
        const { context, event } = args;
        const jIdx = context.jugadoresOrden.indexOf(event.jugadorId);
        return { equipoApostadorTruc: jIdx % 2 === 0 ? 'equipo1' : 'equipo2' };
      }),
      aceptarValeQuatre: assign({ puntosTrucActual: 4, estadoApuestaTruc: 'vale_quatre', equipoApostadorTruc: null }),

      registrarCantadaJuegoFuera: assign((args: any) => {
        const { context, event } = args;
        const jIdx = context.jugadoresOrden.indexOf(event.jugadorId);
        return { equipoApostadorTruc: jIdx % 2 === 0 ? 'equipo1' : 'equipo2' };
      }),
      aceptarJuegoFuera: assign({ puntosTrucActual: 24, estadoApuestaTruc: 'juego_fuera', equipoApostadorTruc: null }),

      rechazarTruc: assign((args: any) => {
        const { context } = args;
        const ganador = context.equipoApostadorTruc; 
        if (!ganador) return {};
        
        let e1 = context.puntuacionCama.equipo1;
        let e2 = context.puntuacionCama.equipo2;
        if (ganador === 'equipo1') e1 += context.puntosTrucActual;
        if (ganador === 'equipo2') e2 += context.puntosTrucActual;
        
        return {
          puntuacionCama: { equipo1: e1, equipo2: e2 }
        };
      }),

      abortarRondaPorRechazo: () => {
        console.log('Ronda finalizada porque se rechazó una apuesta de Truc.');
      },

      anotarRondaEq1: assign((args: any) => {
        return { puntuacionCama: { ...args.context.puntuacionCama, equipo1: args.context.puntuacionCama.equipo1 + args.context.puntosTrucActual }};
      }),
      anotarRondaEq2: assign((args: any) => {
        return { puntuacionCama: { ...args.context.puntuacionCama, equipo2: args.context.puntuacionCama.equipo2 + args.context.puntosTrucActual }};
      }),
      anotarRondaManoOriginal: assign((args: any) => {
        const esEq1 = args.context.jugadoresOrden.indexOf(args.context.manoOriginal) % 2 === 0;
        return { 
          puntuacionCama: { 
            equipo1: args.context.puntuacionCama.equipo1 + (esEq1 ? args.context.puntosTrucActual : 0),
            equipo2: args.context.puntuacionCama.equipo2 + (!esEq1 ? args.context.puntosTrucActual : 0)
          }
        };
      }),

      repartirCartas: assign((args: any) => {
        const { event } = args;
        const jugadores = event.type === 'REPARTIR' && event.jugadores?.length > 0
          ? event.jugadores
          : []; 
          
        const jugadoresOrden = jugadores.length === 4 ? jugadores : ['p1', 'p2', 'p3', 'p4'];
        
        // Mantener manoOriginal globalmente
        let manoOriginal = args.context.manoOriginal;
        if (manoOriginal && jugadoresOrden.includes(manoOriginal)) {
            const nextIdx = (jugadoresOrden.indexOf(manoOriginal) + 1) % jugadoresOrden.length;
            manoOriginal = jugadoresOrden[nextIdx];
        } else {
            manoOriginal = jugadoresOrden[Math.floor(Math.random() * 4)];
        }

        const shuffled = [...VALENCIA_DECK].sort(() => Math.random() - 0.5);
        const cartasJugadores: Record<string, Card[]> = {};
        jugadoresOrden.forEach((id: string, i: number) => {
          cartasJugadores[id] = shuffled.slice(i * 3, (i + 1) * 3);
        });

        return {
          manoActual: 1,
          bazasGanadas: { equipo1: 0, equipo2: 0 },
          historialBazas: [],
          estadoEnvido: 0,
          puntosTrucActual: 1,
          estadoApuestaTruc: 'ninguno',
          equipoApostadorTruc: null,
          desempateCartasSeleccionadas: [],
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

        const nuevasCartasEnMesa = [...context.cartasEnMesa, { jugadorId: event.jugadorId, carta: event.carta, isOculta: false }];

        const currIdx = context.jugadoresOrden.indexOf(event.jugadorId);
        const nextIdx = (currIdx + 1) % context.jugadoresOrden.length;
        const siguienteTurno = context.jugadoresOrden[nextIdx];

        return {
          cartasJugadores: { ...context.cartasJugadores, [event.jugadorId]: mano },
          cartasEnMesa: nuevasCartasEnMesa,
          turnoActual: siguienteTurno
        };
      }),

      elegirCartaDesempate: assign((args: any) => {
        const { context, event } = args;
        if (event.type !== 'ELEGIR_CARTA_DESEMPATE') return context;
        
        return {
            desempateCartasSeleccionadas: [...context.desempateCartasSeleccionadas, {
                jugadorId: event.jugadorId,
                cartaDescubierta: event.cartaDescubierta
            }]
        };
      }),

      evaluarDesempateMano1: assign((args: any) => {
        const { context } = args;
        
        let maxAbierta = -1;
        let mejoresJugadas: any[] = [];
        
        const jugadasMesa = context.desempateCartasSeleccionadas.map((s: any) => {
            const manoOriginal = context.cartasJugadores[s.jugadorId];
            const oculta = manoOriginal.find((c: Card) => !(c.suit === s.cartaDescubierta.suit && c.value === s.cartaDescubierta.value));
            return {
                jugadorId: s.jugadorId,
                cartaDescubierta: s.cartaDescubierta,
                cartaOculta: oculta as Card
            };
        });

        jugadasMesa.forEach((j: any) => {
            const p = getCardPower(j.cartaDescubierta);
            if (p > maxAbierta) {
                maxAbierta = p;
                mejoresJugadas = [j];
            } else if (p === maxAbierta) {
                mejoresJugadas.push(j);
            }
        });

        const equiposEmpatadosAbierta = new Set(
          mejoresJugadas.map((j: any) => context.jugadoresOrden.indexOf(j.jugadorId) % 2 === 0 ? 'equipo1' : 'equipo2')
        );

        let ganadorBaza: 'equipo1' | 'equipo2' | 'empate' = 'empate';
        
        if (equiposEmpatadosAbierta.size === 1) {
            ganadorBaza = [...equiposEmpatadosAbierta][0] as 'equipo1' | 'equipo2';
        } else {
            let maxOculta = -1;
            let finalistasOcultos: any[] = [];
            
            mejoresJugadas.forEach((j: any) => {
                let pOculta = getCardPower(j.cartaOculta);
                const pAbierta = getCardPower(j.cartaDescubierta);
                if (pOculta >= pAbierta) pOculta = 0;
                
                if (pOculta > maxOculta) {
                    maxOculta = pOculta;
                    finalistasOcultos = [j];
                } else if (pOculta === maxOculta) {
                    finalistasOcultos.push(j);
                }
            });

            const equiposEmpatadosOculta = new Set(
                finalistasOcultos.map((j: any) => context.jugadoresOrden.indexOf(j.jugadorId) % 2 === 0 ? 'equipo1' : 'equipo2')
            );
            
            if (equiposEmpatadosOculta.size === 1) {
                ganadorBaza = [...equiposEmpatadosOculta][0] as 'equipo1' | 'equipo2';
            } else {
                ganadorBaza = 'empate'; 
            }
        }

        const nuevoHistorial = [...context.historialBazas, ganadorBaza];
        const cartasVacias: any = {};
        context.jugadoresOrden.forEach((id: string) => { cartasVacias[id] = []; });

        return {
          historialBazas: nuevoHistorial,
          desempateCartasSeleccionadas: [],
          cartasEnMesa: [], 
          cartasJugadores: cartasVacias,
        };
      }),

      evaluarGanadorBaza: assign((args: any) => {
        const { context } = args;
        const mesa = context.cartasEnMesa;
        if (mesa.length === 0) return context;

        let maxPower = -1;
        let mejoresJugadas: any[] = [];

        mesa.forEach((jugada: any) => {
          const p = getCardPower(jugada.carta);
          if (p > maxPower) {
            maxPower = p;
            mejoresJugadas = [jugada];
          } else if (p === maxPower) {
            mejoresJugadas.push(jugada);
          }
        });

        const equiposEmpatados = new Set(
          mejoresJugadas.map((j: any) => context.jugadoresOrden.indexOf(j.jugadorId) % 2 === 0 ? 'equipo1' : 'equipo2')
        );

        let ganadorBaza: 'equipo1' | 'equipo2' | 'empate' = 'empate';
        let ganadorId = context.turnoActual;

        if (equiposEmpatados.size === 1) {
          ganadorBaza = [...equiposEmpatados][0] as 'equipo1' | 'equipo2';
          ganadorId = mejoresJugadas[0].jugadorId;
        } else {
            ganadorId = context.manoOriginal; 
        }

        const nuevoHistorial = [...context.historialBazas, ganadorBaza];

        return {
          historialBazas: nuevoHistorial,
          cartasEnMesa: [], 
          turnoActual: ganadorId,
          manoActual: context.manoActual + 1
        };
      })
    }
  }
);
