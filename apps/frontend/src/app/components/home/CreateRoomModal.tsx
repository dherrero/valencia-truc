import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../i18n/LanguageProvider';

interface CreateRoomModalProps {
  open: boolean;
  roomName: string;
  botCount: number;
  roomsCount: number;
  creating: boolean;
  onRoomNameChange: (value: string) => void;
  onBotCountChange: (value: number) => void;
  onClose: () => void;
  onCreate: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  open,
  roomName,
  botCount,
  roomsCount,
  creating,
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
            className="bg-emerald-950 border border-emerald-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-2xl font-black mb-6">{t('home.newRoom')}</h3>

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
              className="w-full bg-emerald-900 border border-emerald-700 rounded-xl px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
            />

            <label className="block text-emerald-300 text-sm font-semibold mb-3">
              {t('home.rivalBots')}:{' '}
              <span className="text-white font-black text-lg">{botCount}</span>
            </label>
            <div className="flex gap-2 mb-8">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => onBotCountChange(n)}
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
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-emerald-900 text-emerald-400 hover:bg-emerald-800 font-bold transition-colors"
              >
                {t('home.cancel')}
              </button>
              <button
                onClick={onCreate}
                disabled={creating}
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
