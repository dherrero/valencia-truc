import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { TrucAction } from '@valencia-truc/shared-interfaces';
import { ActionButtons } from './ActionButtons';

interface BoardActionAreaProps {
  allowedActions: TrucAction[];
  onAction: (action: TrucAction, payload?: unknown) => void;
}

export const BoardActionArea: React.FC<BoardActionAreaProps> = ({
  allowedActions,
  onAction,
}) => {
  return (
    <div className="absolute bottom-6 left-4 z-20 max-w-[min(420px,calc(100vw-2rem))]">
      <AnimatePresence>
        {(allowedActions.length > 0 &&
          !allowedActions.includes(TrucAction.REPARTIR) && (
            <ActionButtons
              allowedActions={allowedActions}
              onAction={onAction}
            />
          )) ||
          null}
      </AnimatePresence>
    </div>
  );
};
