import React from 'react';
import { useI18n } from '../../i18n/LanguageProvider';

interface BoardConnectionStateProps {
  status: 'connecting' | 'disconnected' | 'error';
}

export const BoardConnectionState: React.FC<BoardConnectionStateProps> = ({
  status,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-center w-full h-screen bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-2xl font-bold text-emerald-300">
          {status === 'connecting'
            ? t('board.connecting')
            : t('board.disconnected')}
        </div>
      </div>
    </div>
  );
};
