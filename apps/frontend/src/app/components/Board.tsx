import React from 'react';
import { TrucAction, PlayerSeat } from '@valencia-truc/shared-interfaces';
import { Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTrucSocket } from '../hooks/useTrucSocket';
import { ActiveBetBanner } from './board/ActiveBetBanner';
import { ScoreBoard } from './board/ScoreBoard';
import { BazaTracker } from './BazaTracker';
import { GameLog } from './board/GameLog';
import { BoardConnectionState } from './board/BoardConnectionState';
import { BoardGameOverScreen } from './board/BoardGameOverScreen';
import { BoardLobbyScreen } from './board/BoardLobbyScreen';
import { BoardRoundSummaryModal } from './board/BoardRoundSummaryModal';
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
  const {
    gameState,
    gameOver,
    sendAction,
    destroyRoom,
    sessionPhase,
    connectionStatus,
    roomError,
    clearError,
  } = useTrucSocket(roomUid, playerId, playerName);

  const isLobby = sessionPhase === 'lobby';
  const canDeal =
    (gameState?.phase === 'lobby' || isLobby) &&
    (gameState?.totalPlayers ?? 0) === 4 &&
    (gameState?.allowedActions.includes(TrucAction.REPARTIR) ?? false);
  const canPlayCard =
    gameState?.allowedActions.includes(TrucAction.JUGAR_CARTA) ?? false;
  const roundSummary = gameState?.roundSummary;

  const topSeat = gameState?.otherPlayers?.find((p) => p.position === 'top');
  const rightSeat = gameState?.otherPlayers?.find(
    (p) => p.position === 'right',
  );
  const leftSeat = gameState?.otherPlayers?.find((p) => p.position === 'left');

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
