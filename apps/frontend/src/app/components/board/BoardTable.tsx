import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card as CardComponent } from '../Card';
import { Card } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/useI18n';

interface BoardTableProps {
  cards: Array<{ jugadorId: string; carta: Card }>;
}

export const BoardTable: React.FC<BoardTableProps> = ({ cards }) => {
  const { t } = useI18n();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-72 h-44 md:w-96 md:h-56 border-2 border-emerald-700/40 rounded-[40%] flex items-center justify-center bg-emerald-800/20 backdrop-blur-sm shadow-inner shadow-black/30">
        <AnimatePresence>
          {cards.length > 0 ? (
            cards.map(({ carta }, idx: number) => (
              <motion.div
                key={`board-${carta.suit}-${carta.value}-${idx}`}
                initial={{ scale: 0, opacity: 0, rotate: -30 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: idx * 35 - 45,
                  y: idx * 5 - 10,
                  rotate: idx * 12 - 18,
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
            ))
          ) : (
            <span className="text-emerald-800/50 font-bold text-2xl uppercase tracking-widest">
              {t('board.table')}
            </span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
