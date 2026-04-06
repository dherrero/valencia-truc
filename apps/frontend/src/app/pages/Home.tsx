import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomSummary,
} from '@valencia-truc/shared-interfaces';
import { Snackbar, Alert } from '@mui/material';
import { useI18n } from '../i18n/useI18n';
import { LanguageHeader } from '../components/LanguageHeader';
import { HomeHeader } from '../components/home/HomeHeader';
import { RoomsPanel } from '../components/home/RoomsPanel';
import { CreateRoomModal } from '../components/home/CreateRoomModal';
import { JoinRoomModal } from '../components/home/JoinRoomModal';

const SOCKET_URL = 'http://localhost:3333';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [connected, setConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [botCount, setBotCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roomMsg, setRoomMsg] = useState<string | null>(null);

  useEffect(() => {
    setPlayerName(localStorage.getItem('truc_name') ?? '');
  }, []);

  useEffect(() => {
    const state = location.state as { roomNotice?: string } | null;
    if (state?.roomNotice) {
      setRoomMsg(state.roomNotice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

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
    setPlayerName(localStorage.getItem('truc_name') ?? '');
    setShowModal(true);
  }, []);

  const handleCloseCreateRoom = useCallback(() => {
    setShowModal(false);
    setCreating(false);
  }, []);

  const handleOpenJoinRoom = useCallback((room: RoomSummary) => {
    setSelectedRoom(room);
    setPlayerName(localStorage.getItem('truc_name') ?? '');
    setShowJoinModal(true);
  }, []);

  const handleCloseJoinRoom = useCallback(() => {
    setShowJoinModal(false);
    setSelectedRoom(null);
    setJoining(false);
  }, []);

  const handlePlayerNameChange = useCallback((value: string) => {
    setPlayerName(value);
  }, []);

  const handleRoomNameChange = useCallback((value: string) => {
    setRoomName(value);
  }, []);

  const handleBotCountChange = useCallback((value: number) => {
    setBotCount(value);
  }, []);

  const handleCreate = useCallback(() => {
    if (!socketRef.current) return;
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setErrorMsg(t('home.nameRequired'));
      return;
    }
    setCreating(true);
    // Generate a stable ID BEFORE creating the room so it survives the socket reconnect
    const playerId = `player-${crypto.randomUUID()}`;
    localStorage.setItem('truc_player', playerId);
    localStorage.setItem('truc_name', trimmedName);
    socketRef.current.emit(
      'room:create',
      {
        name: roomName.trim() || undefined,
        bots: botCount,
        playerId,
        playerName: trimmedName,
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
  }, [botCount, navigate, playerName, roomName, t]);

  const handleJoin = useCallback(() => {
    if (!socketRef.current || !selectedRoom) return;
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setErrorMsg(t('home.nameRequired'));
      return;
    }

    setJoining(true);
    // Reuse existing playerId or generate a new stable one
    const playerId =
      localStorage.getItem('truc_player') ?? `player-${crypto.randomUUID()}`;
    localStorage.setItem('truc_player', playerId);
    localStorage.setItem('truc_name', trimmedName);
    socketRef.current.emit(
      'room:join',
      { uid: selectedRoom.uid, playerId, playerName: trimmedName },
      (res) => {
        if (res.status === 'ok' && res.room) {
          localStorage.setItem('truc_uid', res.room.uid);
          socketRef.current?.disconnect();
          navigate(`/partida/${res.room.uid}`);
        } else {
          setErrorMsg(res.message || t('home.joinRoomError'));
          setJoining(false);
        }
      },
    );
  }, [navigate, playerName, selectedRoom, t]);

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
          onJoinRoom={handleOpenJoinRoom}
        />
      </div>

      <CreateRoomModal
        open={showModal}
        playerName={playerName}
        roomName={roomName}
        botCount={botCount}
        roomsCount={rooms.length}
        creating={creating}
        onPlayerNameChange={handlePlayerNameChange}
        onRoomNameChange={handleRoomNameChange}
        onBotCountChange={handleBotCountChange}
        onClose={handleCloseCreateRoom}
        onCreate={handleCreate}
      />

      <JoinRoomModal
        open={showJoinModal}
        roomName={selectedRoom?.name ?? ''}
        playerName={playerName}
        joining={joining}
        onPlayerNameChange={handlePlayerNameChange}
        onClose={handleCloseJoinRoom}
        onJoin={handleJoin}
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

      <Snackbar
        open={!!roomMsg}
        autoHideDuration={6000}
        onClose={() => setRoomMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setRoomMsg(null)}
          severity="warning"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {roomMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Home;
