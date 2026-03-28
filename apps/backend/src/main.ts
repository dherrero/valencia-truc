import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { createActor, AnyActorRef } from 'xstate';
import { randomUUID } from 'crypto';
import { trucMachine, TrucContext, TrucEvent } from '@valencia-truc/shared-game-engine';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  TrucAction,
  RoomSummary,
} from '@valencia-truc/shared-interfaces';
import { sanitizeGameState } from './app/sanitize-state';
import { TrucBot } from './app/bot';

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' }
});

// ---------- Redis Setup ----------
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log(`📡 Conectado a Redis en ${REDIS_URL} - Adaptador activado.`);
}).catch((err) => {
  console.warn('⚠️ No se pudo conectar a Redis, funcionando en modo memoria local. Error:', err.message);
});

// ---------- Room Model ----------
interface Room {
  uid: string;
  name: string;
  actor: AnyActorRef;
  actorSubscription: { unsubscribe: () => void };
  playerIds: string[];   // human players
  botIds: string[];      // bot player IDs
  bots: TrucBot[];       // bot instances (for cleanup)
  botCount: number;
  status: 'waiting' | 'playing';
  emitDebounce: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, Room>();

// XState action → machine event type mapping
const actionToEvent: Record<string, string> = {
  [TrucAction.JUGAR_CARTA]: 'JUGAR_CARTA',
  [TrucAction.TRUC]: 'CANTAR_TRUC',
  [TrucAction.RETRUC]: 'RETRUC',
  [TrucAction.VALE_QUATRE]: 'VALE_QUATRE',
  [TrucAction.ENVIDO]: 'CANTAR_ENVIDO',
  [TrucAction.QUIERO]: 'QUIERO',
  [TrucAction.NO_QUIERO]: 'NO_QUIERO',
  'REPARTIR': 'REPARTIR',
};

// ---------- Helpers ----------
function getRoomSummary(room: Room): RoomSummary {
  return {
    uid: room.uid,
    name: room.name,
    playerCount: room.playerIds.length + room.botCount,
    botCount: room.botCount,
    maxPlayers: 4,
    status: room.status,
  };
}

function broadcastRoomsList() {
  const list: RoomSummary[] = Array.from(rooms.values()).map(getRoomSummary);
  io.emit('rooms:list', list);
}

// Debounced emitter — batches rapid state changes into one network flush per 50ms
function emitStateToRoom(roomUid: string, actor: AnyActorRef) {
  const room = rooms.get(roomUid);
  if (!room) return;

  // Cancel any pending emit for this room
  if (room.emitDebounce) {
    clearTimeout(room.emitDebounce);
  }

  room.emitDebounce = setTimeout(() => {
    room.emitDebounce = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshot = actor.getSnapshot() as any;
    const context = snapshot.context as TrucContext;
    const board: import('@valencia-truc/shared-interfaces').Card[] = [];
    const nextEvents: TrucAction[] = [];
    const allPlayerIds = [...room.playerIds, ...room.botIds];

    io.in(roomUid).fetchSockets().then(sockets => {
      sockets.forEach(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pId = (s as any).playerId as string | undefined;
        if (pId) {
          const sanitized = sanitizeGameState(context, pId, nextEvents, board, allPlayerIds);
          console.log(`[STATE] Room ${roomUid} | pId=${pId} | turnoActual=${context.turnoActual} | manoOriginal=${context.manoOriginal} | cartasEnMesa=${context.cartasEnMesa?.length}`);
          s.emit('game:state-update', sanitized);
        }
      });
    }).catch(() => { /* socket already closed */ });
  }, 50); // 50ms debounce
}

function emitInitialState(socket: Socket, playerId: string, actor: AnyActorRef, allPlayerIds: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshot = actor.getSnapshot() as any;
  const context = snapshot.context as TrucContext;
  const board: import('@valencia-truc/shared-interfaces').Card[] = [];
  const noCardsDealt = !context.cartasJugadores || Object.keys(context.cartasJugadores).length === 0;
  const allowedActions: TrucAction[] = noCardsDealt ? ['REPARTIR' as TrucAction] : [];
  const sanitized = sanitizeGameState(context, playerId, allowedActions, board, allPlayerIds);
  socket.emit('game:state-update', sanitized);
}

function createRoom(name: string, botCount: number): Room {
  const uid = randomUUID();
  const actor = createActor(trucMachine);
  actor.start();

  // Subscribe to state changes with debounced emit
  const actorSubscription = actor.subscribe(() => emitStateToRoom(uid, actor));

  const room: Room = {
    uid, name, actor, actorSubscription,
    playerIds: [], botIds: [], bots: [],
    botCount: 0, status: 'waiting', emitDebounce: null
  };
  rooms.set(uid, room);

  // Spin up bot instances and store references for cleanup
  const clampedBots = Math.min(botCount, 3);
  for (let i = 1; i <= clampedBots; i++) {
    const botId = `bot-${uid.slice(0, 8)}-${i}`;
    const bot = new TrucBot(actor, botId);
    room.bots.push(bot);
    room.botIds.push(botId);
    room.botCount++;
  }

  return room;
}

