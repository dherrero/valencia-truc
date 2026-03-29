import React from 'react';

interface ScoreBoardProps {
  score: { equipo1: number; equipo2: number };
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score }) => {
  const renderPoints = (points: number) => {
    // Helper to visually represent points (Galls = 5, Trucos = 1)
    const galls = Math.floor((points % 30) / 5);
    const trucos = (points % 30) % 5;
    return (
      <div className="flex flex-col items-center">
        <div className="text-yellow-400 font-bold">
          {Array.from({ length: galls }).map((_, i) => (
            <span key={`gall-${i}`} className="mr-1 text-2xl">|/|\|</span>
          ))}
        </div>
        <div className="text-white font-bold">
          {Array.from({ length: trucos }).map((_, i) => (
            <span key={`truco-${i}`} className="mr-1 text-xl">|</span>
          ))}
        </div>
        <div className="text-sm text-gray-300">({points} pts)</div>
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
