import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { PlayerSeat } from '@valencia-truc/shared-interfaces';
import { CardBack } from '../CardBack';
import { useI18n } from '../../i18n/useI18n';

interface BoardOpponentSeatProps {
  seat: PlayerSeat;
  isTurn?: boolean;
  isMano?: boolean;
  direction?: 'left' | 'right';
}

export const BoardOpponentSeat: React.FC<BoardOpponentSeatProps> = ({
  seat,
  isTurn,
  isMano,
  direction,
}) => {
  const { t } = useI18n();
  const name = seat.displayName || '…';
  // During the desempate a player who has already chosen keeps their two cards
  // set aside face-down (they are not lost), so show two backs instead of "—".
  const backs = Array.from({
    length: seat.desempateSubmitted ? 2 : seat.cardCount,
  });

  // On mobile push card stack toward the screen edge
  const cardShift =
    direction === 'left'
      ? 'sm:translate-x-0 -translate-x-6'
      : direction === 'right'
        ? 'sm:translate-x-0 translate-x-6'
        : '';

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-red-300 text-[10px] font-bold uppercase tracking-widest bg-emerald-900/80 px-2 rounded">
        {t('board.rival')} · {name}
      </p>
      <div className="flex flex-row items-center gap-4">
        {isMano && (
          <div
            title={t('board.manoTitle')}
            className="w-4 h-4 bg-red-500 rounded-full border border-white shadow-md z-10"
          />
        )}
        <div
          className={`relative flex flex-col items-center p-2 rounded-xl ring-1 ring-emerald-500/30 ${isTurn ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : ''} ${cardShift}`}
        >
          {seat.desempateSubmitted && (
            <span className="absolute -top-2 -right-2 z-10 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
              ✓ {t('board.desempateChosen')}
            </span>
          )}
          <div className="flex flex-col items-center -space-y-4">
            <AnimatePresence>
              {backs.length > 0 ? (
                backs.map((_, i) => (
                  <div
                    key={i}
                    className="relative w-[75px] h-[50px] sm:w-[120px] sm:h-[80px]"
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 scale-75">
                      <CardBack delay={i * 0.08} />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-slate-600 text-xs italic px-4 py-6">
                  —
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
