import React from 'react';
import { motion } from 'framer-motion';
import { CardBack } from '../CardBack';
import { useI18n } from '../../i18n/useI18n';

interface BoardLobbyScreenProps {
  canDeal: boolean;
  onDeal: () => void;
}

export const BoardLobbyScreen: React.FC<BoardLobbyScreenProps> = ({
  canDeal,
  onDeal,
}) => {
  const { t } = useI18n();

  return (
    <div
      className="flex items-center justify-center w-full h-screen bg-emerald-950 text-white overflow-hidden"
      data-qa="board-lobby-screen"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #064e3b 0, #064e3b 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-8 text-center"
      >
        <h1
          className="text-6xl font-black tracking-tight"
          style={{ textShadow: '0 0 30px rgba(52,211,153,0.5)' }}
        >
          <span role="img" aria-label="cartes">
            🃏
          </span>{' '}
          {t('app.name')}
        </h1>
        <div className="flex gap-4">
          {[0, 0.05, 0.1].map((_, i) => (
            <motion.div
              key={i}
              initial={{ rotate: (i - 1) * 8, y: 20, opacity: 0 }}
              animate={{ rotate: (i - 1) * 8, y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              <CardBack />
            </motion.div>
          ))}
        </div>
        {canDeal ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDeal}
            data-qa="board-deal-button"
            className="mt-4 px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-2xl shadow-2xl transition-colors"
            style={{ boxShadow: '0 0 40px rgba(52,211,153,0.4)' }}
          >
            {t('board.dealCards')}
          </motion.button>
        ) : (
          <p className="text-emerald-500 animate-pulse text-lg">
            {t('board.waitingPlayers')}
          </p>
        )}
      </motion.div>
    </div>
  );
};
