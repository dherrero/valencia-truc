import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card as CardComponent } from '../Card';
import { Card, TrucAction } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/useI18n';

interface BoardHandProps {
  hand: Card[];
  playerId: string;
  manoOriginal?: string;
  turnPlayerId?: string;
  canPlayCard: boolean;
  onCardPlay: (action: TrucAction, payload: Card) => void;
}

export const BoardHand: React.FC<BoardHandProps> = ({
  hand,
  playerId,
  manoOriginal,
  turnPlayerId,
  canPlayCard,
  onCardPlay,
}) => {
  const { t } = useI18n();
  const isCurrentTurn = turnPlayerId === playerId;

  return (
    <div
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 p-3 rounded-2xl transition-all ${isCurrentTurn ? 'ring-2 ring-yellow-400 bg-emerald-800/50 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : ''}`}
    >
      {manoOriginal === playerId && (
        <div
          title={t('board.manoTitle')}
          className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md z-30 mb-1"
        />
      )}
      <div className="flex gap-3">
        <AnimatePresence>
          {hand.map((card: Card) => (
            <CardComponent
              key={`hand-${card.suit}-${card.value}`}
              card={card}
              isPlayable={canPlayCard}
              onClick={() => onCardPlay(TrucAction.JUGAR_CARTA, card)}
            />
          ))}
        </AnimatePresence>
      </div>
      {hand.length > 0 && (
        <p className="text-emerald-300 text-[10px] font-semibold uppercase tracking-widest opacity-70 mt-2 bg-emerald-950 px-2 py-1 rounded">
          {isCurrentTurn
            ? `🟢 ${t('board.yourTurn')}`
            : `🃏 ${t('board.yourCards')}`}
        </p>
      )}
    </div>
  );
};
