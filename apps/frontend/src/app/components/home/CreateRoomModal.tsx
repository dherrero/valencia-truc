import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../i18n/useI18n';

interface CreateRoomModalProps {
  open: boolean;
  playerName: string;
  roomName: string;
  botCount: number;
  roomsCount: number;
  creating: boolean;
  onPlayerNameChange: (value: string) => void;
  onRoomNameChange: (value: string) => void;
  onBotCountChange: (value: number) => void;
  onClose: () => void;
  onCreate: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  open,
  playerName,
  roomName,
  botCount,
  roomsCount,
  creating,
  onPlayerNameChange,
  onRoomNameChange,
  onBotCountChange,
  onClose,
  onCreate,
}) => {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
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
            data-qa="create-room-modal"
            className="bg-emerald-950 border border-emerald-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-2xl font-black mb-6">{t('home.newRoom')}</h3>

            <label className="block text-emerald-300 text-sm font-semibold mb-1">
              {t('home.playerName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder={t('home.playerNamePlaceholder')}
              data-qa="create-room-player-name"
              className="w-full bg-emerald-900 border border-emerald-700 rounded-xl px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-5"
            />

            <label className="block text-emerald-300 text-sm font-semibold mb-1">
              {t('home.roomName')}
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => onRoomNameChange(e.target.value)}
              placeholder={t('home.roomPlaceholder', {
                number: roomsCount + 1,
              })}
              data-qa="create-room-name"
              className="w-full bg-emerald-900 border border-emerald-700 rounded-xl px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
            />

            <label className="block text-emerald-300 text-sm font-semibold mb-3">
              {t('home.rivalBots')}:{' '}
              <span className="text-white font-black text-lg">{botCount}</span>
            </label>
            <div className="flex gap-2 mb-8">
              {[0, 1, 2, 3].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => onBotCountChange(n)}
                  data-qa={`create-room-bots-${n}`}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                    botCount === n
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-emerald-900 text-emerald-400 hover:bg-emerald-800'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                data-qa="create-room-cancel-button"
                className="flex-1 py-3 rounded-xl bg-emerald-900 text-emerald-400 hover:bg-emerald-800 font-bold transition-colors"
              >
                {t('home.cancel')}
              </button>
              <button
                type="button"
                onClick={onCreate}
                disabled={creating || !playerName.trim()}
                data-qa="create-room-confirm-button"
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black transition-colors disabled:opacity-50"
              >
                {creating ? t('home.creating') : t('home.create')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
