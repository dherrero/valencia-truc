import React from 'react';
import { Card as CardComponent } from './Card';
import { CardBack } from './CardBack';
import { ActionButtons } from './ActionButtons';
import { ScoreBoard } from './ScoreBoard';
import { GameLog } from './GameLog';
import { useTrucSocket } from '../hooks/useTrucSocket';
import { TrucAction, Card } from '@valencia-truc/shared-interfaces';
import { AnimatePresence, motion } from 'framer-motion';

export const Board: React.FC<{ roomUid: string; playerId: string }> = ({ roomUid, playerId }) => {
  const { gameState, sendAction, connectionStatus } = useTrucSocket(roomUid, playerId);

  const rivalCards = gameState ? Array.from({ length: gameState.cartasRival }).map((_, i) => ({ id: `rival-${i}` })) : [];
  const hasHand = gameState?.hand && gameState.hand.length > 0;
  const isLobby = gameState && !hasHand;
  const canDeal = isLobby && gameState.allowedActions.includes('REPARTIR' as TrucAction);

  // Connection screen
  if (connectionStatus !== 'connected') {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-2xl font-bold text-emerald-300">
            {connectionStatus === 'connecting' ? 'Conectando al servidor...' : 'Desconectado del servidor'}
          </div>
          <div className="text-slate-400 text-sm">Asegúrate de que el backend está corriendo en el puerto 3333</div>
        </div>
      </div>
    );
  }

  // Lobby / Waiting screen
  if (isLobby) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-emerald-950 text-white overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #064e3b 0, #064e3b 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-8 text-center"
        >
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-black tracking-tight"
            style={{ textShadow: '0 0 30px rgba(52,211,153,0.5)' }}
          >
            🃏 Truc Valencià
          </motion.h1>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-emerald-300 text-xl max-w-md"
          >
            Sala: <span className="font-bold text-white">room-1</span> · Jugador: <span className="font-bold text-white">{playerId}</span>
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4"
          >
            {/* Decorative card backs */}
            {[0, 0.05, 0.1].map((delay, i) => (
              <motion.div
                key={i}
                initial={{ rotate: (i - 1) * 8, y: 20, opacity: 0 }}
                animate={{ rotate: (i - 1) * 8, y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + delay }}
              >
                <CardBack />
              </motion.div>
            ))}
          </motion.div>

          {canDeal && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendAction('REPARTIR' as TrucAction)}
              className="mt-4 px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-2xl shadow-2xl transition-colors"
              style={{ boxShadow: '0 0 40px rgba(52,211,153,0.4)' }}
            >
              ¡Repartir Cartes!
            </motion.button>
          )}
          {!canDeal && (
            <p className="text-emerald-500 animate-pulse text-lg">Esperant que s'unisca un contrincant…</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-emerald-900 overflow-hidden flex flex-col justify-between p-8 shadow-inner shadow-black/50">
      {/* GAMELOG */}
      <GameLog lastAction={undefined} />

      {/* SCOREBOARD */}
      <ScoreBoard score={gameState?.score || { equipo1: 0, equipo2: 0 }} />

      {/* TOP AREA (RIVAL) */}
      <div className="flex flex-col items-center gap-1 h-1/4">
        <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest opacity-70">Rival</p>
        <div className="flex gap-4">
          <AnimatePresence>
            {rivalCards.map((rc, idx) => (
              <CardBack key={rc.id} delay={idx * 0.1} />
            ))}
          </AnimatePresence>
          {rivalCards.length === 0 && (
            <p className="text-emerald-800 text-sm italic">Sin cartes</p>
          )}
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

      {/* ACTIONS PANEL */}
      <div className="absolute bottom-52 left-1/2 -translate-x-1/2 z-20">
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
      <div className="flex flex-col justify-center items-center h-1/4 relative z-10 gap-1">
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
        {hasHand && <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest opacity-70">Tu mà</p>}
      </div>
    </div>
  );
};
