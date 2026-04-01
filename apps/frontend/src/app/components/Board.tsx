import React from 'react';
import { Card as CardComponent } from './Card';
import { CardBack } from './CardBack';
import { ActionButtons } from './ActionButtons';
import { ScoreBoard } from './ScoreBoard';
import { GameLog } from './GameLog';
import { useTrucSocket } from '../hooks/useTrucSocket';
import { TrucAction, Card, PlayerSeat } from '@valencia-truc/shared-interfaces';
import { AnimatePresence, motion } from 'framer-motion';
import { Snackbar, Alert } from '@mui/material';

// ── Sub-component for a single seat (top / right / left) ──────────────────────
const SeatArea: React.FC<{
  seat: PlayerSeat;
  isTurn?: boolean;
  isMano?: boolean;
}> = ({ seat, isTurn, isMano }) => {
  const label = seat.isPartner ? 'Company' : 'Rival';
  const ringColor = seat.isPartner ? 'ring-blue-400/50' : 'ring-red-400/50';
  const textColor = seat.isPartner ? 'text-blue-300' : 'text-red-300';
  const name = seat.playerId
    ? seat.playerId.startsWith('bot-')
      ? '🤖 Bot'
      : `👤 ${seat.playerId.slice(0, 8)}…`
    : '…';

  const backs = Array.from({ length: seat.cardCount });

  return (
    <div className={`flex flex-col items-center gap-1`}>
      <p
        className={`${textColor} text-[10px] font-bold uppercase tracking-widest`}
      >
        {label} · {name}
      </p>
      <div
        className={`relative flex gap-1 p-1.5 rounded-xl ring-1 ${ringColor} ${isTurn ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : ''} min-w-[120px] min-h-[80px] justify-center items-center`}
      >
        <AnimatePresence>
          {backs.length > 0 ? (
            backs.map((_, i) => <CardBack key={i} delay={i * 0.08} />)
          ) : (
            <span className="text-slate-600 text-xs italic">Sense cartes</span>
          )}
        </AnimatePresence>
      </div>
      {isMano && (
        <div
          title="mà de la partida"
          className="w-4 h-4 bg-red-500 rounded-full border border-white shadow-md z-10 mt-1"
        />
      )}
    </div>
  );
};

