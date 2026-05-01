import type { GameStateUpdate, Card } from '@valencia-truc/shared-interfaces';
import {
  getAllowedActions,
  TrucContext,
} from '@valencia-truc/shared-game-engine';
import type { Room } from './room-types';
import type { TrucSocket } from './socket-types';
import { getGamePhase } from './room-utils';
import { sanitizeGameState } from './sanitize-state';

type SnapshotLike = Parameters<typeof getAllowedActions>[0] & {
  context: TrucContext;
  matches: (state: Record<string, string>) => boolean;
};

function buildStateUpdate(
  snapshot: SnapshotLike,
  playerId: string,
  room: Room,
  allPlayerIds: string[],
): GameStateUpdate {
  const context = snapshot.context;
  const board: Card[] = [];
  const allowedActions = getAllowedActions(snapshot, playerId);
  const phase = getGamePhase(snapshot);

  return sanitizeGameState(
    context,
    playerId,
    allowedActions,
    board,
    allPlayerIds,
    room.playerNames,
    phase,
  );
}

export function emitStateToSockets(
  io: {
    in: (roomUid: string) => {
      fetchSockets: () => Promise<
        Array<{
          data: { playerId?: string };
          emit: (event: 'game:state-update', payload: GameStateUpdate) => void;
        }>
      >;
    };
  },
  roomUid: string,
  room: Room,
) {
  if (room.emitDebounce) {
    clearTimeout(room.emitDebounce);
  }

  room.emitDebounce = setTimeout(() => {
    room.emitDebounce = null;
    const currentRoom = room;
    const snapshot = currentRoom.actor.getSnapshot() as SnapshotLike;
    const allPlayerIds = [...currentRoom.playerIds, ...currentRoom.botIds];

    io.in(roomUid)
      .fetchSockets()
      .then((sockets) => {
        sockets.forEach((socket) => {
          const playerId = socket.data.playerId;
          if (!playerId) return;

          const sanitized = buildStateUpdate(
            snapshot,
            playerId,
            currentRoom,
            allPlayerIds,
          );

          console.log(
            `[STATE] Room ${roomUid} | pId=${playerId} | turnoActual=${snapshot.context.turnoActual} | manoOriginal=${snapshot.context.manoOriginal} | cartasEnMesa=${snapshot.context.cartasEnMesa?.length}`,
          );
          socket.emit('game:state-update', sanitized);
        });
      })
      .catch(() => {
        /* socket already closed */
      });
  }, 50);
}

export function emitInitialState(
  socket: TrucSocket,
  playerId: string,
  room: Room,
) {
  const snapshot = room.actor.getSnapshot() as SnapshotLike;
  const allPlayerIds = [...room.playerIds, ...room.botIds];
  const sanitized = buildStateUpdate(snapshot, playerId, room, allPlayerIds);
  socket.emit('game:state-update', sanitized);
}
