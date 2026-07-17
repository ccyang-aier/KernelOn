'use client';

import { LockKeyhole, Users, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, type MouseEvent } from 'react';

import { pokerAssetRoot } from './data';
import type { PokerNotice } from './usePokerLobbyController';

interface PokerFeedbackLayerProps {
  joinTarget: string | null;
  notice: PokerNotice;
  onCancelJoin(): void;
  onConfirmJoin(): void;
}

export function PokerLobbyFeedbackLayer({
  joinTarget,
  notice,
  onCancelJoin,
  onConfirmJoin,
}: PokerFeedbackLayerProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!joinTarget) {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancelJoin();
      }
    };

    globalThis.window?.addEventListener('keydown', closeOnEscape);
    return () => globalThis.window?.removeEventListener('keydown', closeOnEscape);
  }, [joinTarget, onCancelJoin]);

  return (
    <>
      <AnimatePresence>
        {joinTarget ? (
          <JoinDialog
            reducedMotion={Boolean(reducedMotion)}
            onCancel={onCancelJoin}
            onConfirm={onConfirmJoin}
            target={joinTarget}
          />
        ) : null}
      </AnimatePresence>
      {notice ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          aria-live="polite"
          className="pointer-events-none absolute bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-[#806634]/70 bg-[#131715]/96 px-5 py-2.5 text-[13px] font-semibold text-[#efe3c7] shadow-[0_14px_38px_rgba(0,0,0,0.52)]"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          key={notice.id}
          role="status"
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {notice.message}
        </motion.div>
      ) : null}
    </>
  );
}

function JoinDialog({
  onCancel,
  onConfirm,
  reducedMotion,
  target,
}: Readonly<{
  onCancel(): void;
  onConfirm(): void;
  reducedMotion: boolean;
  target: string;
}>) {
  function stopPropagation(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-label="确认入座"
      aria-modal="true"
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/64 backdrop-blur-[4px]"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onCancel}
      role="dialog"
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-[420px] overflow-hidden rounded-[16px] border border-[#8d6e35] bg-[linear-gradient(160deg,#1d211d,#101310)] p-6 text-[#e9dfc9] shadow-[0_28px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)]"
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={stopPropagation}
        transition={{
          damping: 26,
          duration: reducedMotion ? 0 : undefined,
          stiffness: 300,
          type: reducedMotion ? 'tween' : 'spring',
        }}
      >
        <button
          aria-label="关闭确认入座"
          autoFocus
          className="absolute right-4 top-4 text-[#8f8c82] transition hover:rotate-90 hover:text-[#e7dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/65"
          onClick={onCancel}
          type="button"
        >
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-4">
          <img
            alt="牌桌徽章"
            className="size-16 rounded-[12px] object-cover mix-blend-screen ring-1 ring-[#8c6e35]"
            src={`${pokerAssetRoot}/brand-crest.webp`}
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#ad8d4d]">
              SEAT RESERVED
            </p>
            <h2 className="mt-1 text-[22px] font-bold">确认入座</h2>
          </div>
        </div>
        <div className="mt-5 rounded-[10px] border border-[#3e382d] bg-black/20 p-4">
          <strong className="block text-[16px] text-[#e6cb8d]">{target}</strong>
          <div className="mt-3 flex items-center gap-6 text-xs text-[#98958b]">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" /> 6 / 9
            </span>
            <span className="flex items-center gap-1.5">
              <LockKeyhole className="size-4" /> 公平牌局
            </span>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <motion.button
            className="h-11 flex-1 rounded-[8px] border border-[#514b3f] bg-[#181b18] text-sm font-semibold text-[#b3afa3] transition-colors hover:border-[#796746]"
            onClick={onCancel}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            稍后再说
          </motion.button>
          <motion.button
            className="h-11 flex-1 rounded-[8px] border border-[#e0bf77] bg-[linear-gradient(180deg,#e8ce91,#c59b4f)] text-sm font-bold text-[#16120b] transition hover:brightness-105"
            onClick={onConfirm}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            进入牌桌
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
