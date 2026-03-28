import { AnyActorRef, Subscription } from 'xstate';
import * as fs from 'fs';
import { TrucContext, calculateEnvido, getCardPower } from '@valencia-truc/shared-game-engine';

export class TrucBot {
  private actor: AnyActorRef;
  private botId: string;
  private subscription: Subscription;
  private decideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(actor: AnyActorRef, botId: string) {
    this.actor = actor;
    this.botId = botId;
    this.subscription = this.actor.subscribe((state: unknown) => {
      if (this.decideTimeout) {
        clearTimeout(this.decideTimeout);
      }
      this.decideTimeout = setTimeout(() => {
        try {
          fs.appendFileSync('bot-debug.log', `[${new Date().toISOString()}] Bot ${this.botId} timeout fired! turnoActual = ${(state as any).context?.turnoActual}\n`);
          this.decideAction(state);
        } catch (err) {
          console.warn(`[TrucBot ${this.botId}] decideAction error:`, err);
        }
      }, Math.floor(Math.random() * 1000) + 500);
    });
  }

  stop() {
    this.subscription.unsubscribe();
  }

  private decideAction(state: unknown) {
    const snap = state as { context: TrucContext; can: (event: { type: string }) => boolean };
    const context = snap.context;
    if (!context) return;

    const misCartas = context.cartasJugadores?.[this.botId] ?? [];
    if (misCartas.length === 0) return;

    const can = (type: string) => {
      try { return snap.can({ type }); } catch { return false; }
    };

    const envidoPoints = calculateEnvido(misCartas);

    // 1. Respond to challenge (Quiero / No Quiero)
    if (can('QUIERO') && can('NO_QUIERO')) {
      const snap2 = state as { value?: { envido?: string } };
      if (snap2.value?.envido === 'cantado') {
        this.actor.send({ type: envidoPoints > 25 ? 'QUIERO' : 'NO_QUIERO', jugadorId: this.botId });
      } else {
        this.actor.send({ type: 'QUIERO', jugadorId: this.botId });
      }
      return;
    }

    // 2. Sing Envido if strong hand
    if (can('CANTAR_ENVIDO') && envidoPoints > 27) {
      this.actor.send({ type: 'CANTAR_ENVIDO', jugadorId: this.botId });
      return;
    }

    // 3. Sing Truc with strong cards or 20% bluff
    if (can('CANTAR_TRUC')) {
      const hasMaster = misCartas.some(c => getCardPower(c) >= 7);
      if (hasMaster || Math.random() > 0.8) {
        this.actor.send({ type: 'CANTAR_TRUC', jugadorId: this.botId });
        return;
      }
    }

    // 4. Play the weakest card
    fs.appendFileSync('bot-debug.log', `[${new Date().toISOString()}] Bot ${this.botId} checking play: turnoActual=${context.turnoActual}, misCartas=${misCartas.length}\n`);
    if (context.turnoActual === this.botId && misCartas.length > 0) {
      const lowestCard = [...misCartas].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      if (lowestCard) {
        fs.appendFileSync('bot-debug.log', `[${new Date().toISOString()}] Bot ${this.botId} SENDING JUGAR_CARTA!\n`);
        this.actor.send({ type: 'JUGAR_CARTA', jugadorId: this.botId, carta: lowestCard });
      } else {
        fs.appendFileSync('bot-debug.log', `[${new Date().toISOString()}] Bot ${this.botId} lowestCard is null?!\n`);
      }
    }
  }
}
