import type { AnyActorRef } from 'xstate';
import type { TrucBot } from './bot';

export interface Room {
  uid: string;
  name: string;
  actor: AnyActorRef;
  actorSubscription: { unsubscribe: () => void };
  playerIds: string[];
  playerNames: Record<string, string>;
  botIds: string[];
  bots: TrucBot[];
  botCount: number;
  status: 'waiting' | 'playing';
  emitDebounce: ReturnType<typeof setTimeout> | null;
  autoDealTimeout: ReturnType<typeof setTimeout> | null;
}
