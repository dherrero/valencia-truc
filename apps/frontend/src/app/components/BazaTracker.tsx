import React from 'react';
import clsx from 'clsx';
import { useI18n } from '../i18n/useI18n';

interface BazaTrackerProps {
  results: Array<'equipo1' | 'equipo2' | 'empate'>;
  myTeam: 'equipo1' | 'equipo2';
}

export const BazaTracker: React.FC<BazaTrackerProps> = ({
  results,
  myTeam,
}) => {
  const { t } = useI18n();
  const slots = Array.from({ length: 3 }, (_, index) => results[index]);

  return (
    <div className="min-w-[160px] bg-black/45 p-3 rounded-xl shadow-2xl backdrop-blur-md border border-emerald-700/50">
      <h3 className="text-emerald-400 text-center font-bold mb-3 uppercase tracking-[0.2em] text-[11px] border-b border-emerald-700/70 pb-2">
        {t('scoreboard.bazas')}
      </h3>

      <div className="flex gap-2 justify-center">
        {slots.map((result, index) => {
          const symbol =
            result == null
              ? ''
              : result === 'empate'
                ? '🟰'
                : result === myTeam
                  ? '✅'
                  : '❌';

          return (
            <div
              key={index}
              className={clsx(
                'h-10 w-10 rounded-lg border-2 flex items-center justify-center text-lg font-black transition-colors',
                result == null
                  ? 'border-emerald-800/80 bg-emerald-950/30 text-emerald-700'
                  : result === 'empate'
                    ? 'border-amber-500/70 bg-amber-500/15'
                    : result === myTeam
                      ? 'border-emerald-400/70 bg-emerald-500/15'
                      : 'border-rose-400/70 bg-rose-500/15',
              )}
            >
              {symbol}
            </div>
          );
        })}
      </div>
    </div>
  );
};
