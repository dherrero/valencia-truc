import React from 'react';
import { useI18n } from '../../i18n/useI18n';

interface ScoreBoardProps {
  score: { equipo1: number; equipo2: number };
  myTeam: 'equipo1' | 'equipo2';
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, myTeam }) => {
  const { t } = useI18n();
  const rivalTeam = myTeam === 'equipo1' ? 'equipo2' : 'equipo1';

  const safeScore = {
    equipo1: score.equipo1 || 0,
    equipo2: score.equipo2 || 0,
  };

  return (
    <div className="min-w-[180px] bg-black/45 p-3 rounded-xl shadow-2xl backdrop-blur-md border border-emerald-700/50">
      <h3 className="text-emerald-400 text-center font-bold mb-3 uppercase tracking-[0.2em] text-[11px] border-b border-emerald-700/70 pb-2">
        {t('scoreboard.title')}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-emerald-200 text-[11px] font-semibold mb-1 uppercase tracking-wide">
            {t('scoreboard.rival')}
          </div>
          <div className="text-3xl font-black text-yellow-400 leading-none drop-shadow-md">
            {safeScore[rivalTeam]}
          </div>
        </div>
        <div className="text-center">
          <div className="text-emerald-200 text-[11px] font-semibold mb-1 uppercase tracking-wide">
            {t('scoreboard.us')}
          </div>
          <div className="text-3xl font-black text-yellow-400 leading-none drop-shadow-md">
            {safeScore[myTeam]}
          </div>
        </div>
      </div>
    </div>
  );
};
