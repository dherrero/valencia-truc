import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Card as CardType } from '@valencia-truc/shared-interfaces';
// Import absolute from src/assets
// import SpriteImage from '../../assets/Baraja_espanola_completa.png';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isPlayed?: boolean;
  className?: string;
  onClick?: () => void;
}

const suitRowMap: Record<string, number> = {
  // Ajustar el orden si la imagen difiere. Asumimos: Oros, Copas, Espadas, Bastos
  Oros: 0,
  Copas: 1,
  Espadas: 2,
  Bastos: 3
};

export const Card: React.FC<CardProps> = ({ card, isPlayable = false, isPlayed = false, className, onClick }) => {
  // Valor de la carta (1 al 12)
  // Truc usa valores específicos: 1, 3, 4, 5, 6, 7. Las columnas son 12 (índice 0 al 11)
  const colIndex = card.value - 1;
  const rowIndex = suitRowMap[card.suit];

  // background-position CSS funciona en porcentajes: (x / (total_cols - 1)) * 100
  // Total columnas: 12. Huecos (gaps): 11.
  const posX = colIndex * (100 / 11);
  // Total filas 4. Huecos: 3.
  const posY = rowIndex * (100 / 3);

  return (
    <motion.div
      onClick={isPlayable ? onClick : undefined}
      initial={isPlayed ? false : { y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1, scale: isPlayed ? 1 : 1.1 }}
      whileHover={isPlayable ? { scale: 1.15, y: -10 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={clsx(
        'w-24 h-36 sm:w-28 sm:h-44 md:w-32 md:h-48 rounded-lg md:rounded-xl shadow-xl bg-no-repeat cursor-default',
        isPlayable && 'cursor-pointer hover:shadow-2xl ring-4 ring-transparent hover:ring-blue-400 transition-all',
        className
      )}
      style={{
        // backgroundImage: `url(${SpriteImage})`,
        backgroundSize: '1200% 400%', // 12 cols, 4 filas
        backgroundPosition: `${posX}% ${posY}%`
      }}
    />
  );
};
