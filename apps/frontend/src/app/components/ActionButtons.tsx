import React from 'react';
import { TrucAction } from '@valencia-truc/shared-interfaces';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ActionButtonsProps {
  allowedActions: TrucAction[];
  onAction: (action: TrucAction) => void;
}

const actionConfig: Record<TrucAction, { label: string; color: string }> = {
  [TrucAction.TRUC]: { label: '¡Truco!', color: 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900' },
  [TrucAction.RETRUC]: { label: '¡Retruco!', color: 'bg-orange-500 hover:bg-orange-600 text-orange-900' },
  [TrucAction.VALE_QUATRE]: { label: '¡Vale Quatre!', color: 'bg-red-600 hover:bg-red-700 text-white' },
  [TrucAction.ENVIDO]: { label: '¡Envido!', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  [TrucAction.TORNA_CHO]: { label: '¡Torna-cho!', color: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
  [TrucAction.QUIERO]: { label: '¡Quiero!', color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  [TrucAction.NO_QUIERO]: { label: 'No quiero', color: 'bg-gray-500 hover:bg-gray-600 text-white' },
  [TrucAction.JUGAR_CARTA]: { label: 'Jugar Carta', color: '' } // Not rendered as a button usually
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ allowedActions, onAction }) => {
  const buttonsToRender = allowedActions.filter(a => a !== TrucAction.JUGAR_CARTA);

  if (buttonsToRender.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="flex flex-wrap gap-4 justify-center items-center p-4 bg-black/40 rounded-2xl backdrop-blur-sm"
    >
      {buttonsToRender.map((action) => {
        const config = actionConfig[action];
        return (
          <button
            key={action}
            onClick={() => onAction(action)}
            className={clsx(
              'px-6 py-3 rounded-full font-bold text-lg border-2 border-transparent transition-all shadow-lg',
              'hover:scale-105 active:scale-95',
              config.color
            )}
          >
            {config.label}
          </button>
        );
      })}
    </motion.div>
  );
};
