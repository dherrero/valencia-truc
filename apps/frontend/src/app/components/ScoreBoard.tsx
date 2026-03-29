import React from 'react';

interface ScoreBoardProps {
  score: { equipo1: number; equipo2: number };
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score }) => {
  const renderPoints = (points: number) => {
    return (
      <div className="flex flex-col items-center mt-1 mb-2">
        <div className="text-4xl font-black text-yellow-400 drop-shadow-md">
          {points}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black/50 p-4 rounded-xl shadow-2xl backdrop-blur-md border border-emerald-700/50">
      <h3 className="text-emerald-400 text-center font-bold mb-4 uppercase tracking-widest text-sm border-b border-emerald-700 pb-2">
        Cama Actual
      </h3>
      
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="text-emerald-200 text-xs font-semibold mb-1">Rival</div>
          {renderPoints(score.equipo2 || 0)}
        </div>

        <div className="w-full h-px bg-emerald-800/50"></div>

        <div className="text-center">
          <div className="text-emerald-200 text-xs font-semibold mb-1">Nosotros</div>
          {renderPoints(score.equipo1 || 0)}
        </div>
      </div>
    </div>
  );
};
