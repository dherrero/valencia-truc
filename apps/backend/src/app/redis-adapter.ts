import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { GameServer } from './socket-types';

export async function setupRedisAdapter(io: GameServer) {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const pubClient = createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log(`📡 Conectado a Redis en ${REDIS_URL} - Adaptador activado.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      '⚠️ No se pudo conectar a Redis, funcionando en modo memoria local. Error:',
      message,
    );
  }
}
