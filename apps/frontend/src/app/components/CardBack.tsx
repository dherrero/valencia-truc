import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
// import SpriteImage from '../../assets/Baraja_espanola_completa.png';

interface CardBackProps {
  className?: string;
  delay?: number;
}

export const CardBack: React.FC<CardBackProps> = ({ className, delay = 0 }) => {
  // Reverso en esquina inferior izquierda
  const posX = 0;
  const posY = 100;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      className={clsx(
        'w-24 h-36 sm:w-28 sm:h-44 md:w-32 md:h-48 rounded-lg md:rounded-xl shadow-xl bg-no-repeat cursor-default',
        className
      )}
      style={{
        // backgroundImage: `url(${SpriteImage})`,
        backgroundSize: '1200% 400%',
        backgroundPosition: `${posX}% ${posY}%`
      }}
    />
  );
};
