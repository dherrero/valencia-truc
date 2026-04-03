import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../i18n/useI18n';

interface JoinRoomModalProps {
  open: boolean;
  roomName: string;
  playerName: string;
  joining: boolean;
  onPlayerNameChange: (value: string) => void;
  onClose: () => void;
  onJoin: () => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  open,
  roomName,
  playerName,
  joining,
  onPlayerNameChange,
  onClose,
  onJoin,
}) => {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="join-room-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            data-qa="join-room-modal"
            className="bg-emerald-950 border border-emerald-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-2xl font-black mb-2">{t('home.joinRoom')}</h3>
            <p className="text-emerald-400 text-sm mb-6">{roomName}</p>

            <label className="block text-emerald-300 text-sm font-semibold mb-1">
              {t('home.playerName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder={t('home.playerNamePlaceholder')}
              className="w-full bg-emerald-900 border border-emerald-700 rounded-xl px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-8"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                data-qa="join-room-cancel-button"
                className="flex-1 py-3 rounded-xl bg-emerald-900 text-emerald-400 hover:bg-emerald-800 font-bold transition-colors"
              >
                {t('home.cancel')}
              </button>
              <button
                type="button"
                onClick={onJoin}
                disabled={joining || !playerName.trim()}
                data-qa="join-room-confirm-button"
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black transition-colors disabled:opacity-50"
              >
                {joining ? t('home.joining') : t('home.join')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
