import React from 'react';
import { motion } from 'framer-motion';
import { LanguageHeader } from '../components/LanguageHeader';
import { useI18n } from '../i18n/useI18n';

const sectionKeys = [
  'objective',
  'deck',
  'round',
  'truc',
  'envido',
  'hidden',
] as const;

const RulesPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-emerald-950 px-4 py-20 text-white">
      <LanguageHeader showRulesLink={false} showHomeLink />
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #10b981 0, #10b981 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #10b981 0, #10b981 1px, transparent 0, transparent 40px)',
        }}
      />
      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-300">
            {t('app.name')}
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight">
            {t('rules.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-100/85">
            {t('rules.intro')}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5">
          {sectionKeys.map((sectionKey, index) => (
            <motion.section
              key={sectionKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-3xl border border-emerald-700/60 bg-emerald-900/35 p-6 shadow-xl backdrop-blur-sm"
            >
              <h2 className="text-2xl font-black text-white">
                {t(`rules.${sectionKey}Title`)}
              </h2>
              <p className="mt-3 leading-7 text-emerald-100/90">
                {t(`rules.${sectionKey}Body`)}
              </p>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
