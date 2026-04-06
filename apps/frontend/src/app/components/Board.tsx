import React, { useEffect } from 'react';
import { TrucAction, PlayerSeat } from '@valencia-truc/shared-interfaces';
import { Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { useTrucSocket } from '../hooks/useTrucSocket';
import { ActiveBetBanner } from './board/ActiveBetBanner';
import { ScoreBoard } from './board/ScoreBoard';
import { BazaTracker } from './BazaTracker';
import { GameLog } from './board/GameLog';
import { BoardConnectionState } from './board/BoardConnectionState';
import { BoardGameOverScreen } from './board/BoardGameOverScreen';
import { BoardLobbyScreen } from './board/BoardLobbyScreen';
import { BoardRoundSummaryModal } from './board/BoardRoundSummaryModal';
import { BoardRoomEndedScreen } from './board/BoardRoomEndedScreen';
import { BoardOpponentSeat } from './board/BoardOpponentSeat';
import { BoardSeat } from './board/BoardSeat';
import { BoardTable } from './board/BoardTable';
import { BoardActionArea } from './board/BoardActionArea';
import { BoardHand } from './board/BoardHand';

export const Board: React.FC<{
  roomUid: string;
  playerId: string;
  playerName: string;
}> = ({ roomUid, playerId, playerName }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    gameState,
    gameOver,
    sendAction,
    destroyRoom,
    sessionPhase,
    connectionStatus,
    roomError,
    clearError,
    roomNotice,
    roomDestroyed,
    clearRoomNotice,
  } = useTrucSocket(roomUid, playerId, playerName);

  useEffect(() => {
    if (roomDestroyed?.reason !== 'abandonment') return;

    const timeout = setTimeout(() => {
      navigate('/', {
        replace: true,
        state: { roomNotice: roomDestroyed.message },
      });
    }, 3500);

    return () => clearTimeout(timeout);
  }, [navigate, roomDestroyed]);

  const isLobby = sessionPhase === 'lobby';
  const canDeal =
    (gameState?.phase === 'lobby' || isLobby) &&
    (gameState?.totalPlayers ?? 0) === 4 &&
    (gameState?.allowedActions.includes(TrucAction.REPARTIR) ?? false);
  const canPlayCard =
    gameState?.allowedActions.includes(TrucAction.JUGAR_CARTA) ?? false;
  const roundSummary = gameState?.roundSummary;
  const roomNoticeMessage = roomNotice
    ? roomNotice.kind === 'player-disconnected'
      ? t('room.disconnected', {
          playerName: roomNotice.playerName,
          minutes: 5,
        })
      : t('room.reconnected', { playerName: roomNotice.playerName })
    : '';

  const topSeat = gameState?.otherPlayers?.find((p) => p.position === 'top');
  const rightSeat = gameState?.otherPlayers?.find(
    (p) => p.position === 'right',
  );
  const leftSeat = gameState?.otherPlayers?.find((p) => p.position === 'left');

  if (roomDestroyed?.reason === 'abandonment') {
    return (
      <BoardRoomEndedScreen
        message={roomDestroyed.message}
        onReturnHome={() =>
          navigate('/', {
            replace: true,
            state: { roomNotice: roomDestroyed.message },
          })
        }
      />
    );
  }

  if (!gameOver && connectionStatus !== 'connected') {
    return <BoardConnectionState status={connectionStatus} />;
  }

  if (isLobby) {
    return (
      <BoardLobbyScreen
        canDeal={canDeal}
        onDeal={() => sendAction(TrucAction.REPARTIR)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-emerald-900 overflow-hidden select-none">
      <div className="absolute top-4 left-4 z-30 flex items-start gap-3">
        <ScoreBoard
          score={gameState?.score || { equipo1: 0, equipo2: 0 }}
          myTeam={gameState?.myTeam ?? 'equipo1'}
        />
        <BazaTracker
          results={gameState?.bazaResults ?? []}
          myTeam={gameState?.myTeam ?? 'equipo1'}
        />
      </div>

      <ActiveBetBanner activeBet={gameState?.activeBet} />

      <GameLog entries={gameState?.actionLog ?? []} playerId={playerId} />

      {!gameOver && roundSummary && (
        <BoardRoundSummaryModal
          roundSummary={roundSummary}
          canDeal={canDeal}
          onNextRound={() => sendAction(TrucAction.REPARTIR)}
        />
      )}

      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        {topSeat && (
          <BoardSeat
            seat={topSeat as PlayerSeat}
            isTurn={gameState?.turnoActual === topSeat.playerId}
            isMano={gameState?.manoOriginal === topSeat.playerId}
          />
        )}
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {leftSeat && (
          <BoardOpponentSeat
            seat={leftSeat as PlayerSeat}
            isTurn={gameState?.turnoActual === leftSeat.playerId}
            isMano={gameState?.manoOriginal === leftSeat.playerId}
          />
        )}
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {rightSeat && (
          <BoardOpponentSeat
            seat={rightSeat as PlayerSeat}
            isTurn={gameState?.turnoActual === rightSeat.playerId}
            isMano={gameState?.manoOriginal === rightSeat.playerId}
          />
        )}
      </div>

      <BoardTable cards={gameState?.cartasEnMesa ?? []} />

      <BoardActionArea
        allowedActions={gameState?.allowedActions ?? []}
        onAction={sendAction}
      />

      <BoardHand
        hand={gameState?.hand ?? []}
        playerId={playerId}
        manoOriginal={gameState?.manoOriginal}
        turnPlayerId={gameState?.turnoActual}
        canPlayCard={canPlayCard}
        onCardPlay={sendAction}
      />

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

      <Snackbar
        open={!!roomNotice}
        autoHideDuration={6000}
        onClose={clearRoomNotice}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={clearRoomNotice}
          severity={
            roomNotice?.kind === 'player-disconnected' ? 'warning' : 'success'
          }
          variant="filled"
          sx={{ width: '100%' }}
        >
          {roomNoticeMessage}
        </Alert>
      </Snackbar>

      {roomNotice?.kind === 'player-disconnected' && (
        <div className="absolute top-20 left-1/2 z-40 -translate-x-1/2 w-[min(92vw,42rem)]">
          <Alert severity="warning" variant="filled">
            {roomNoticeMessage}
          </Alert>
        </div>
      )}

      {gameOver && (
        <BoardGameOverScreen
          winner={gameOver.ganador}
          score={gameOver.score}
          roundSummary={gameOver.summary}
          onNewGame={async () => {
            try {
              await destroyRoom();
              navigate('/', { replace: true });
            } catch {
              /* error already surfaced */
            }
          }}
        />
      )}
    </div>
  );
};

export default Board;
