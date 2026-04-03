import { AnyActorRef, Subscription } from 'xstate';
import * as fs from 'fs';
import { TrucAction } from '@valencia-truc/shared-interfaces';
import {
  TrucContext,
  calculateEnvido,
  getAllowedActions,
  getCardPower,
} from '@valencia-truc/shared-game-engine';

export class TrucBot {
  private actor: AnyActorRef;
  private botId: string;
  private getHumanPlayerIds: () => string[];
  private subscription: Subscription;
  private decideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    actor: AnyActorRef,
    botId: string,
    getHumanPlayerIds: () => string[],
  ) {
    this.actor = actor;
    this.botId = botId;
    this.getHumanPlayerIds = getHumanPlayerIds;
    this.subscription = this.actor.subscribe((state: unknown) => {
      if (this.decideTimeout) {
        clearTimeout(this.decideTimeout);
      }
      this.decideTimeout = setTimeout(
        () => {
          try {
            fs.appendFileSync(
              'bot-debug.log',
              `[${new Date().toISOString()}] Bot ${this.botId} timeout fired! turnoActual = ${(state as any).context?.turnoActual}\n`,
            );
            this.decideAction(state);
          } catch (err) {
            console.warn(`[TrucBot ${this.botId}] decideAction error:`, err);
          }
        },
        Math.floor(Math.random() * 1500) + 1500,
      );
    });
  }

  stop() {
    this.subscription.unsubscribe();
  }

  private decideAction(state: unknown) {
    const snap = state as { context: TrucContext };
    const context = snap.context;
    if (!context) return;

    const misCartas = context.cartasJugadores?.[this.botId] ?? [];
    if (misCartas.length === 0) return;

    const allowedActions = getAllowedActions(
      this.actor.getSnapshot(),
      this.botId,
    );
    const can = (action: TrucAction) => allowedActions.includes(action);

    const envidoPoints = calculateEnvido(misCartas);
    const currentState = this.actor.getSnapshot();

    const teammateHumanCanRespond = this.getHumanPlayerIds().some(
      (playerId) => {
        const botIndex = context.jugadoresOrden.indexOf(this.botId);
        const playerIndex = context.jugadoresOrden.indexOf(playerId);
        if (botIndex === -1 || playerIndex === -1) return false;
        if (botIndex % 2 !== playerIndex % 2) return false;

        const teammateActions = getAllowedActions(currentState, playerId);
        return teammateActions.some((action) =>
          [
            TrucAction.QUIERO,
            TrucAction.NO_QUIERO,
            TrucAction.RETRUC,
            TrucAction.VALE_QUATRE,
            TrucAction.JUEGO_FUERA,
            TrucAction.TORNA_CHO,
          ].includes(action),
        );
      },
    );

    // 1. Respond to challenge (Quiero / No Quiero)
    if (can(TrucAction.QUIERO) && can(TrucAction.NO_QUIERO)) {
      if (teammateHumanCanRespond) return;

      if (
        currentState.matches({ envido: 'cantado' }) ||
        currentState.matches({ envido: 'torna_cho_cantado' })
      ) {
        this.actor.send({
          type: envidoPoints > 25 ? 'QUIERO' : 'NO_QUIERO',
          jugadorId: this.botId,
        });
      } else {
        this.actor.send({ type: 'QUIERO', jugadorId: this.botId });
      }
      return;
    }

    // 2. Sing Envido if strong hand
    if (
      context.turnoActual === this.botId &&
      can(TrucAction.ENVIDO) &&
      envidoPoints > 27
    ) {
      this.actor.send({ type: 'CANTAR_ENVIDO', jugadorId: this.botId });
      return;
    }

    // 3. Sing Truc with strong cards or 20% bluff
    if (context.turnoActual === this.botId && can(TrucAction.TRUC)) {
      const hasMaster = misCartas.some((c) => getCardPower(c) >= 7);
      if (hasMaster || Math.random() > 0.8) {
        this.actor.send({ type: 'CANTAR_TRUC', jugadorId: this.botId });
        return;
      }
    }

    // 4. Play the weakest card
    fs.appendFileSync(
      'bot-debug.log',
      `[${new Date().toISOString()}] Bot ${this.botId} checking play: turnoActual=${context.turnoActual}, misCartas=${misCartas.length}\n`,
    );
    if (context.turnoActual === this.botId && misCartas.length > 0) {
      const lowestCard = [...misCartas].sort(
        (a, b) => getCardPower(a) - getCardPower(b),
      )[0];
      if (lowestCard) {
        fs.appendFileSync(
          'bot-debug.log',
          `[${new Date().toISOString()}] Bot ${this.botId} SENDING JUGAR_CARTA!\n`,
        );
        this.actor.send({
          type: 'JUGAR_CARTA',
          jugadorId: this.botId,
          carta: lowestCard,
        });
      } else {
        fs.appendFileSync(
          'bot-debug.log',
          `[${new Date().toISOString()}] Bot ${this.botId} lowestCard is null?!\n`,
        );
      }
    }
  }
}
