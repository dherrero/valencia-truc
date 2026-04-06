import { randomUUID } from 'crypto';
import { createActor } from 'xstate';
import {
  trucMachine,
  TrucContext,
  TrucEvent,
} from '@valencia-truc/shared-game-engine';
import {
  GameOverState,
  RoomDestroyedState,
  RoomNoticeState,
} from '@valencia-truc/shared-interfaces';
import type { GameServer } from './socket-types';
import type { Room } from './room-types';
import { getRoomSummary } from './room-utils';
import { emitInitialState, emitStateToSockets } from './room-state';
import { TrucBot } from './bot';

export interface RoomManager {
  rooms: Map<string, Room>;
  createRoom: (name: string, botCount: number) => Room;
  destroyRoom: (uid: string, payload?: Partial<RoomDestroyedState>) => void;
  broadcastRoomsList: () => void;
  listRooms: () => ReturnType<typeof getRoomSummary>[];
  emitRoomNotice: (uid: string, notice: RoomNoticeState) => void;
  emitInitialState: (
    socket: Parameters<typeof emitInitialState>[0],
    playerId: string,
    room: Room,
  ) => void;
}

function getRondaState(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;

  const ronda = (value as { ronda?: unknown }).ronda;
  return typeof ronda === 'string' ? ronda : undefined;
}

export function createRoomManager(io: GameServer): RoomManager {
  const rooms = new Map<string, Room>();

  function clearDisconnectTimers(room: Room) {
    room.disconnectTimers.forEach((timer) => clearTimeout(timer));
    room.disconnectTimers.clear();
    room.disconnectedPlayerIds.clear();
  }

  function broadcastRoomsList() {
    io.emit('rooms:list', Array.from(rooms.values()).map(getRoomSummary));
  }

  function emitRoomNotice(uid: string, notice: RoomNoticeState) {
    io.in(uid).emit('room:notice', notice);
  }

  function destroyRoom(uid: string, payload: Partial<RoomDestroyedState> = {}) {
    const room = rooms.get(uid);
    if (!room) return;

    room.bots.forEach((bot) => bot.stop());

    if (room.emitDebounce) clearTimeout(room.emitDebounce);
    if (room.autoDealTimeout) clearTimeout(room.autoDealTimeout);
    clearDisconnectTimers(room);

    room.actorSubscription.unsubscribe();
    room.actor.stop();

    io.in(uid).emit('room:destroyed', {
      reason: payload.reason ?? 'manual',
      message: payload.message ?? `La sala "${room.name}" ha finalizado.`,
    });
    io.in(uid).socketsLeave(uid);
    rooms.delete(uid);
    broadcastRoomsList();
  }

  function createRoom(name: string, botCount: number) {
    const uid = randomUUID();
    const actor = createActor(trucMachine);
    actor.start();

    const room: Room = {
      uid,
      name,
      actor,
      actorSubscription: { unsubscribe: () => undefined },
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

    rooms.set(uid, room);

    room.actorSubscription = actor.subscribe((state) => {
      emitStateToSockets(io, uid, room);

      const rondaState = getRondaState(state.value);

      if (rondaState === 'game_over') {
        const ctx = state.context as TrucContext;
        const ganador =
          ctx.puntuacionCama.equipo1 >= 24 ? 'equipo1' : 'equipo2';
        const gameOverData: GameOverState = {
          ganador,
          score: ctx.puntuacionCama,
          summary: ctx.resumenRonda ?? undefined,
        };
        console.log(`[GAME OVER] Room ${uid} — ${ganador} wins!`);
        io.in(uid).emit('game:over', gameOverData);
        return;
      }

      if (rondaState === 'finalizar_ronda' && !room.autoDealTimeout) {
        room.autoDealTimeout = setTimeout(() => {
          room.autoDealTimeout = null;
          const currentRoom = rooms.get(uid);
          if (!currentRoom) return;

          const currentRonda = getRondaState(
            currentRoom.actor.getSnapshot().value,
          );
          if (currentRonda === 'game_over') return;

          const allPlayers = [...currentRoom.playerIds, ...currentRoom.botIds];
          console.log(
            `[AUTO-REPARTIR] Room ${uid} — starting new round with players: ${allPlayers.join(', ')}`,
          );
          currentRoom.actor.send({
            type: 'REPARTIR',
            jugadores: allPlayers,
          } as unknown as TrucEvent);
        }, 2000);
      }
    });

    const clampedBots = Math.min(botCount, 3);
    for (let i = 1; i <= clampedBots; i++) {
      const botId = `bot-${uid.slice(0, 8)}-${i}`;
      const bot = new TrucBot(actor, botId, () => [...room.playerIds]);
      room.bots.push(bot);
      room.botIds.push(botId);
      room.botCount++;
      room.playerNames[botId] = `Bot ${i}`;
    }

    return room;
  }

  return {
    rooms,
    createRoom,
    destroyRoom,
    broadcastRoomsList,
    listRooms: () => Array.from(rooms.values()).map(getRoomSummary),
    emitRoomNotice,
    emitInitialState: (
      socket: Parameters<typeof emitInitialState>[0],
      playerId: string,
      room: Room,
    ) => emitInitialState(socket, playerId, room),
  };
}