// ── Main Board ─────────────────────────────────────────────────────────────────
export const Board: React.FC<{ roomUid: string; playerId: string }> = ({
  roomUid,
  playerId,
}) => {
  const {
    gameState,
    gameOver,
    sendAction,
    connectionStatus,
    roomError,
    clearError,
  } = useTrucSocket(roomUid, playerId);

  const hasHand = (gameState?.hand?.length ?? 0) > 0;
  const isLobby = gameState != null && !hasHand;
  const canDeal =
    isLobby && gameState.allowedActions.includes(TrucAction.REPARTIR);
  const canPlayCard =
    gameState?.allowedActions.includes(TrucAction.JUGAR_CARTA) ?? false;
  const canChooseTieBreaker =
    gameState?.allowedActions.includes(TrucAction.ELEGIR_CARTA_DESEMPATE) ??
    false;

  const topSeat = gameState?.otherPlayers?.find((p) => p.position === 'top');
  const rightSeat = gameState?.otherPlayers?.find(
    (p) => p.position === 'right',
  );
  const leftSeat = gameState?.otherPlayers?.find((p) => p.position === 'left');

  // ── Connection screen ───────────────────────────────────────────────────────
  if (connectionStatus !== 'connected') {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-2xl font-bold text-emerald-300">
            {connectionStatus === 'connecting'
              ? 'Connectant al servidor…'
              : 'Desconnectat'}
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over screen ─────────────────────────────────────────────────────────
  if (gameOver) {
    const isEquipo1 = gameOver.ganador === 'equipo1';
    const winnerLabel = isEquipo1 ? 'Nosaltres' : 'Rivals';
    // equipo1 = even indices in jugadoresOrden. We can't know player index here,
    // so display the winning team label generically.
    const weWon = isEquipo1;

    return (
      <div className="fixed inset-0 bg-emerald-950 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #064e3b 0, #064e3b 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-6 text-center px-8"
        >
          <div className="text-8xl">{weWon ? '🏆' : '😔'}</div>
          <h1
            className="text-5xl font-black text-white"
            style={{ textShadow: '0 0 40px rgba(52,211,153,0.6)' }}
          >
            {weWon ? '¡Victoria!' : '¡Derrota!'}
          </h1>
          <p className="text-emerald-300 text-xl">
            Guanya <span className="font-bold text-white">{winnerLabel}</span>
          </p>
          <div className="flex gap-8 bg-black/30 rounded-2xl px-10 py-6 border border-emerald-700/40">
            <div className="text-center">
              <p className="text-emerald-400 text-sm uppercase tracking-widest mb-1">
                Nosotros
              </p>
              <p className="text-4xl font-black text-white">
                {gameOver.score.equipo1}
              </p>
            </div>
            <div className="text-emerald-700 text-4xl font-light self-center">
              —
            </div>
            <div className="text-center">
              <p className="text-red-400 text-sm uppercase tracking-widest mb-1">
                Rivals
              </p>
              <p className="text-4xl font-black text-white">
                {gameOver.score.equipo2}
              </p>
            </div>
          </div>
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl rounded-2xl shadow-2xl transition-colors cursor-pointer"
          >
            Tornar al Lobby
          </motion.a>
        </motion.div>
      </div>
    );
  }

  // ── Lobby screen ────────────────────────────────────────────────────────────
  if (isLobby) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-emerald-950 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #064e3b 0, #064e3b 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-8 text-center"
        >
          <h1
            className="text-6xl font-black tracking-tight"
            style={{ textShadow: '0 0 30px rgba(52,211,153,0.5)' }}
          >
            <span role="img" aria-label="cartes">
              🃏
            </span>{' '}
            Truc Valencià
          </h1>
          <div className="flex gap-4">
            {[0, 0.05, 0.1].map((_, i) => (
              <motion.div
                key={i}
                initial={{ rotate: (i - 1) * 8, y: 20, opacity: 0 }}
                animate={{ rotate: (i - 1) * 8, y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <CardBack />
              </motion.div>
            ))}
          </div>
          {canDeal ? (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendAction(TrucAction.REPARTIR)}
              className="mt-4 px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-2xl shadow-2xl transition-colors"
              style={{ boxShadow: '0 0 40px rgba(52,211,153,0.4)' }}
            >
              ¡Repartir Cartes!
            </motion.button>
          ) : (
            <p className="text-emerald-500 animate-pulse text-lg">
              Esperant jugadors…
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Game table ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-emerald-900 overflow-hidden select-none">
      {/* ── SCOREBOARD ── */}
      <div className="absolute top-4 left-4 z-30">
        <ScoreBoard score={gameState?.score || { equipo1: 0, equipo2: 0 }} />
      </div>

      {/* ── GAMELOG ── */}
      <div className="absolute top-2 right-2 z-30">
        <GameLog lastAction={undefined} />
      </div>

      {/*
        ┌──────────────────────────────────────┐
        │              TOP (company)           │
        │  LEFT (rival)       RIGHT (rival)    │
        │              CENTER (mesa)           │
        │              BOTTOM (yo)             │
        └──────────────────────────────────────┘
      */}

      {/* ── TOP SEAT (partner) ── */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        {topSeat && (
          <SeatArea
            seat={topSeat}
            isTurn={gameState?.turnoActual === topSeat.playerId}
            isMano={gameState?.manoOriginal === topSeat.playerId}
          />
        )}
      </div>

      {/* ── LEFT SEAT (rival) ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {leftSeat && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-red-300 text-[10px] font-bold uppercase tracking-widest bg-emerald-900/80 px-2 rounded">
              Rival ·{' '}
              {leftSeat.playerId.startsWith('bot-')
                ? '🤖 Bot'
                : `👤 ${leftSeat.playerId.slice(0, 8)}…`}
            </p>
            <div className="flex flex-row items-center gap-4">
              <div
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl ring-1 ring-emerald-500/30 min-w-[90px] min-h-[120px] ${gameState?.turnoActual === leftSeat.playerId ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : ''}`}
              >
                <div className="flex flex-col justify-center items-center -space-y-12 scale-75 origin-center">
                  <AnimatePresence>
                    {Array.from({ length: leftSeat.cardCount }).map((_, i) => (
                      <div key={i} className="-rotate-90">
                        <CardBack delay={i * 0.08} />
                      </div>
                    ))}
                    {leftSeat.cardCount === 0 && (
                      <span className="text-slate-600 text-xs italic">—</span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {gameState?.manoOriginal === leftSeat.playerId && (
                <div
                  title="mà de la partida"
                  className="w-4 h-4 bg-red-500 rounded-full border border-white shadow-md z-10"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT SEAT (rival) ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {rightSeat && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-red-300 text-[10px] font-bold uppercase tracking-widest bg-emerald-900/80 px-2 rounded">
              Rival ·{' '}
              {rightSeat.playerId.startsWith('bot-')
                ? '🤖 Bot'
                : `👤 ${rightSeat.playerId.slice(0, 8)}…`}
            </p>
            <div className="flex flex-row items-center gap-4">
              {gameState?.manoOriginal === rightSeat.playerId && (
                <div
                  title="mà de la partida"
                  className="w-4 h-4 bg-red-500 rounded-full border border-white shadow-md z-10"
                />
              )}
              <div
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl ring-1 ring-emerald-500/30 min-w-[90px] min-h-[120px] ${gameState?.turnoActual === rightSeat.playerId ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : ''}`}
              >
                <div className="flex flex-col justify-center items-center -space-y-12 scale-75 origin-center">
                  <AnimatePresence>
                    {Array.from({ length: rightSeat.cardCount }).map((_, i) => (
                      <div key={i} className="rotate-90">
                        <CardBack delay={i * 0.08} />
                      </div>
                    ))}
                    {rightSeat.cardCount === 0 && (
                      <span className="text-slate-600 text-xs italic">—</span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CENTER TABLE (mesa) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-44 md:w-96 md:h-56 border-2 border-emerald-700/40 rounded-[40%] flex items-center justify-center bg-emerald-800/20 backdrop-blur-sm shadow-inner shadow-black/30">
          <AnimatePresence>
            {(gameState?.cartasEnMesa?.length ?? 0) > 0 ? (
              gameState!.cartasEnMesa!.map(
                ({ jugadorId, carta }, idx: number) => {
                  // Calcular abanico para que se vea la esquina superior izquierda (índice y palo)
                  return (
                    <motion.div
                      key={`board-${carta.suit}-${carta.value}-${idx}`}
                      initial={{ scale: 0, opacity: 0, rotate: -30 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        x: idx * 35 - 45, // Desplazamiento horizontal para mostrar esquina izquierda
                        y: idx * 5 - 10, // Ligero encaje vertical
                        rotate: idx * 12 - 18, // Rotación en abanico
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                      }}
                      className="absolute drop-shadow-2xl"
                      style={{ zIndex: idx }}
                    >
                      <CardComponent card={carta} isPlayed />
                    </motion.div>
                  );
                },
              )
            ) : (
              <span className="text-emerald-800/50 font-bold text-2xl uppercase tracking-widest">
                Mesa
              </span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="absolute bottom-52 left-1/2 -translate-x-1/2 z-20">
        <AnimatePresence>
          {(gameState?.allowedActions?.length ?? 0) > 0 &&
            !gameState?.allowedActions.includes(TrucAction.REPARTIR) && (
              <ActionButtons
                allowedActions={gameState!.allowedActions}
                onAction={sendAction}
              />
            )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM — MY HAND ── */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 p-3 rounded-2xl transition-all ${gameState?.turnoActual === playerId ? 'ring-2 ring-yellow-400 bg-emerald-800/50 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : ''}`}
      >
        {gameState?.manoOriginal === playerId && (
          <div
            title="mà de la partida"
            className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md z-30 mb-1"
          />
        )}
        <div className="flex gap-3">
          <AnimatePresence>
            {gameState?.hand?.map((card: Card) => (
              <CardComponent
                key={`hand-${card.suit}-${card.value}`}
                card={card}
                isPlayable={canPlayCard || canChooseTieBreaker}
                onClick={() =>
                  sendAction(
                    canChooseTieBreaker
                      ? TrucAction.ELEGIR_CARTA_DESEMPATE
                      : TrucAction.JUGAR_CARTA,
                    card,
                  )
                }
              />
            ))}
          </AnimatePresence>
        </div>
        {hasHand && (
          <p className="text-emerald-300 text-[10px] font-semibold uppercase tracking-widest opacity-70 mt-2 bg-emerald-950 px-2 py-1 rounded">
            {canChooseTieBreaker
              ? '🂠 Tria la carta descoberta'
              : gameState?.turnoActual === playerId
                ? '🟢 És el teu torn'
                : '🃏 Les teues cartes'}
          </p>
        )}
      </div>

      {/* ── ERROR SNACKBAR ── */}
      <Snackbar
        open={!!roomError}
        autoHideDuration={4000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={clearError}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {roomError}
        </Alert>
      </Snackbar>
    </div>
  );
};
