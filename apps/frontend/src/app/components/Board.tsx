import React, { useState } from 'react';
import { Card as CardComponent } from './Card';
import { CardBack } from './CardBack';
import { ActionButtons } from './ActionButtons';
import { ScoreBoard } from './ScoreBoard';
import { GameLog } from './GameLog';
import { useTrucSocket } from '../hooks/useTrucSocket';
import { TrucAction, Card } from '@valencia-truc/shared-interfaces';
import { AnimatePresence, motion } from 'framer-motion';

export const Board: React.FC = () => {
  // In a real scenario, player ID and room ID would come from context or router
  const [playerId] = useState('equipo1');
  const { gameState, sendAction, connectionStatus } = useTrucSocket('room-1', playerId);

  // For simplicity, generate placeholders for rival cards
  const rivalCards = gameState ? Array.from({ length: gameState.cartasRival }).map((_, i) => ({ id: `rival-${i}` })) : [];
  
  const [lastAction, setLastAction] = useState<{ type: TrucAction, jugadorId: string } | undefined>();
  
  // To track actions for the log, we'd normally listen to a broadcast from the server or derive from state changes.
  // This serves as a placeholder for when that event arrives.

  if (connectionStatus !== 'connected') {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-slate-900 text-white">
        <div className="animate-pulse text-2xl font-bold">
          {connectionStatus === 'connecting' ? 'Conectando al servidor...' : 'Desconectado'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-emerald-900 overflow-hidden flex flex-col justify-between p-8 shadow-inner shadow-black/50">
      {/* GAMELOG */}
      <GameLog lastAction={lastAction} />

      {/* SCOREBOARD */}
      <ScoreBoard score={gameState?.score || { equipo1: 0, equipo2: 0 }} />

      {/* TOP AREA (RIVAL) */}
      <div className="flex justify-center items-center h-1/4">
        <div className="flex gap-4">
          <AnimatePresence>
            {rivalCards.map((rc, idx) => (
              <CardBack key={rc.id} delay={idx * 0.1} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* CENTER AREA (TABLE) */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl h-64 border-2 border-emerald-800/30 rounded-full flex items-center justify-center bg-emerald-800/10 backdrop-blur-sm">
          <AnimatePresence>
            {gameState?.board.map((card: Card, idx: number) => (
              <motion.div
                key={`board-${card.suit}-${card.value}`}
                initial={{ scale: 0, rotate: idx % 2 === 0 ? -15 : 15 }}
                animate={{ scale: 1, rotate: (idx % 3) * 10 - 10 }}
                className="absolute"
              >
                <CardComponent card={card} isPlayed />
              </motion.div>
            ))}
            {(!gameState?.board || gameState.board.length === 0) && (
              <span className="text-emerald-800/50 font-bold text-3xl uppercase tracking-widest">
                Mesa Vacia
              </span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ACTIONS PANEL (ABOVE PLAYER HAND) */}
      <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-20">
        <AnimatePresence>
          {gameState?.allowedActions && gameState.allowedActions.length > 0 && (
            <ActionButtons
              allowedActions={gameState.allowedActions}
              onAction={sendAction}
            />
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM AREA (PLAYER) */}
      <div className="flex justify-center flex-col items-center h-1/4 relative z-10">
        <div className="flex gap-4">
          <AnimatePresence>
            {gameState?.hand.map((card: Card) => (
              <CardComponent
                key={`hand-${card.suit}-${card.value}`}
                card={card}
                isPlayable={gameState.allowedActions.includes(TrucAction.JUGAR_CARTA)}
                onClick={() => sendAction(TrucAction.JUGAR_CARTA, card)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
