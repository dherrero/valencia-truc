import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../../i18n/LanguageProvider';

interface BoardGameOverScreenProps {
  winner: 'equipo1' | 'equipo2';
  score: { equipo1: number; equipo2: number };
}

export const BoardGameOverScreen: React.FC<BoardGameOverScreenProps> = ({
  winner,
  score,
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
        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl rounded-2xl shadow-2xl transition-colors cursor-pointer"
        >
          {t('board.backLobby')}
        </motion.a>
      </motion.div>
    </div>
  );
};
