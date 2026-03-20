import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardBackProps {
  className?: string;
  delay?: number;
}

export const CardBack: React.FC<CardBackProps> = ({ className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      className={clsx(
        'card-reverso shadow-xl cursor-default flex-shrink-0',
        className
      )}
    />
  );
};
