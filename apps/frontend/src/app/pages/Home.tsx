import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomSummary,
} from '@valencia-truc/shared-interfaces';
import { Snackbar, Alert } from '@mui/material';
import { LanguageHeader } from '../components/LanguageHeader';
import { useI18n } from '../i18n/LanguageProvider';

const SOCKET_URL = 'http://localhost:3333';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [connected, setConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [botCount, setBotCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
      io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('rooms:list', setRooms);

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const handleCreate = () => {
    if (!socketRef.current) return;
    setCreating(true);
    // Generate a stable ID BEFORE creating the room so it survives the socket reconnect
    const playerId = `player-${crypto.randomUUID()}`;
    localStorage.setItem('truc_player', playerId);
    socketRef.current.emit(
      'room:create',
      {
        name: roomName.trim() || undefined,
        bots: botCount,
        playerId,
      },
      (res) => {
        if (res.status === 'ok' && res.room) {
          localStorage.setItem('truc_uid', res.room.uid);
          socketRef.current?.disconnect();
          navigate(`/partida/${res.room.uid}`);
        } else {
          setErrorMsg(res.message || t('home.createRoomError'));
          setCreating(false);
        }
      },
    );
  };

  const handleJoin = (uid: string) => {
    if (!socketRef.current) return;
    // Reuse existing playerId or generate a new stable one
    const playerId =
      localStorage.getItem('truc_player') ?? `player-${crypto.randomUUID()}`;
    localStorage.setItem('truc_player', playerId);
    socketRef.current.emit('room:join', { uid, playerId }, (res) => {
      if (res.status === 'ok' && res.room) {
        localStorage.setItem('truc_uid', res.room.uid);
        socketRef.current?.disconnect();
        navigate(`/partida/${res.room.uid}`);
      } else {
        setErrorMsg(res.message || t('home.joinRoomError'));
      }
    });
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex flex-col items-center px-4 py-12">
      <LanguageHeader />
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #10b981 0, #10b981 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #10b981 0, #10b981 1px, transparent 0, transparent 40px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-6xl font-black mb-2"
            style={{ textShadow: '0 0 40px rgba(52,211,153,0.4)' }}
          >
            <span role="img" aria-label="Cartes">
              🃏
            </span>{' '}
            {t('app.name')}
          </h1>
          <p className="text-emerald-400">
            {connected ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {t('home.connected')}
              </span>
            ) : (
              <span className="text-red-400">{t('home.connecting')}</span>
            )}
          </p>
        </div>

        {/* Room list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-emerald-300">
            {t('home.activeRooms')}
          </h2>
          <button
            onClick={() => setShowModal(true)}
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
                    onClick={() => handleJoin(room.uid)}
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
      </motion.div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
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
                onChange={(e) => setRoomName(e.target.value)}
                placeholder={t('home.roomPlaceholder', {
                  number: rooms.length + 1,
                })}
                className="w-full bg-emerald-900 border border-emerald-700 rounded-xl px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
              />

              <label className="block text-emerald-300 text-sm font-semibold mb-3">
                {t('home.rivalBots')}:{' '}
                <span className="text-white font-black text-lg">
                  {botCount}
                </span>
              </label>
              <div className="flex gap-2 mb-8">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBotCount(n)}
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
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-emerald-900 text-emerald-400 hover:bg-emerald-800 font-bold transition-colors"
                >
                  {t('home.cancel')}
                </button>
                <button
                  onClick={handleCreate}
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

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorMsg(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Home;
