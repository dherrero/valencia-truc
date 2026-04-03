import React from 'react';
import { useI18n } from '../../i18n/LanguageProvider';

interface HomeHeaderProps {
  connected: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ connected }) => {
  const { t } = useI18n();

  return (
    <div className="text-center mb-12">
      <h1
        className="text-6xl font-black mb-2"
        style={{ textShadow: '0 0 40px rgba(52,211,153,0.4)' }}
      >
        <span role="img" aria-label="Cartes">
          🃏
        </span>{' '}
        {t('app.name')}
      </h1>
      <p className="text-emerald-400">
        {connected ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            {t('home.connected')}
          </span>
        ) : (
          <span className="text-red-400">{t('home.connecting')}</span>
        )}
      </p>
    </div>
  );
};
