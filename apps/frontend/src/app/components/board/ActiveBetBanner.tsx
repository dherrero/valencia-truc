import React from 'react';
import { ActiveBetState } from '@valencia-truc/shared-interfaces';
import { useI18n } from '../../i18n/useI18n';

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
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-40">
      {/* Desktop: full card */}
      <div className={`hidden sm:block min-w-56 rounded-2xl border px-4 py-3 text-center shadow-xl backdrop-blur-sm ${palette}`}>
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

      {/* Mobile: compact chip */}
      <div className={`sm:hidden rounded-xl border px-2 py-1 text-center shadow-lg backdrop-blur-sm ${palette}`}>
        <p className="text-xs font-black uppercase leading-tight">{translatedLabel}</p>
        <p className="text-[10px] opacity-80">
          {activeBet.points === 24
            ? t('activeBet.fullGame')
            : `${activeBet.points} ${t('activeBet.stones')}`}
        </p>
      </div>
    </div>
  );
};
