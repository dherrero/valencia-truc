import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { PlayerSeat } from '@valencia-truc/shared-interfaces';
import { CardBack } from '../CardBack';
import { useI18n } from '../../i18n/useI18n';

interface BoardOpponentSeatProps {
  seat: PlayerSeat;
  isTurn?: boolean;
  isMano?: boolean;
}

export const BoardOpponentSeat: React.FC<BoardOpponentSeatProps> = ({
  seat,
  isTurn,
  isMano,
}) => {
  const { t } = useI18n();
  const name = seat.playerId.startsWith('bot-')
    ? `🤖 ${t('board.bot')}`
    : `👤 ${seat.playerId.slice(0, 8)}…`;
  const backs = Array.from({ length: seat.cardCount });

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
          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl ring-1 ring-emerald-500/30 min-w-[90px] min-h-[120px] ${isTurn ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : ''}`}
        >
          <div className="flex flex-col justify-center items-center -space-y-12 scale-75 origin-center">
            <AnimatePresence>
              {backs.length > 0 ? (
                backs.map((_, i) => (
                  <div
                    key={i}
                    className={
                      seat.playerId.startsWith('bot-') ? '-rotate-90' : ''
                    }
                  >
                    <CardBack delay={i * 0.08} />
                  </div>
                ))
              ) : (
                <span className="text-slate-600 text-xs italic">—</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
