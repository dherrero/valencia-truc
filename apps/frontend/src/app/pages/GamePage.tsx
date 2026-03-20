import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Board } from '../components/Board';

const GamePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      navigate('/');
      return;
    }

    // Recover or generate playerId
    let storedPlayer = localStorage.getItem('truc_player');
    const storedUid = localStorage.getItem('truc_uid');

    // If we refreshed into a different game, generate a new player id
    if (storedUid !== uid || !storedPlayer) {
      storedPlayer = `player-${Date.now()}`;
    }

    localStorage.setItem('truc_uid', uid);
    localStorage.setItem('truc_player', storedPlayer);
    setPlayerId(storedPlayer);
  }, [uid, navigate]);

  if (!uid || !playerId) return null;

  return <Board roomUid={uid} playerId={playerId} />;
};

export default GamePage;