function destroyRoom(uid: string) {
  const room = rooms.get(uid);
  if (!room) return;

  // Stop all bot subscriptions first
  room.bots.forEach(bot => bot.stop());

  // Cancel debounced emit
  if (room.emitDebounce) clearTimeout(room.emitDebounce);

  // Unsubscribe actor listener
  room.actorSubscription.unsubscribe();

  // Stop the XState actor
  room.actor.stop();

  io.in(uid).emit('room:destroyed', `La sala "${room.name}" ha finalizado.`);
  io.in(uid).socketsLeave(uid);
  rooms.delete(uid);
  broadcastRoomsList();
}

// ---------- REST (debug/info) ----------
app.get('/api/rooms', (_req, res) => {
  res.json(Array.from(rooms.values()).map(getRoomSummary));
});

// ---------- Socket.io ----------
type TrucSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  playerId?: string;
  roomUid?: string;
};

io.on('connection', (socket: TrucSocket) => {
  console.log('Client connected:', socket.id);

  // Immediately send current room list to new visitor
  socket.emit('rooms:list', Array.from(rooms.values()).map(getRoomSummary));

  // ----- Create room -----
  socket.on('room:create', ({ name, bots = 0, playerId }, callback) => {
    const roomName = name?.trim() || `Sala ${rooms.size + 1}`;
    const botCount = Math.max(0, Math.min(3, bots));

    const room = createRoom(roomName, botCount);
    room.playerIds.push(playerId);

    socket.playerId = playerId;
    socket.roomUid = room.uid;
    socket.join(room.uid);

    callback({ status: 'ok', room: getRoomSummary(room) });
    broadcastRoomsList();
    emitInitialState(socket, playerId, room.actor, [...room.playerIds, ...room.botIds]);
  });

  // ----- Join room -----
  socket.on('room:join', ({ uid, playerId }, callback) => {
    const room = rooms.get(uid);

    if (!room) {
      callback({ status: 'error', message: 'La sala no existe.' });
      return;
    }

    const isRejoining = room.playerIds.includes(playerId);

    if (!isRejoining) {
      const totalOccupied = room.playerIds.length + room.botCount;
      if (totalOccupied >= 4) {
        callback({ status: 'error', message: 'La sala está completa.' });
        return;
      }
      room.playerIds.push(playerId);
    }

    socket.playerId = playerId;
    socket.roomUid = uid;
    socket.join(uid);

    callback({ status: 'ok', room: getRoomSummary(room) });
    broadcastRoomsList();
    emitInitialState(socket, playerId, room.actor, [...room.playerIds, ...room.botIds]);
  });

  // ----- Game action -----
  socket.on('game:action', (action, callback) => {
    const uid = socket.roomUid;
    const playerId = socket.playerId;
    const room = uid ? rooms.get(uid) : undefined;

    if (!room) {
      callback({ status: 'error', message: 'No estás en ninguna sala.' });
      return;
    }

    const eventType = actionToEvent[action.type] || action.type;
    // For REPARTIR, include all player IDs so the machine deals to correct hands
    if (eventType === 'REPARTIR') {
      room.actor.send({ type: 'REPARTIR', jugadores: [...room.playerIds, ...room.botIds] } as unknown as TrucEvent);
    } else {
      room.actor.send({ type: eventType, jugadorId: playerId, carta: action.payload } as unknown as TrucEvent);
    }

    // Mark as playing once first action happens
    if (room.status === 'waiting') {
      room.status = 'playing';
      broadcastRoomsList();
    }
    
    callback({ status: 'ok' });
  });

  // ----- Disconnect -----
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const uid = socket.roomUid;
    if (!uid) return;

    const room = rooms.get(uid);
    if (!room) return;

    room.playerIds = room.playerIds.filter(id => id !== socket.playerId);

    // Only destroy if no humans left AND no bots.
    // Use a grace period (10s) to handle the Home→GamePage socket transition:
    // the player's Home socket disconnects before their GamePage socket connects.
    if (room.playerIds.length === 0 && room.botCount === 0) {
      setTimeout(() => {
        const r = rooms.get(uid);
        if (r && r.playerIds.length === 0 && r.botCount === 0) {
          destroyRoom(uid);
        }
      }, 10000);
    } else {
      broadcastRoomsList();
    }
  });
});

const port = process.env.PORT || 3333;
httpServer.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
