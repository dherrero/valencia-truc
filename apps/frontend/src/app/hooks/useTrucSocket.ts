import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  GameOverState,
  ServerToClientEvents,
  GameStateUpdate,
  TrucAction,
} from '@valencia-truc/shared-interfaces';
import { useI18n } from '../i18n/useI18n';

const SOCKET_URL = 'http://localhost:3333';
const GAMESTATE_KEY = 'truc_gamestate';
const GAMESTATE_ROOM_KEY = 'truc_gamestate_room';

function inferPhase(
  state: Partial<GameStateUpdate>,
): 'lobby' | 'playing' | 'roundSummary' {
  if (state.phase) return state.phase;
  if (state.roundSummary) return 'roundSummary';
  return (state.hand?.length ?? 0) > 0 ? 'playing' : 'lobby';
}

export function useTrucSocket(roomUid: string, playerId: string) {
  const { t } = useI18n();
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [gameState, setGameState] = useState<GameStateUpdate | null>(null);
  const [gameOver, setGameOver] = useState<GameOverState | null>(null);
  const [sessionPhase, setSessionPhase] = useState<
    'lobby' | 'playing' | 'roundSummary' | 'gameOver'
  >('lobby');
  const hasGameStartedRef = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'error' | 'disconnected'
  >('connecting');
  const [roomError, setRoomError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> =
      io(SOCKET_URL);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      // Join the specific room by UID
      newSocket.emit('room:join', { uid: roomUid, playerId }, (res) => {
        if (res.status === 'error') {
          setRoomError(res.message || t('socket.roomConnectError'));
        }
      });
    });

    newSocket.on('game:state-update', (state) => {
      setGameState(state);
      if (state.phase !== 'lobby') {
        hasGameStartedRef.current = true;
      }

      setSessionPhase((current) => {
        if (state.phase === 'lobby' && hasGameStartedRef.current) {
          return current === 'gameOver' ? current : 'playing';
        }

        return state.phase;
      });
      // Persist latest state to localStorage for fast reload
      localStorage.setItem(GAMESTATE_KEY, JSON.stringify(state));
      localStorage.setItem(GAMESTATE_ROOM_KEY, roomUid);
    });

    newSocket.on('room:destroyed', () => {
      setConnectionStatus('disconnected');
      setGameState(null);
      setSessionPhase('lobby');
      hasGameStartedRef.current = false;
      localStorage.removeItem('truc_uid');
      localStorage.removeItem('truc_player');
      localStorage.removeItem(GAMESTATE_KEY);
      localStorage.removeItem(GAMESTATE_ROOM_KEY);
    });

    newSocket.on('disconnect', () => setConnectionStatus('disconnected'));
    newSocket.on('connect_error', () => setConnectionStatus('error'));
    newSocket.on('game:over', (data) => {
      setGameOver(data);
      setSessionPhase('gameOver');
    });

    // Hydrate from localStorage while socket connects
    const cachedRoom = localStorage.getItem(GAMESTATE_ROOM_KEY);
    const cached = localStorage.getItem(GAMESTATE_KEY);
    if (cached && cachedRoom === roomUid) {
      try {
        const parsed = JSON.parse(cached) as GameStateUpdate;
        setGameState(parsed);
        const inferredPhase = inferPhase(parsed);
        if (inferredPhase !== 'lobby') {
          hasGameStartedRef.current = true;
          setSessionPhase(inferredPhase);
        } else {
          setSessionPhase('lobby');
        }
      } catch {
        /* ignore */
      }
    }

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('game:state-update');
      newSocket.off('room:destroyed');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('game:over');
      newSocket.disconnect();
    };
  }, [roomUid, playerId]);

  const sendAction = useCallback(
    (action: TrucAction | string, payload?: unknown) => {
      if (socket && connectionStatus === 'connected') {
        socket.emit('game:action', { type: action, payload }, (res) => {
          if (res.status === 'error') {
            setRoomError(res.message || t('socket.actionError'));
          }
        });
      }
    },
    [socket, connectionStatus, t],
  );

  const destroyRoom = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not available'));
        return;
      }

      socket.emit('room:destroy', (res) => {
        if (res.status === 'error') {
          setRoomError(res.message || t('socket.actionError'));
          reject(new Error(res.message || 'Failed to destroy room'));
          return;
        }

        resolve();
      });
    });
  }, [socket, t]);

  return {
    gameState,
    gameOver,
    sessionPhase,
    sendAction,
    destroyRoom,
    connectionStatus,
    roomError,
    clearError: () => setRoomError(null),
  };
}
