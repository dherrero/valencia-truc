import { getAllowedActions } from '@valencia-truc/shared-game-engine';
import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TrucAction,
} from '@valencia-truc/shared-interfaces';
import {
  actionToEvent,
  getRoomSummary,
  normalizePlayerName,
} from './room-utils';
import type { GameSocketData, TrucSocket } from './socket-types';
import type { RoomManager } from './room-manager';

function getDisconnectGracePeriodMs() {
  const parsed = Number(process.env.ROOM_DISCONNECT_GRACE_PERIOD_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 60 * 1000;
}

const DISCONNECT_GRACE_PERIOD_MS = getDisconnectGracePeriodMs();

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, never, GameSocketData>,
  roomManager: RoomManager,
) {
  io.on('connection', (socket: TrucSocket) => {
    console.log('Client connected:', socket.id);

    socket.emit('rooms:list', roomManager.listRooms());

    socket.on(
      'room:create',
      ({ name, bots = 0, playerId, playerName }, callback) => {
        const roomName = name?.trim() || `Sala ${roomManager.rooms.size + 1}`;
        const botCount = Math.max(0, Math.min(3, bots));
        const displayName = normalizePlayerName(playerName, 'Jugador 1');

        const room = roomManager.createRoom(roomName, botCount);
        room.playerIds.push(playerId);
        room.playerNames[playerId] = displayName;

        socket.data.playerId = playerId;
        socket.data.roomUid = room.uid;
        socket.join(room.uid);

        callback({ status: 'ok', room: getRoomSummary(room) });
        roomManager.broadcastRoomsList();
        roomManager.emitInitialState(socket, playerId, room);
      },
    );

    socket.on('room:join', ({ uid, playerId, playerName }, callback) => {
      const room = roomManager.rooms.get(uid);

      if (!room) {
        callback({ status: 'error', message: 'La sala no existe.' });
        return;
      }

      const isRejoining = room.playerIds.includes(playerId);
      const displayName = normalizePlayerName(playerName, 'Jugador');

      if (!isRejoining) {
        const totalOccupied = room.playerIds.length + room.botCount;
        if (totalOccupied >= 4) {
          callback({ status: 'error', message: 'La sala está completa.' });
          return;
        }
        room.playerIds.push(playerId);
      }

      room.playerNames[playerId] = displayName;

      const pendingDisconnect = room.disconnectTimers.get(playerId);
      if (pendingDisconnect) {
        clearTimeout(pendingDisconnect);
        room.disconnectTimers.delete(playerId);
        room.disconnectedPlayerIds.delete(playerId);
        roomManager.emitRoomNotice(uid, {
          kind: 'player-reconnected',
          playerName: displayName,
        });
      }

      socket.data.playerId = playerId;
      socket.data.roomUid = uid;
      socket.join(uid);

      callback({ status: 'ok', room: getRoomSummary(room) });
      roomManager.broadcastRoomsList();
      roomManager.emitInitialState(socket, playerId, room);
    });

    socket.on('game:action', (action, callback) => {
      const uid = socket.data.roomUid;
      const playerId = socket.data.playerId;
      const room = uid ? roomManager.rooms.get(uid) : undefined;

      if (!room) {
        callback({ status: 'error', message: 'No estás en ninguna sala.' });
        return;
      }

      const snapshot = room.actor.getSnapshot();
      const allowedActions = getAllowedActions(snapshot, playerId ?? '');
      const requestedAction = action.type as TrucAction;

      if (!allowedActions.includes(requestedAction)) {
        callback({
          status: 'error',
          message: 'Aquesta acció no està permesa ara mateix.',
        });
        return;
      }

      const eventType = actionToEvent[action.type] || action.type;

      if (eventType === 'REPARTIR') {
        room.actor.send({
          type: 'REPARTIR',
          jugadores: [...room.playerIds, ...room.botIds],
        });
      } else if (eventType === 'ELEGIR_CARTA_DESEMPATE') {
        room.actor.send({
          type: 'ELEGIR_CARTA_DESEMPATE',
          jugadorId: playerId,
          cartaDescubierta: action.payload,
        });
      } else {
        room.actor.send({
          type: eventType,
          jugadorId: playerId,
          carta: action.payload,
        });
      }

      if (room.status === 'waiting') {
        room.status = 'playing';
        roomManager.broadcastRoomsList();
      }

      callback({ status: 'ok' });
    });

    socket.on('room:destroy', (callback) => {
      const uid = socket.data.roomUid;

      if (!uid || !roomManager.rooms.has(uid)) {
        callback({ status: 'error', message: 'No existe la sala.' });
        return;
      }

      roomManager.destroyRoom(uid);
      callback({ status: 'ok' });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const uid = socket.data.roomUid;
      if (!uid) return;

      const room = roomManager.rooms.get(uid);
      if (!room) return;

      const playerId = socket.data.playerId;
      if (!playerId) return;

      if (room.disconnectedPlayerIds.has(playerId)) {
        return;
      }

      if (room.disconnectedPlayerIds.size > 0) {
        const playerName = room.playerNames[playerId] ?? 'Jugador';
        roomManager.destroyRoom(uid, {
          reason: 'abandonment',
          message: `El usuario ${playerName} ha abandonado la sala. La partida concluye y todos vuelven al inicio.`,
        });
        return;
      }

      room.disconnectedPlayerIds.add(playerId);
      roomManager.emitRoomNotice(uid, {
        kind: 'player-disconnected',
        playerName: room.playerNames[playerId] ?? 'Jugador',
        gracePeriodMs: DISCONNECT_GRACE_PERIOD_MS,
      });

      const timeout = setTimeout(() => {
        room.disconnectTimers.delete(playerId);
        room.disconnectedPlayerIds.delete(playerId);

        if (!roomManager.rooms.has(uid)) {
          return;
        }

        const currentRoom = roomManager.rooms.get(uid);
        if (!currentRoom) return;

        roomManager.destroyRoom(uid, {
          reason: 'abandonment',
          message: `El usuario ${room.playerNames[playerId] ?? 'Jugador'} no ha vuelto a tiempo. La partida concluye y todos vuelven al inicio.`,
        });
      }, DISCONNECT_GRACE_PERIOD_MS);

      room.disconnectTimers.set(playerId, timeout);
    });
  });
}
