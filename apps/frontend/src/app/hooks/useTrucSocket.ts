import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, GameStateUpdate, TrucAction } from '@valencia-truc/shared-interfaces';

const SOCKET_URL = 'http://localhost:3333';

export function useTrucSocket(roomUid: string, playerId: string) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<GameStateUpdate | null>(null);
  const [gameOver, setGameOver] = useState<{ ganador: 'equipo1' | 'equipo2'; score: { equipo1: number; equipo2: number } } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [roomError, setRoomError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      // Join the specific room by UID
      newSocket.emit('room:join', { uid: roomUid, playerId }, (res) => {
        if (res.status === 'error') {
          setRoomError(res.message || 'No s\'ha pogut connectar a la partida.');
        }
      });
    });

    newSocket.on('game:state-update', (state) => {
      setGameState(state);
      // Persist latest state to localStorage for fast reload
      localStorage.setItem('truc_gamestate', JSON.stringify(state));
    });

    newSocket.on('room:destroyed', () => {
      setConnectionStatus('disconnected');
      localStorage.removeItem('truc_uid');
      localStorage.removeItem('truc_player');
      localStorage.removeItem('truc_gamestate');
    });

    newSocket.on('disconnect', () => setConnectionStatus('disconnected'));
    newSocket.on('connect_error', () => setConnectionStatus('error'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newSocket as any).on('game:over', (data: { ganador: 'equipo1' | 'equipo2'; score: { equipo1: number; equipo2: number } }) => {
      setGameOver(data);
    });

    setSocket(newSocket);

    // Hydrate from localStorage while socket connects
    const cached = localStorage.getItem('truc_gamestate');
    if (cached) {
      try { setGameState(JSON.parse(cached)); } catch { /* ignore */ }
    }

    return () => {
      newSocket.off('connect');
      newSocket.off('game:state-update');
      newSocket.off('room:destroyed');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('game:over' as any);
      newSocket.disconnect();
    };
  }, [roomUid, playerId]);

  const sendAction = useCallback((action: TrucAction | string, payload?: unknown) => {
    if (socket && connectionStatus === 'connected') {
      socket.emit('game:action', { type: action, payload }, (res) => {
        if (res.status === 'error') {
          setRoomError(res.message || 'Error a l\'enviar l\'acció.');
        }
      });
    }
  }, [socket, connectionStatus]);

  return { gameState, gameOver, sendAction, connectionStatus, roomError, clearError: () => setRoomError(null) };
}
