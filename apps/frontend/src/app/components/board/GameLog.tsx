import React, { useState } from 'react';
import { ActionLogEntry } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/useI18n';

interface GameLogProps {
  entries: ActionLogEntry[];
  playerId: string;
}

function getActorLabel(
  entryPlayerId: string | undefined,
  currentPlayerId: string,
  translate: (key: string, params?: Record<string, string | number>) => string,
) {
  if (!entryPlayerId) return translate('log.table');
  if (entryPlayerId === currentPlayerId) return translate('log.you');
  if (entryPlayerId.startsWith('bot-')) return translate('log.bot');
  return translate('log.player');
}

function formatEntry(
  entry: ActionLogEntry,
  currentPlayerId: string,
  translate: (key: string, params?: Record<string, string | number>) => string,
) {
  const actor = getActorLabel(entry.jugadorId, currentPlayerId, translate);

  switch (entry.type) {
    case 'REPARTIR':
      return translate('log.deal');
    case 'TRUC':
      return translate('log.truc', { actor });
    case 'RETRUC':
      return translate('log.retruc', { actor });
    case 'VALE_QUATRE':
      return translate('log.valeQuatre', { actor });
    case 'JUEGO_FUERA':
      return translate('log.juegoFuera', { actor });
    case 'ENVIDO':
      return translate('log.envido', { actor });
    case 'TORNA_CHO':
      return translate('log.tornaCho', { actor });
    case 'QUIERO':
      return translate('log.quiero', { actor });
    case 'NO_QUIERO':
      return translate('log.noQuiero', { actor });
    case 'JUGAR_CARTA':
      return translate('log.playCard', { actor });
    default:
      return entry.type;
  }
}

export const GameLog: React.FC<GameLogProps> = ({ entries, playerId }) => {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const visibleEntries = entries.slice(-6).reverse();

  if (visibleEntries.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-2xl border border-emerald-700/60 bg-emerald-950/90 p-3 shadow-2xl backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsCollapsed((current) => !current)}
        data-qa="game-log-toggle-button"
        className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            {t('log.title')}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500">
            {t('log.latest')}
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
              {formatEntry(entry, playerId, t)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
