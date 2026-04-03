import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RoomSummary } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/LanguageProvider';

interface RoomsPanelProps {
  rooms: RoomSummary[];
  onCreateRoom: () => void;
  onJoinRoom: (uid: string) => void;
}

export const RoomsPanel: React.FC<RoomsPanelProps> = ({
  rooms,
  onCreateRoom,
  onJoinRoom,
}) => {
  const { t } = useI18n();

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-emerald-300">
          {t('home.activeRooms')}
        </h2>
        <button
          onClick={onCreateRoom}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-lg"
        >
          + {t('home.createRoom')}
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {rooms.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 text-emerald-700 text-lg italic"
          >
            {t('home.noRooms')}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {rooms.map((room) => (
              <motion.div
                key={room.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between bg-emerald-900/60 border border-emerald-700/40 rounded-2xl px-6 py-4 backdrop-blur-sm"
              >
                <div>
                  <p className="font-bold text-lg">{room.name}</p>
                  <p className="text-emerald-400 text-sm mt-0.5">
                    {room.playerCount}/{room.maxPlayers} {t('home.players')}
                    {room.botCount > 0 &&
                      ` · ${room.botCount} ${room.botCount > 1 ? t('home.bots') : t('home.bot')}`}
                    {' · '}
                    <span
                      className={
                        room.status === 'playing'
                          ? 'text-yellow-400'
                          : 'text-emerald-400'
                      }
                    >
                      {room.status === 'playing'
                        ? t('home.statusPlaying')
                        : t('home.statusWaiting')}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => onJoinRoom(room.uid)}
                  disabled={room.playerCount >= room.maxPlayers}
                  className="px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {room.playerCount >= room.maxPlayers
                    ? t('home.full')
                    : t('home.join')}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
