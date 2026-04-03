import React from 'react';
import { motion } from 'framer-motion';
import { RoundSummary } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/LanguageProvider';

interface BoardRoundSummaryModalProps {
  roundSummary: RoundSummary;
  canDeal: boolean;
  onNextRound: () => void;
}

export const BoardRoundSummaryModal: React.FC<BoardRoundSummaryModalProps> = ({
  roundSummary,
  canDeal,
  onNextRound,
}) => {
  const { t } = useI18n();

  const getTeamLabel = (team: 'equipo1' | 'equipo2') =>
    team === 'equipo1' ? t('board.us') : t('board.rivals');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-emerald-700/70 bg-emerald-950/95 p-6 text-white shadow-2xl backdrop-blur-sm"
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
          {t('board.roundEnd')}
        </p>
        <h2 className="mt-2 text-3xl font-black">{t('board.roundSummary')}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-emerald-800 bg-black/20 p-4">
            <p className="text-emerald-300 uppercase tracking-wider text-xs">
              {t('board.us')}
            </p>
            <p className="mt-2 text-3xl font-black text-white">
              +{roundSummary.awarded.equipo1}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-800 bg-black/20 p-4">
            <p className="text-red-300 uppercase tracking-wider text-xs">
              {t('board.rivals')}
            </p>
            <p className="mt-2 text-3xl font-black text-white">
              +{roundSummary.awarded.equipo2}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-emerald-800 bg-black/20 p-4 text-sm text-emerald-100">
          <p>
            Envido: {roundSummary.envido.equipo1} -{' '}
            {roundSummary.envido.equipo2}
          </p>
          <p>
            Truc: {roundSummary.truc.equipo1} - {roundSummary.truc.equipo2}
          </p>
          {roundSummary.reasons.length > 0 && (
            <div className="mt-3 border-t border-emerald-800 pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                {t('board.because')}
              </p>
              <div className="mt-2 space-y-1">
                {roundSummary.reasons.map((entry, index) => (
                  <p key={`${entry.team}-${entry.reasonKey}-${index}`}>
                    {t('board.summaryLine', {
                      team: getTeamLabel(entry.team),
                      points: entry.points,
                      suffix: entry.points === 1 ? '' : 's',
                      reason: t(`summaryReasons.${entry.reasonKey}`),
                    })}
                  </p>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 font-semibold text-emerald-300">
            {t('board.score')}: {roundSummary.scoreAfter.equipo1} -{' '}
            {roundSummary.scoreAfter.equipo2}
          </p>
        </div>
        {canDeal && (
          <button
            type="button"
            onClick={onNextRound}
            className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-lg font-black text-white transition-colors hover:bg-emerald-400"
          >
            {t('board.nextRound')}
          </button>
        )}
      </motion.div>
    </div>
  );
};
