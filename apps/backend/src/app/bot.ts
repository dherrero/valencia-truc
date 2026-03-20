import { AnyActorRef } from 'xstate';
import { TrucContext, calculateEnvido, getCardPower } from '@valencia-truc/shared-game-engine';

export class TrucBot {
  private actor: AnyActorRef;
  private botId: string;

  constructor(actor: AnyActorRef, botId: string) {
    this.actor = actor;
    this.botId = botId;

    this.actor.subscribe((state: unknown) => {
      // Simulate human thinking time (1-2s)
      setTimeout(() => {
        try {
          this.decideAction(state);
        } catch (err) {
          // Never let a bot error crash the server
          console.warn(`[TrucBot ${this.botId}] Error in decideAction:`, err);
        }
      }, Math.floor(Math.random() * 1500) + 800);
    });
  }

  private decideAction(state: unknown) {
    // XState v5 snapshot: { context, value, can() }
    const snap = state as { context: TrucContext; can: (event: { type: string }) => boolean };
    const context = snap.context;
    if (!context) return;

    const misCartas = context.cartasJugadores?.[this.botId] ?? [];
    if (misCartas.length === 0) return; // No cards yet, nothing to do

    // Helper: check if an event is currently allowed by the machine
    const can = (type: string) => {
      try { return snap.can({ type }); } catch { return false; }
    };

    const envidoPoints = calculateEnvido(misCartas);

    // 1. Respond to Envido call
    if (can('QUIERO') && can('NO_QUIERO')) {
      // We're being asked to respond to something (Envido or Truc)
      // Check if envido is pending
      const snap2 = state as { value?: { envido?: string } };
      if (snap2.value?.envido === 'cantado') {
        if (envidoPoints > 25) {
          this.actor.send({ type: 'QUIERO', jugadorId: this.botId });
        } else {
          this.actor.send({ type: 'NO_QUIERO', jugadorId: this.botId });
        }
        return;
      }

      // Otherwise it's a Truc response — always accept for now
      this.actor.send({ type: 'QUIERO', jugadorId: this.botId });
      return;
    }

    // 2. Sing Envido if we have strong points (only on mano 1)
    if (can('CANTAR_ENVIDO') && envidoPoints > 27) {
      this.actor.send({ type: 'CANTAR_ENVIDO', jugadorId: this.botId });
      return;
    }

    // 3. Sing Truc with master cards or a 20% bluff
    if (can('CANTAR_TRUC')) {
      const hasMaster = misCartas.some(c => getCardPower(c) >= 7); // top 4 cards have power ≥ 7
      if (hasMaster || Math.random() > 0.8) {
        this.actor.send({ type: 'CANTAR_TRUC', jugadorId: this.botId });
        return;
      }
    }

    // 4. Play a card (the weakest one to conserve stronger ones)
    if (can('JUGAR_CARTA')) {
      const lowestCard = [...misCartas].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      if (lowestCard) {
        this.actor.send({ type: 'JUGAR_CARTA', jugadorId: this.botId, carta: lowestCard });
      }
    }
  }
}
