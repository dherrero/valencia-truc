import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomSummary,
} from '@valencia-truc/shared-interfaces';
import { Snackbar, Alert } from '@mui/material';
import { useI18n } from '../i18n/LanguageProvider';
import { LanguageHeader } from '../components/LanguageHeader';
import { HomeHeader } from '../components/home/HomeHeader';
import { RoomsPanel } from '../components/home/RoomsPanel';
import { CreateRoomModal } from '../components/home/CreateRoomModal';

const SOCKET_URL = '';

function randomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

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
  }, []);

  const handleOpenCreateRoom = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseCreateRoom = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleRoomNameChange = useCallback((value: string) => {
    setRoomName(value);
  }, []);

  const handleBotCountChange = useCallback((value: number) => {
    setBotCount(value);
  }, []);

  const handleCreate = useCallback(() => {
    if (!socketRef.current) return;
    setCreating(true);
    // Generate a stable ID BEFORE creating the room so it survives the socket reconnect
    const playerId = `player-${randomUUID()}`;
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
  }, [botCount, navigate, roomName, t]);

  const handleJoin = useCallback(
    (uid: string) => {
      if (!socketRef.current) return;
      // Reuse existing playerId or generate a new stable one
      const playerId =
        localStorage.getItem('truc_player') ?? `player-${randomUUID()}`;
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
    },
    [navigate, t],
  );

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

      <div className="relative z-10 w-full max-w-3xl">
        <HomeHeader connected={connected} />

        <RoomsPanel
          rooms={rooms}
          onCreateRoom={handleOpenCreateRoom}
          onJoinRoom={handleJoin}
        />
      </div>

      <CreateRoomModal
        open={showModal}
        roomName={roomName}
        botCount={botCount}
        roomsCount={rooms.length}
        creating={creating}
        onRoomNameChange={handleRoomNameChange}
        onBotCountChange={handleBotCountChange}
        onClose={handleCloseCreateRoom}
        onCreate={handleCreate}
      />

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
