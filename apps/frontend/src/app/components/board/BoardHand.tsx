import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card as CardComponent } from '../Card';
import { Card, TrucAction } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/useI18n';

interface BoardHandProps {
  hand: Card[];
  playerId: string;
  manoOriginal?: string;
  turnPlayerId?: string;
  canPlayCard: boolean;
  canElegirDesempate: boolean;
  desempateDescubierta: Card | null;
  onCardPlay: (action: TrucAction, payload: Card) => void;
  onDesempateSelect: (card: Card) => void;
}

export const BoardHand: React.FC<BoardHandProps> = ({
  hand,
  playerId,
  manoOriginal,
  turnPlayerId,
  canPlayCard,
  canElegirDesempate,
  desempateDescubierta,
  onCardPlay,
  onDesempateSelect,
}) => {
  const { t } = useI18n();
  const isCurrentTurn = turnPlayerId === playerId;

  const getCardLabel = () => {
    if (canElegirDesempate) {
      return desempateDescubierta
        ? `🃏 ${t('board.chooseDownCard')}`
        : `🃏 ${t('board.chooseUpCard')}`;
    }
    return isCurrentTurn
      ? `🟢 ${t('board.yourTurn')}`
      : `🃏 ${t('board.yourCards')}`;
  };

  const isCardSelected = (card: Card) =>
    desempateDescubierta !== null &&
    card.suit === desempateDescubierta.suit &&
    card.value === desempateDescubierta.value;

  const isCardPlayable = (card: Card) => {
    if (canElegirDesempate) {
      if (desempateDescubierta) {
        return !(
          card.suit === desempateDescubierta.suit &&
          card.value === desempateDescubierta.value
        );
      }
      return true;
    }
    return canPlayCard;
  };

  const handleCardClick = (card: Card) => {
    if (canElegirDesempate) {
      onDesempateSelect(card);
    } else if (canPlayCard) {
      onCardPlay(TrucAction.JUGAR_CARTA, card);
    }
  };

  const ringClass =
    isCurrentTurn || canElegirDesempate
      ? 'ring-2 ring-yellow-400 bg-emerald-800/50 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
      : '';

  const cards = (
    <AnimatePresence>
      {hand.map((card: Card) => (
        <motion.div
          key={`hand-${card.suit}-${card.value}`}
          animate={
            isCardSelected(card)
              ? { y: -12, scale: 1.08 }
              : { y: 0, scale: 1 }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <CardComponent
            card={card}
            isPlayable={isCardPlayable(card)}
            onClick={() => handleCardClick(card)}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );

  return (
    <div className="absolute bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 sm:gap-2 z-10">
      {manoOriginal === playerId && (
        <div
          title={t('board.manoTitle')}
          className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-white shadow-md z-30 mb-0.5"
        />
      )}

      {/* Mobile: label above cards so it stays visible when cards shift down */}
      {hand.length > 0 && (
        <p className="sm:hidden text-emerald-300 text-[9px] font-semibold uppercase tracking-widest opacity-70 bg-emerald-950 px-2 py-0.5 rounded">
          {getCardLabel()}
        </p>
      )}

      {/* Desktop */}
      <div className={`hidden sm:inline-flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${ringClass}`}>
        <div className="flex gap-3">{cards}</div>
      </div>

      {/* Mobile: flat row shifted down so only card tops (number + suit) are visible */}
      <div
        className={`sm:hidden inline-flex items-center gap-2 p-3 rounded-2xl transition-all ${ringClass}`}
        style={{ transform: 'translateY(65px)' }}
      >
        {cards}
      </div>

      {/* Desktop label below cards */}
      {hand.length > 0 && (
        <p className="hidden sm:block text-emerald-300 text-[10px] font-semibold uppercase tracking-widest opacity-70 bg-emerald-950 px-2 py-1 rounded">
          {getCardLabel()}
        </p>
      )}
    </div>
  );
};
