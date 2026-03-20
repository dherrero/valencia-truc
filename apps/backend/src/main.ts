import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createActor, AnyActorRef } from 'xstate';
import { trucMachine } from '@valencia-truc/shared-game-engine';
import { ClientToServerEvents, ServerToClientEvents, TrucAction } from '@valencia-truc/shared-interfaces';
import { sanitizeGameState } from './app/sanitize-state';
import { TrucBot } from './app/bot';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' }
});

const activeRooms = new Map<string, AnyActorRef>();

app.get('/debug/start-bot-game', (req: import('express').Request, res: import('express').Response) => {
  const roomId = 'room-1';
  if (activeRooms.has(roomId)) {
    activeRooms.get(roomId)?.stop();
    activeRooms.delete(roomId);
  }

  const actor = createActor(trucMachine);
  actor.start();
  
  new TrucBot(actor, 'equipo2');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actor.subscribe((state: any) => {
    const context = state.context;
    const board: import('@valencia-truc/shared-interfaces').Card[] = []; 
    const nextEvents: TrucAction[] = [];

    io.in(roomId).fetchSockets().then(sockets => {
      sockets.forEach(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pId = (s as any).playerId;
        if (pId) {
          const sanitized = sanitizeGameState(context, pId, nextEvents, board);
          s.emit('game:state-update', sanitized);
        }
      });
    });
  });

  activeRooms.set(roomId, actor);
  res.json({ success: true, roomId, message: 'Bot ready in room-1.' });
});

type TrucSocket = Socket<ClientToServerEvents, ServerToClientEvents> & { playerId?: string; roomId?: string };

io.on('connection', (socket: TrucSocket) => {
  console.log('Client connected:', socket.id);

  socket.on('room:join', (roomId, playerId) => {
    socket.join(roomId);
    socket.playerId = playerId;
    socket.roomId = roomId;

    if (!activeRooms.has(roomId)) {
      const actor = createActor(trucMachine);
      actor.start();

      actor.subscribe((state) => {
        const context = state.context;
        const board: import('@valencia-truc/shared-interfaces').Card[] = []; 
        const nextEvents: TrucAction[] = [];

        io.in(roomId).fetchSockets().then(sockets => {
          sockets.forEach(s => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pId = (s as any).playerId;
            if (pId) {
              const sanitized = sanitizeGameState(context, pId, nextEvents, board);
              s.emit('game:state-update', sanitized);
            }
          });
        });
      });

      activeRooms.set(roomId, actor);
    }
  });

  socket.on('game:action', (action) => {
    const roomId = socket.roomId;
    const playerId = socket.playerId;
    const actor = roomId ? activeRooms.get(roomId) : undefined;

    if (actor) {
      actor.send({ ...action, jugadorId: playerId } as unknown as import('@valencia-truc/shared-game-engine').TrucEvent);
    } else {
      socket.emit('game:error', 'Room not found or game not started.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const port = process.env.PORT || 3333;
httpServer.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
