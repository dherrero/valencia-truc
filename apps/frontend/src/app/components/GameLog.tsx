import React, { useState } from 'react';
import { ActionLogEntry } from '@valencia-truc/shared-interfaces';

interface GameLogProps {
  entries: ActionLogEntry[];
  playerId: string;
}

function getActorLabel(
  entryPlayerId: string | undefined,
  currentPlayerId: string,
) {
  if (!entryPlayerId) return 'La taula';
  if (entryPlayerId === currentPlayerId) return 'Tu';
  if (entryPlayerId.startsWith('bot-')) return 'Bot';
  return 'Jugador';
}

function formatEntry(entry: ActionLogEntry, currentPlayerId: string) {
  const actor = getActorLabel(entry.jugadorId, currentPlayerId);

  switch (entry.type) {
    case 'REPARTIR':
      return 'Nova ronda repartida';
    case 'TRUC':
      return `${actor} canta truc`;
    case 'RETRUC':
      return `${actor} canta retruc`;
    case 'VALE_QUATRE':
      return `${actor} canta vale quatre`;
    case 'JUEGO_FUERA':
      return `${actor} canta joc fora`;
    case 'ENVIDO':
      return `${actor} canta envido`;
    case 'TORNA_CHO':
      return `${actor} diu torna-cho`;
    case 'QUIERO':
      return `${actor} diu quiero`;
    case 'NO_QUIERO':
      return `${actor} no vol`;
    case 'JUGAR_CARTA':
      return `${actor} tira carta`;
    case 'ELEGIR_CARTA_DESEMPATE':
      return `${actor} tria descoberta`;
    default:
      return entry.type;
  }
}

export const GameLog: React.FC<GameLogProps> = ({ entries, playerId }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const visibleEntries = entries.slice(-6).reverse();

  if (visibleEntries.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-2xl border border-emerald-700/60 bg-emerald-950/90 p-3 shadow-2xl backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsCollapsed((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Historial
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500">
            Ultimes 6
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            {visibleEntries.length}
          </span>
          <span className="text-lg font-black text-emerald-200">
            {isCollapsed ? '+' : '-'}
          </span>
        </div>
      </button>
      {!isCollapsed && (
        <div className="mt-3 flex flex-col gap-2">
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-emerald-800/80 bg-black/20 px-3 py-2 text-sm font-medium text-emerald-50"
            >
              {formatEntry(entry, playerId)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
