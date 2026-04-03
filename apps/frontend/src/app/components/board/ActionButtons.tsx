import React from 'react';
import { TrucAction } from '@valencia-truc/shared-interfaces';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useI18n } from '../../i18n/LanguageProvider';

interface ActionButtonsProps {
  allowedActions: TrucAction[];
  onAction: (action: TrucAction) => void;
}

const actionConfig: Partial<
  Record<TrucAction, { labelKey: string; color: string }>
> = {
  [TrucAction.REPARTIR]: {
    labelKey: 'actions.repartir',
    color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  [TrucAction.TRUC]: {
    labelKey: 'actions.truc',
    color: 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900',
  },
  [TrucAction.RETRUC]: {
    labelKey: 'actions.retruc',
    color: 'bg-orange-500 hover:bg-orange-600 text-orange-900',
  },
  [TrucAction.VALE_QUATRE]: {
    labelKey: 'actions.valeQuatre',
    color: 'bg-red-600 hover:bg-red-700 text-white',
  },
  [TrucAction.JUEGO_FUERA]: {
    labelKey: 'actions.juegoFuera',
    color: 'bg-fuchsia-700 hover:bg-fuchsia-800 text-white',
  },
  [TrucAction.ENVIDO]: {
    labelKey: 'actions.envido',
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  [TrucAction.TORNA_CHO]: {
    labelKey: 'actions.tornaCho',
    color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
  },
  [TrucAction.QUIERO]: {
    labelKey: 'actions.quiero',
    color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
  [TrucAction.NO_QUIERO]: {
    labelKey: 'actions.noQuiero',
    color: 'bg-gray-500 hover:bg-gray-600 text-white',
  },
  [TrucAction.JUGAR_CARTA]: { labelKey: 'actions.repartir', color: '' },
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  allowedActions,
  onAction,
}) => {
  const { t } = useI18n();
  const buttonsToRender = allowedActions.filter(
    (a) => a !== TrucAction.JUGAR_CARTA,
  );

  if (buttonsToRender.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="flex flex-wrap gap-3 justify-start items-center p-4 bg-black/40 rounded-2xl backdrop-blur-sm"
    >
      {buttonsToRender.map((action) => {
        const config = actionConfig[action];
        if (!config) return null;
        return (
          <button
            key={action}
            onClick={() => onAction(action)}
            className={clsx(
              'px-6 py-3 rounded-full font-bold text-lg border-2 border-transparent transition-all shadow-lg',
              'hover:scale-105 active:scale-95',
              config.color,
            )}
          >
            {t(config.labelKey)}
          </button>
        );
      })}
    </motion.div>
  );
};
