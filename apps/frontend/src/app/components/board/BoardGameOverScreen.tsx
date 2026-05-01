import React from 'react';
import { motion } from 'framer-motion';
import { RoundSummary } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/useI18n';

interface BoardGameOverScreenProps {
  winner: 'equipo1' | 'equipo2';
  score: { equipo1: number; equipo2: number };
  roundSummary?: RoundSummary;
  onNewGame: () => void | Promise<void>;
}

export const BoardGameOverScreen: React.FC<BoardGameOverScreenProps> = ({
  winner,
  score,
  roundSummary,
  onNewGame,
}) => {
  const { t } = useI18n();
  const isEquipo1 = winner === 'equipo1';
  const winnerLabel = isEquipo1 ? t('board.us') : t('board.rivals');

  return (
    <div className="fixed inset-0 bg-emerald-950 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #064e3b 0, #064e3b 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        data-qa="board-game-over-screen"
        className="relative z-10 flex flex-col items-center gap-6 text-center px-8"
      >
        <div className="text-8xl">{isEquipo1 ? '🏆' : '😔'}</div>
        <h1
          className="text-5xl font-black text-white"
          style={{ textShadow: '0 0 40px rgba(52,211,153,0.6)' }}
        >
          {isEquipo1 ? t('board.victory') : t('board.defeat')}
        </h1>
        <p className="text-emerald-300 text-xl">
          {t('board.winners')}{' '}
          <span className="font-bold text-white">{winnerLabel}</span>
        </p>
        <div className="flex gap-8 bg-black/30 rounded-2xl px-10 py-6 border border-emerald-700/40">
          <div className="text-center">
            <p className="text-emerald-400 text-sm uppercase tracking-widest mb-1">
              {t('board.us')}
            </p>
            <p className="text-4xl font-black text-white">{score.equipo1}</p>
          </div>
          <div className="text-emerald-700 text-4xl font-light self-center">
            —
          </div>
          <div className="text-center">
            <p className="text-red-400 text-sm uppercase tracking-widest mb-1">
              {t('board.rivals')}
            </p>
            <p className="text-4xl font-black text-white">{score.equipo2}</p>
          </div>
        </div>
        {roundSummary && (
          <div className="w-full max-w-md rounded-2xl border border-emerald-700/40 bg-black/20 p-4 text-left text-sm text-emerald-100">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              {t('board.finalSummary')}
            </p>
            <p className="mt-2">
              {t('board.score')}: {roundSummary.scoreAfter.equipo1} -{' '}
              {roundSummary.scoreAfter.equipo2}
            </p>
            <p className="mt-2">
              Envido: {roundSummary.envido.equipo1} -{' '}
              {roundSummary.envido.equipo2}
            </p>
            <p>
              Truc: {roundSummary.truc.equipo1} - {roundSummary.truc.equipo2}
            </p>
            {roundSummary.reasons.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-emerald-800 pt-3 text-xs text-emerald-200">
                {roundSummary.reasons.map((reason, index) => (
                  <p key={`${reason.team}-${reason.reasonKey}-${index}`}>
                    {reason.team === 'equipo1'
                      ? t('board.us')
                      : t('board.rivals')}{' '}
                    +{reason.points} ({t(`summaryReasons.${reason.reasonKey}`)})
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewGame}
          data-qa="board-new-game-button"
          className="mt-4 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl rounded-2xl shadow-2xl transition-colors cursor-pointer"
        >
          {t('board.newGame')}
        </motion.button>
      </motion.div>
    </div>
  );
};
