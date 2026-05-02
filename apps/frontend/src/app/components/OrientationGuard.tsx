import React from 'react';
import { useI18n } from '../i18n/useI18n';

export const OrientationGuard: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="orientation-guard fixed inset-0 z-[9999] flex-col items-center justify-center bg-emerald-950 text-white p-8 text-center">
      <div className="mb-6 animate-bounce">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>
      <h2 className="text-2xl font-black mb-4">
        {t('board.rotateDeviceTitle')}
      </h2>
      <p className="text-emerald-300 font-medium">
        {t('board.rotateDeviceText')}
      </p>
    </div>
  );
};
