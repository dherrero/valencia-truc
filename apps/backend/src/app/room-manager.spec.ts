import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@valencia-truc/shared-interfaces';
import { createRoomManager } from './room-manager';
import type { GameSocketData } from './socket-types';
import type { Room } from './room-types';

describe('room manager cleanup', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('clears all abandonment timers when a room is destroyed', () => {
    const io = createIoMock();
    const manager = createRoomManager(io);
    const room = createRoom();

    manager.rooms.set(room.uid, room);

    const timer = setTimeout(() => undefined, 1000);
    room.disconnectTimers.set('player-1', timer);
    room.disconnectedPlayerIds.add('player-1');

    manager.destroyRoom(room.uid, {
      reason: 'abandonment',
      message: 'Partida cerrada por abandono.',
    });

    expect(room.disconnectTimers.size).toBe(0);
    expect(room.disconnectedPlayerIds.size).toBe(0);
    expect(manager.rooms.has(room.uid)).toBe(false);
    expect(io.in(room.uid).emit).toHaveBeenCalledWith('room:destroyed', {
      reason: 'abandonment',
      message: 'Partida cerrada por abandono.',
    });
  });
});

function createRoom(): Room {
  return {
    uid: 'room-cleanup',
    name: 'Sala cleanup',
    actor: {
      stop: () => undefined,
      getSnapshot: () => ({
        value: { ronda: 'inicio' },
        context: {},
        matches: () => false,
      }),
      send: () => undefined,
      subscribe: () => ({ unsubscribe: () => undefined }),
    } as unknown as Room['actor'],
    actorSubscription: { unsubscribe: jest.fn() },
    playerIds: [],
    playerNames: {},
    botIds: [],
    bots: [],
    botCount: 0,
    status: 'waiting',
    emitDebounce: null,
    autoDealTimeout: null,
    disconnectTimers: new Map(),
    disconnectedPlayerIds: new Set(),
  };
}

function createIoMock() {
  const emit = jest.fn();
  return {
    emit,
    in: () => ({
      emit,
      socketsLeave: jest.fn(),
      fetchSockets: jest.fn(() => Promise.resolve([])),
    }),
  } as unknown as Server<
    ClientToServerEvents,
    ServerToClientEvents,
    never,
    GameSocketData
  >;
}
