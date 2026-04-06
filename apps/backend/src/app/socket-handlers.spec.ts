import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomSummary,
} from '@valencia-truc/shared-interfaces';
import { registerSocketHandlers } from './socket-handlers';
import type { RoomManager } from './room-manager';
import type { Room } from './room-types';
import type { GameSocketData, TrucSocket } from './socket-types';

describe('socket abandonment flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('gives a grace period when a player disconnects', () => {
    const { roomManager, socket, triggerConnection, room } = buildHarness();

    triggerConnection(socket);
    (socket.handlers.get('disconnect') as (() => void) | undefined)?.();

    expect(room.disconnectedPlayerIds.has('player-1')).toBe(true);
    expect(roomManager.emitRoomNotice).toHaveBeenCalledWith('room-1', {
      kind: 'player-disconnected',
      playerName: 'Ana',
      gracePeriodMs: 300000,
    });
    expect(roomManager.destroyRoom).not.toHaveBeenCalled();
  });

  it('ends the room if another player disconnects while grace is active', () => {
    const { roomManager, socket, triggerConnection, room } = buildHarness();

    room.disconnectedPlayerIds.add('player-1');
    room.disconnectTimers.set(
      'player-1',
      setTimeout(() => undefined, 300000),
    );

    triggerConnection(socket);
    (socket.handlers.get('disconnect') as (() => void) | undefined)?.();

    expect(roomManager.destroyRoom).toHaveBeenCalledWith('room-1', {
      reason: 'abandonment',
      message:
        'El usuario Bob ha abandonado la sala. La partida concluye y todos vuelven al inicio.',
    });
    expect(roomManager.emitRoomNotice).not.toHaveBeenCalledWith(
      'room-1',
      expect.objectContaining({ kind: 'player-disconnected' }),
    );
  });

  it('restores the seat when the same player rejoins before timeout', () => {
    const { roomManager, socket, triggerConnection, room } = buildHarness();

    const pending = setTimeout(() => undefined, 300000);
    room.disconnectedPlayerIds.add('player-1');
    room.disconnectTimers.set('player-1', pending);

    triggerConnection(socket);

    const joinHandler = socket.handlers.get('room:join');
    const callback = jest.fn();

    (
      joinHandler as
        | ((
            payload: { uid: string; playerId: string; playerName: string },
            callback: (res: {
              status: 'ok' | 'error';
              room?: RoomSummary;
            }) => void,
          ) => void)
        | undefined
    )?.({ uid: room.uid, playerId: 'player-1', playerName: 'Ana' }, callback);

    expect(room.disconnectedPlayerIds.has('player-1')).toBe(false);
    expect(room.disconnectTimers.has('player-1')).toBe(false);
    expect(roomManager.emitRoomNotice).toHaveBeenCalledWith('room-1', {
      kind: 'player-reconnected',
      playerName: 'Ana',
    });
    expect(callback).toHaveBeenCalledWith({
      status: 'ok',
      room: expect.objectContaining({ uid: room.uid }),
    });
  });
});

function buildHarness() {
  const room = createRoom();
  const roomManager = createRoomManagerMock(room);
  let connectionHandler: ((socket: TrucSocket) => void) | undefined;

  const io = {
    on: (event: 'connection', handler: (socket: TrucSocket) => void) => {
      if (event === 'connection') {
        connectionHandler = handler;
      }
    },
  } as unknown as Server<
    ClientToServerEvents,
    ServerToClientEvents,
    never,
    GameSocketData
  >;

  registerSocketHandlers(io, roomManager);

  if (!connectionHandler) {
    throw new Error('Missing connection handler');
  }

  const socket = createSocket();

  return {
    room,
    roomManager,
    socket,
    triggerConnection: connectionHandler,
  };
}

function createRoom(): Room {
  const actor = {
    getSnapshot: () => ({
      value: { ronda: 'inicio' },
      context: {},
      matches: () => false,
    }),
    stop: () => undefined,
    send: () => undefined,
    subscribe: () => ({ unsubscribe: () => undefined }),
  } as unknown as Room['actor'];

  return {
    uid: 'room-1',
    name: 'Sala de prueba',
    actor,
    actorSubscription: { unsubscribe: () => undefined },
    playerIds: ['player-1', 'player-2'],
    playerNames: {
      'player-1': 'Ana',
      'player-2': 'Bob',
    },
    botIds: [],
    bots: [],
    botCount: 0,
    status: 'playing',
    emitDebounce: null,
    autoDealTimeout: null,
    disconnectTimers: new Map(),
    disconnectedPlayerIds: new Set(),
  };
}

function createRoomManagerMock(room: Room): RoomManager {
  return {
    rooms: new Map([[room.uid, room]]),
    createRoom: () => room,
    destroyRoom: jest.fn(),
    broadcastRoomsList: jest.fn(),
    listRooms: jest.fn(() => [] as RoomSummary[]),
    emitRoomNotice: jest.fn(),
    emitInitialState: jest.fn(),
  };
}

function createSocket() {
  const handlers = new Map<string, (...args: unknown[]) => void>();

  const socket = {
    data: {
      playerId: 'player-1',
      roomUid: 'room-1',
    },
    emit: jest.fn(),
    join: jest.fn(),
    on: (event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler);
    },
  } as unknown as TrucSocket & {
    handlers: Map<string, (...args: unknown[]) => void>;
  };

  socket.handlers = handlers;

  return socket;
}
