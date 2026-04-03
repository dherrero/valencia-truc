import React, { createContext, useEffect, useMemo, useState } from 'react';
import { Language, getTranslationValue, interpolate } from './translations';

const STORAGE_KEY = 'truc_language';

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'ca';
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'es' ? 'es' : 'ca';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => {
        const translated = getTranslationValue(language, key);
        if (typeof translated !== 'string') return key;
        return interpolate(translated, params);
      },
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
