import { useContext } from 'react';
import { LanguageContext, type LanguageContextValue } from './LanguageProvider';

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used inside LanguageProvider');
  }

  return context;
}
