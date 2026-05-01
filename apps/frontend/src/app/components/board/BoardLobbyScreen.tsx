import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CardBack } from '../CardBack';
import { useI18n } from '../../i18n/useI18n';

interface BoardLobbyScreenProps {
  canDeal: boolean;
  onDeal: () => void;
  roomUid: string;
  playerCount?: number;
}

export const BoardLobbyScreen: React.FC<BoardLobbyScreenProps> = ({
  canDeal,
  onDeal,
  roomUid,
  playerCount = 1,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/partida/${roomUid}`;

  const handleShare = async () => {
    // Native share sheet on mobile (Android/iOS)
    if (navigator.share) {
      try {
        await navigator.share({ url: inviteUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Clipboard API (HTTPS / desktop)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // fall through
      }
    }

    // execCommand fallback (HTTP or older browsers)
    const ta = document.createElement('textarea');
    ta.value = inviteUrl;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      document.body.removeChild(ta);
    }
  };

  return (
    <div
      className="flex items-center justify-center w-full h-screen bg-emerald-950 text-white overflow-hidden"
      data-qa="board-lobby-screen"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #064e3b 0, #064e3b 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-8 text-center"
      >
        <h1
          className="text-6xl font-black tracking-tight"
          style={{ textShadow: '0 0 30px rgba(52,211,153,0.5)' }}
        >
          <span role="img" aria-label="cartes">
            🃏
          </span>{' '}
          {t('app.name')}
        </h1>
        <div className="flex gap-4">
          {[0, 0.05, 0.1].map((_, i) => (
            <motion.div
              key={i}
              initial={{ rotate: (i - 1) * 8, y: 20, opacity: 0 }}
              animate={{ rotate: (i - 1) * 8, y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              <CardBack />
            </motion.div>
          ))}
        </div>

        {canDeal ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDeal}
            data-qa="board-deal-button"
            className="mt-4 px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-2xl shadow-2xl transition-colors"
            style={{ boxShadow: '0 0 40px rgba(52,211,153,0.4)' }}
          >
            {t('board.dealCards')}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-emerald-400 animate-pulse text-lg font-semibold">
              {t('board.waitingPlayers')}
            </p>
            <div className="flex gap-2 text-emerald-600 text-sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 ${
                    i < playerCount
                      ? 'bg-emerald-400 border-emerald-400'
                      : 'bg-transparent border-emerald-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-emerald-600 text-sm">
              {playerCount}/4 {t('board.playersConnected')}
            </p>

            <div className="mt-2 flex flex-col items-center gap-2 w-full max-w-sm">
              <p className="text-emerald-500 text-xs uppercase tracking-widest">
                {t('board.inviteLink')}
              </p>
              <div className="flex items-center gap-2 w-full bg-emerald-900/60 rounded-xl px-3 py-2 border border-emerald-700">
                <span className="text-emerald-300 text-xs truncate flex-1 font-mono">
                  {inviteUrl}
                </span>
                <button
                  onClick={handleShare}
                  className="shrink-0 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  {copied ? t('board.linkCopied') : t('board.copyLink')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
