import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Card as CardType } from '@valencia-truc/shared-interfaces';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isPlayed?: boolean;
  className?: string;
  onClick?: () => void;
}

// Maps card value + suit to the CSS sprite class defined in styles.css
function getCardSpriteClass(card: CardType): string {
  const suit = card.suit.toLowerCase(); // 'oros' | 'copas' | 'espadas' | 'bastos'
  return `card-sprite card-${card.value}-${suit}`;
}

export const Card: React.FC<CardProps> = ({
  card,
  isPlayable = false,
  isPlayed = false,
  className,
  onClick,
}) => {
  const spriteClass = getCardSpriteClass(card);

  return (
    <motion.div
      onClick={isPlayable ? onClick : undefined}
      data-qa={`hand-card-${card.suit.toLowerCase()}-${card.value}`}
      data-qa-playable={isPlayable ? 'true' : 'false'}
      initial={isPlayed ? false : { y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1, scale: isPlayed ? 1 : 1.1 }}
      whileHover={isPlayable ? { scale: 1.2, y: -14 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={clsx(
        spriteClass,
        'shadow-xl cursor-default flex-shrink-0',
        isPlayable &&
          'cursor-pointer hover:shadow-2xl ring-2 ring-transparent hover:ring-blue-400 transition-all',
        isPlayed && 'opacity-70',
        className,
      )}
    />
  );
};
