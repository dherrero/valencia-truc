import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card as CardComponent } from '../Card';
import { Card, TrucAction } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/LanguageProvider';

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

// Mobile fan: how far each card is offset from center (px) and its rotation
// Cards are ~66px wide after zoom:0.63. Spread of ±160px puts outer cards ~10px off screen edges on 390px phone.
const MOBILE_FAN: Record<number, Array<{ x: number; rotate: number }>> = {
  1: [{ x: 0, rotate: 0 }],
  2: [{ x: -90, rotate: -14 }, { x: 90, rotate: 14 }],
  3: [{ x: -160, rotate: -20 }, { x: 0, rotate: 0 }, { x: 160, rotate: 20 }],
};

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

  const fanConfig = MOBILE_FAN[hand.length] ?? MOBILE_FAN[3];

  const ringClass =
    isCurrentTurn || canElegirDesempate
      ? 'ring-2 ring-yellow-400 bg-emerald-800/50 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
      : '';

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 sm:gap-2 z-10">
      {manoOriginal === playerId && (
        <div
          title={t('board.manoTitle')}
          className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-white shadow-md z-30 mb-0.5"
        />
      )}

      {/* Desktop: flat row with ring wrapper */}
      <div className={`hidden sm:inline-flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${ringClass}`}>
        <div className="flex gap-3">
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
        </div>
      </div>

      {/* Mobile: fan layout — outer cards intentionally overflow screen edges */}
      <div className={`sm:hidden relative p-2 rounded-2xl transition-all ${ringClass}`} style={{ width: '1px', height: '120px' }}>
        <AnimatePresence>
          {hand.map((card: Card, idx: number) => {
            const fan = fanConfig[idx] ?? { x: 0, rotate: 0 };
            const selected = isCardSelected(card);
            return (
              <motion.div
                key={`hand-${card.suit}-${card.value}`}
                style={{ position: 'absolute', bottom: 0, left: 0, transformOrigin: 'bottom center' }}
                animate={{
                  x: fan.x - 33, // 33 ≈ half of zoomed card width (66px)
                  rotate: selected ? fan.rotate - 4 : fan.rotate,
                  y: selected ? -18 : 0,
                  scale: selected ? 1.08 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CardComponent
                  card={card}
                  isPlayable={isCardPlayable(card)}
                  onClick={() => handleCardClick(card)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hand.length > 0 && (
        <p className="text-emerald-300 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest opacity-70 bg-emerald-950 px-2 py-0.5 sm:py-1 rounded">
          {getCardLabel()}
        </p>
      )}
    </div>
  );
};
