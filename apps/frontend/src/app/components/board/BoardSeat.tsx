import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { PlayerSeat } from '@valencia-truc/shared-interfaces';
import { CardBack } from '../CardBack';
import { useI18n } from '../../i18n/useI18n';

interface BoardSeatProps {
  seat: PlayerSeat;
  isTurn?: boolean;
  isMano?: boolean;
}

export const BoardSeat: React.FC<BoardSeatProps> = ({
  seat,
  isTurn,
  isMano,
}) => {
  const { t } = useI18n();
  const label = seat.isPartner ? t('board.partner') : t('board.rival');
  const ringColor = seat.isPartner ? 'ring-blue-400/50' : 'ring-red-400/50';
  const textColor = seat.isPartner ? 'text-blue-300' : 'text-red-300';
  const name = seat.displayName || '…';

  const backs = Array.from({ length: seat.cardCount });

  return (
    <div className="flex flex-col items-center gap-1">
      <p
        className={`${textColor} text-[10px] font-bold uppercase tracking-widest`}
      >
        {label} · {name}
      </p>
      <div
        className={`relative flex gap-1 p-1.5 rounded-xl ring-1 ${ringColor} ${isTurn ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : ''} min-w-[120px] min-h-[80px] justify-center items-center`}
      >
        <AnimatePresence>
          {backs.length > 0 ? (
            backs.map((_, i) => <CardBack key={i} delay={i * 0.08} />)
          ) : (
            <span className="text-slate-600 text-xs italic">
              {t('board.emptySeat')}
            </span>
          )}
        </AnimatePresence>
      </div>
      {isMano && (
        <div
          title={t('board.manoTitle')}
          className="w-4 h-4 bg-red-500 rounded-full border border-white shadow-md z-10 mt-1"
        />
      )}
    </div>
  );
};
