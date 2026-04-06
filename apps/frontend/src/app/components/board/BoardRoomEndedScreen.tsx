import React from 'react';
import { motion } from 'framer-motion';
import { Alert } from '@mui/material';
import { useI18n } from '../../i18n/useI18n';

interface BoardRoomEndedScreenProps {
  message: string;
  onReturnHome: () => void;
}

export const BoardRoomEndedScreen: React.FC<BoardRoomEndedScreenProps> = ({
  message,
  onReturnHome,
}) => {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,#10b981_0,transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        data-qa="board-room-ended-screen"
        className="relative z-10 w-full max-w-xl px-6"
      >
        <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
          {t('board.roomEnded')}
        </Alert>
        <div className="rounded-3xl border border-rose-400/30 bg-black/40 p-8 text-center text-white shadow-2xl backdrop-blur">
          <p className="text-5xl mb-4">⛔</p>
          <p className="text-xl font-bold text-rose-200">{message}</p>
          <p className="mt-4 text-emerald-200">{t('board.returningHome')}</p>
          <button
            type="button"
            onClick={onReturnHome}
            className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3 font-black text-white transition-colors hover:bg-emerald-400"
          >
            {t('board.backLobby')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
