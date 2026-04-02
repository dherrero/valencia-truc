import { createActor } from 'xstate';
import { TrucAction } from '@valencia-truc/shared-interfaces';
import {
  getActiveBetState,
  getAllowedActions,
  trucMachine,
} from './truc-machine.js';

describe('trucMachine', () => {
  const jugadores = ['p1', 'p2', 'p3', 'p4'];

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('ofrece acciones de canto y juego al jugador mano al repartir', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });

    const allowedActions = getAllowedActions(actor.getSnapshot(), 'p1');

    expect(allowedActions).toContain(TrucAction.JUGAR_CARTA);
    expect(allowedActions).toContain(TrucAction.ENVIDO);
    expect(allowedActions).toContain(TrucAction.TRUC);
  });

  it('bloquea jugar carta mientras el truc espera respuesta y ofrece responder al rival', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });
    actor.send({ type: 'CANTAR_TRUC', jugadorId: 'p1' });

    const accionesP1 = getAllowedActions(actor.getSnapshot(), 'p1');
    const accionesP2 = getAllowedActions(actor.getSnapshot(), 'p2');

    expect(accionesP1).not.toContain(TrucAction.JUGAR_CARTA);
    expect(accionesP2).toEqual(
      expect.arrayContaining([
        TrucAction.QUIERO,
        TrucAction.NO_QUIERO,
        TrucAction.RETRUC,
      ]),
    );
    expect(accionesP2).not.toContain(TrucAction.ENVIDO);
  });

  it('suma dos piedras al equipo que canta retruc si el rival no quiere', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });
    actor.send({ type: 'CANTAR_TRUC', jugadorId: 'p1' });
    actor.send({ type: 'RETRUC', jugadorId: 'p2' });
    actor.send({ type: 'NO_QUIERO', jugadorId: 'p1' });

    const snapshot = actor.getSnapshot();

    expect(snapshot.context.puntuacionCama).toEqual({ equipo1: 0, equipo2: 2 });
    expect(snapshot.matches({ ronda: 'finalizar_ronda' })).toBe(true);
  });

  it('permite tornar-cho como respuesta al envido inicial', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });
    actor.send({ type: 'CANTAR_ENVIDO', jugadorId: 'p1' });

    const accionesP2 = getAllowedActions(actor.getSnapshot(), 'p2');

    expect(accionesP2).toEqual(
      expect.arrayContaining([
        TrucAction.QUIERO,
        TrucAction.NO_QUIERO,
        TrucAction.TORNA_CHO,
      ]),
    );
  });

  it('acumula un historial visible de acciones relevantes', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });
    actor.send({ type: 'CANTAR_TRUC', jugadorId: 'p1' });

    expect((actor.getSnapshot().context as any).historialAcciones).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'REPARTIR' }),
        expect.objectContaining({ type: 'TRUC', jugadorId: 'p1' }),
      ]),
    );
  });

  it('expone la apuesta activa del truc mientras espera respuesta', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });
    actor.send({ type: 'CANTAR_TRUC', jugadorId: 'p1' });

    expect(getActiveBetState(actor.getSnapshot())).toEqual(
      expect.objectContaining({
        family: 'truc',
        label: 'Truc',
        points: 2,
        waitingResponse: true,
      }),
    );
  });

  it('no suma el envido al marcador hasta cerrar la ronda', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });
    actor.send({ type: 'CANTAR_ENVIDO', jugadorId: 'p1' });
    actor.send({ type: 'QUIERO', jugadorId: 'p2' });

    expect(actor.getSnapshot().context.puntuacionCama).toEqual({
      equipo1: 0,
      equipo2: 0,
    });
  });

  it('genera un resumen de ronda al terminar y ya entonces actualiza el marcador', () => {
    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });
    actor.send({ type: 'CANTAR_TRUC', jugadorId: 'p1' });
    actor.send({ type: 'NO_QUIERO', jugadorId: 'p2' });

    const snapshot = actor.getSnapshot();

    expect(snapshot.context.puntuacionCama).toEqual({ equipo1: 1, equipo2: 0 });
    expect(snapshot.context.resumenRonda).toEqual(
      expect.objectContaining({
        awarded: { equipo1: 1, equipo2: 0 },
        scoreAfter: { equipo1: 1, equipo2: 0 },
        reasons: [
          expect.objectContaining({
            team: 'equipo1',
            points: 1,
            reason: 'truc no volgut',
          }),
        ],
      }),
    );
  });

  it('ofrece una acción de desempate tras empatar la primera baza', () => {
    jest.useFakeTimers();

    const actor = createActor(trucMachine);
    actor.start();
    actor.send({ type: 'REPARTIR', jugadores });

    const context = actor.getSnapshot().context;
    context.turnoActual = 'p1';
    context.manoOriginal = 'p1';
    context.manoActual = 1;
    context.cartasJugadores = {
      p1: [
        { suit: 'Espadas', value: 4 },
        { suit: 'Espadas', value: 5 },
        { suit: 'Espadas', value: 6 },
      ],
      p2: [
        { suit: 'Bastos', value: 4 },
        { suit: 'Bastos', value: 5 },
        { suit: 'Bastos', value: 6 },
      ],
      p3: [
        { suit: 'Oros', value: 4 },
        { suit: 'Oros', value: 5 },
        { suit: 'Oros', value: 6 },
      ],
      p4: [
        { suit: 'Copas', value: 4 },
        { suit: 'Copas', value: 5 },
        { suit: 'Copas', value: 6 },
      ],
    };

    actor.send({
      type: 'JUGAR_CARTA',
      jugadorId: 'p1',
      carta: { suit: 'Espadas', value: 4 },
    });
    actor.send({
      type: 'JUGAR_CARTA',
      jugadorId: 'p2',
      carta: { suit: 'Bastos', value: 4 },
    });
    actor.send({
      type: 'JUGAR_CARTA',
      jugadorId: 'p3',
      carta: { suit: 'Oros', value: 4 },
    });
    actor.send({
      type: 'JUGAR_CARTA',
      jugadorId: 'p4',
      carta: { suit: 'Copas', value: 4 },
    });

    jest.advanceTimersByTime(1500);

    const snapshot = actor.getSnapshot();
    const accionesP1 = getAllowedActions(snapshot, 'p1');

    expect(snapshot.matches({ ronda: 'mano_desempate' })).toBe(true);
    expect(accionesP1).toContain(
      'ELEGIR_CARTA_DESEMPATE' as unknown as TrucAction,
    );
  });
});
