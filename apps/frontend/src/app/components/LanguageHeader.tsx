import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageProvider';

interface LanguageHeaderProps {
  showRulesLink?: boolean;
  showHomeLink?: boolean;
}

export const LanguageHeader: React.FC<LanguageHeaderProps> = ({
  showRulesLink = true,
  showHomeLink = false,
}) => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-700/70 bg-emerald-950/90 px-3 py-2 text-white shadow-xl backdrop-blur-sm">
      <div className="pr-2 text-right">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
          {t('header.language')}
        </p>
        <p className="text-xs font-semibold text-emerald-100">
          {language === 'ca' ? t('header.valencian') : t('header.spanish')}
        </p>
      </div>
      <div className="flex overflow-hidden rounded-xl border border-emerald-700">
        <button
          type="button"
          onClick={() => setLanguage('ca')}
          className={`px-3 py-2 text-xs font-black uppercase tracking-[0.18em] ${language === 'ca' ? 'bg-emerald-500 text-white' : 'bg-transparent text-emerald-200'}`}
        >
          VAL
        </button>
        <button
          type="button"
          onClick={() => setLanguage('es')}
          className={`px-3 py-2 text-xs font-black uppercase tracking-[0.18em] ${language === 'es' ? 'bg-emerald-500 text-white' : 'bg-transparent text-emerald-200'}`}
        >
          ES
        </button>
      </div>
      {showRulesLink && (
        <Link
          to="/reglas"
          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100 transition-colors hover:bg-white/20"
        >
          {t('header.rules')}
        </Link>
      )}
      {showHomeLink && (
        <Link
          to="/"
          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100 transition-colors hover:bg-white/20"
        >
          {t('header.home')}
        </Link>
      )}
    </div>
  );
};
