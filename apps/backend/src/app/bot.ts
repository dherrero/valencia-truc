import { AnyActorRef } from 'xstate';
import { TrucAction } from '@valencia-truc/shared-interfaces';
import { TrucContext, calculateEnvido, getCardPower } from '@valencia-truc/shared-game-engine';

export class TrucBot {
  private actor: AnyActorRef;
  private botId: string;

  constructor(actor: AnyActorRef, botId: string) {
    this.actor = actor;
    this.botId = botId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.actor.subscribe((state: any) => {
      this.handleState(state);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleState(state: any) {
    // Quick guard to only act if it's our turn based on simple heuristics in this prototype
    // Some states require responses from the non-active player (like responding to Truc)
    // For simplicity, the bot will attempt to decide its next action based on context flags

    // Simulate human thinking randomly between 1 to 3 seconds
    setTimeout(() => {
      this.decideAction(state);
    }, Math.floor(Math.random() * 2000) + 1000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private decideAction(state: any) {
    const context = state.context as TrucContext;
    const nextEvents = state.nextEvents as string[]; // from xstate snapshot
    const misCartas = context.cartasJugadores[this.botId] || [];
    
    if (misCartas.length === 0) return; // Nada que hacer sin cartas

    const envidoPoints = calculateEnvido(misCartas);
    
    // 1. Responder a Envido
    if (nextEvents.includes(TrucAction.QUIERO) && state.value.envido === 'cantado') {
      if (envidoPoints > 25) {
        this.actor.send({ type: TrucAction.QUIERO, jugadorId: this.botId });
      } else {
        this.actor.send({ type: TrucAction.NO_QUIERO, jugadorId: this.botId });
      }
      return;
    }

    // 2. Cantar Envido (solo si no se ha cantado y tenemos buena puntuación)
    if (nextEvents.includes(TrucAction.ENVIDO) && envidoPoints > 27) {
      // 20% farol
      if (Math.random() > 0.8 || envidoPoints > 27) {
        this.actor.send({ type: TrucAction.ENVIDO, jugadorId: this.botId });
        return;
      }
    }

    // 3. Responder a Truc
    if (nextEvents.includes(TrucAction.QUIERO) && state.value.truc === 'truc_cantado') {
        this.actor.send({ type: TrucAction.QUIERO, jugadorId: this.botId }); // Prototype bot siempre quiere el truc de momento
        return;
    }

    // 4. Cantar Truc (Farol 20% o con cartas fuertes)
    if (nextEvents.includes(TrucAction.TRUC)) {
      const hasMaster = misCartas.some(c => {
        const val = getCardPower(c);
        // As Espadas (22), As Bastos (21), 7 Espadas (20), 7 Oros (19)
        return val >= 19;
      });

      if (hasMaster || Math.random() > 0.8) {
        this.actor.send({ type: TrucAction.TRUC, jugadorId: this.botId });
        return;
      }
    }

    // 5. Jugar Carta (la más baja posible, para simular)
    if (nextEvents.includes(TrucAction.JUGAR_CARTA) && !nextEvents.includes(TrucAction.QUIERO)) {
      const lowestCard = [...misCartas].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      this.actor.send({ type: TrucAction.JUGAR_CARTA, payload: lowestCard, jugadorId: this.botId });
    }
  }
}
