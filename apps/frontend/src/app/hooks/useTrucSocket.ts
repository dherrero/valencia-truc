import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, GameStateUpdate, TrucAction } from '@valencia-truc/shared-interfaces';

const SOCKET_URL = 'http://localhost:3333';

export function useTrucSocket(roomId: string, playerId: string) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<GameStateUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      newSocket.emit('room:join', roomId, playerId);
    });

    newSocket.on('game:state-update', (state) => {
      setGameState(state);
    });

    newSocket.on('game:error', (msg) => {
      setErrorMsg(msg);
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('game:state-update');
      newSocket.off('game:error');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.disconnect();
    };
  }, [roomId, playerId]);

  const sendAction = useCallback((action: TrucAction, payload?: unknown) => {
    if (socket && connectionStatus === 'connected') {
      socket.emit('game:action', { type: action, payload });
    }
  }, [socket, connectionStatus]);

  return {
    gameState,
    sendAction,
    connectionStatus,
    errorMsg
  };
}
