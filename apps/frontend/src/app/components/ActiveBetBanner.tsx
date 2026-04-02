import React from 'react';
import { ActiveBetState } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../i18n/LanguageProvider';

interface ActiveBetBannerProps {
  activeBet?: ActiveBetState;
}

export const ActiveBetBanner: React.FC<ActiveBetBannerProps> = ({
  activeBet,
}) => {
  const { t } = useI18n();
  if (!activeBet) return null;

  const translatedLabel =
    activeBet.label === 'Envido'
      ? t('activeBet.envido')
      : activeBet.label === 'Torna-cho'
        ? t('activeBet.tornaCho')
        : activeBet.label === 'Truc'
          ? t('activeBet.truc')
          : activeBet.label === 'Retruc'
            ? t('activeBet.retruc')
            : activeBet.label === 'Vale quatre'
              ? t('activeBet.valeQuatre')
              : activeBet.label === 'Joc fora'
                ? t('activeBet.juegoFuera')
                : activeBet.label;

  const palette =
    activeBet.family === 'truc'
      ? 'border-amber-400/70 bg-amber-500/15 text-amber-100'
      : 'border-sky-400/70 bg-sky-500/15 text-sky-100';

  return (
    <div className="fixed top-4 right-4 z-40">
      <div
        className={`min-w-56 rounded-2xl border px-4 py-3 text-center shadow-xl backdrop-blur-sm ${palette}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-80">
          {t('activeBet.title')}
        </p>
        <p className="mt-1 text-xl font-black uppercase">{translatedLabel}</p>
        <p className="text-sm font-semibold opacity-90">
          {activeBet.points === 24
            ? t('activeBet.fullGame')
            : `${activeBet.points} ${t('activeBet.stones')}`}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] opacity-75">
          {activeBet.waitingResponse
            ? t('activeBet.waiting')
            : t('activeBet.active')}
        </p>
      </div>
    </div>
  );
};
