import React, { useEffect, useState, useRef } from 'react';
import { TrucAction } from '@valencia-truc/shared-interfaces';
import { motion, AnimatePresence } from 'framer-motion';

interface GameLogProps {
  lastAction?: { type: TrucAction, jugadorId: string };
}

// Translations to typical Valencian phrases
const valencianPhrases: Record<string, string[]> = {
  [TrucAction.TRUC]: [
    '¡El rival et busca les puces, ha cantat TRUC!',
    '¡Pareix que té joc, canta TRUC!',
  ],
  [TrucAction.RETRUC]: [
    '¡Açò s\'anima! ¡RETRUC a la vista!',
    '¡Diu que RETRUC! ¿Què fas, vols o no vols?',
  ],
  [TrucAction.VALE_QUATRE]: [
    '¡VALE QUATRE! ¡Mare meua, quina tensió!',
  ],
  [TrucAction.ENVIDO]: [
    '¡Ha llançat l\'ENVIDO! A vore qui té més pedra.',
    '¡ENVIDO cantat! ¿Tens bones cartes per a l\'envit?',
  ],
  [TrucAction.QUIERO]: [
    '¡Ha dit que VOL! Anem a vore eixes cartes.',
    '¡Valents al front! Ha acceptat (QUIERO).'
  ],
  [TrucAction.NO_QUIERO]: [
    '¡S\'ha acovardit! NO VOL.',
    '¡Fuig d\'estudi! Ha dit que NO QUIERO.'
  ],
  [TrucAction.JUGAR_CARTA]: [
    'Tira carta a la taula.',
  ]
};

export const GameLog: React.FC<GameLogProps> = ({ lastAction }) => {
  const [logs, setLogs] = useState<{ id: number, text: string }[]>([]);
  const logCounter = useRef(0);

  useEffect(() => {
    if (lastAction && lastAction.type !== TrucAction.JUGAR_CARTA) {
      const phrases = valencianPhrases[lastAction.type];
      const text = phrases ? phrases[Math.floor(Math.random() * phrases.length)] : `Acción: ${lastAction.type}`;
      
      setLogs(prev => [...prev.slice(-4), { id: logCounter.current++, text }]);
    }
  }, [lastAction]);

  return (
    <div className="absolute top-4 right-4 w-64 flex flex-col items-end gap-2 pointer-events-none z-50">
      <AnimatePresence>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className="bg-yellow-100 text-yellow-900 px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-400 font-bold text-sm text-right"
          >
            {log.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
