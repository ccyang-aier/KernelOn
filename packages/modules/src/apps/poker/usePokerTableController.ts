'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PokerNotice } from './usePokerLobbyController';

export type PokerRailTab = 'activity' | 'chat' | 'range';

const MIN_BET = 20;
const MAX_BET = 8_640;

export function usePokerTableController() {
  const [betAmount, setBetAmount] = useState(720);
  const [chatValue, setChatValue] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [notice, setNotice] = useState<PokerNotice>(null);
  const [railTab, setRailTab] = useState<PokerRailTab>('activity');
  const [reactionCounts, setReactionCounts] = useState([8, 6, 2, 1, 1]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) {
        globalThis.clearTimeout(noticeTimerRef.current);
      }
    },
    [],
  );

  const announce = useCallback((message: string) => {
    if (noticeTimerRef.current) {
      globalThis.clearTimeout(noticeTimerRef.current);
    }

    const id = Date.now();
    setNotice({ id, message });
    noticeTimerRef.current = globalThis.setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current));
      noticeTimerRef.current = null;
    }, 2_300);
  }, []);

  const setBoundedBet = useCallback((amount: number) => {
    setBetAmount(Math.min(MAX_BET, Math.max(MIN_BET, Math.round(amount))));
  }, []);

  const betPercent = useMemo(
    () => ((betAmount - MIN_BET) / (MAX_BET - MIN_BET)) * 100,
    [betAmount],
  );

  const choosePreset = useCallback(
    (preset: 'half' | 'twoThirds' | 'pot' | 'allIn') => {
      const amounts = { allIn: MAX_BET, half: 620, pot: 1_240, twoThirds: 830 } as const;
      setBoundedBet(amounts[preset]);
      announce(
        preset === 'allIn'
          ? '已将加注额设为全下'
          : `加注额已调整为 ${amounts[preset].toLocaleString('zh-CN')}`,
      );
    },
    [announce, setBoundedBet],
  );

  const act = useCallback(
    (action: 'fold' | 'call' | 'raise') => {
      if (action === 'fold') {
        announce('已选择弃牌，等待下一手牌');
        return;
      }

      if (action === 'call') {
        announce('已跟注 240，筹码已进入底池');
        return;
      }

      announce(`已加注至 ${betAmount.toLocaleString('zh-CN')}`);
    },
    [announce, betAmount],
  );

  const sendChat = useCallback(() => {
    const message = chatValue.trim();
    if (!message) {
      announce('先输入一条聊天内容');
      return;
    }

    setChatValue('');
    announce(`已发送：${message}`);
  }, [announce, chatValue]);

  const react = useCallback(
    (index: number, label: string) => {
      setReactionCounts((current) =>
        current.map((count, currentIndex) => (currentIndex === index ? count + 1 : count)),
      );
      announce(`已发送“${label}”观战反应`);
    },
    [announce],
  );

  return {
    act,
    announce,
    betAmount,
    betPercent,
    chatValue,
    choosePreset,
    isMuted,
    notice,
    railTab,
    react,
    reactionCounts,
    sendChat,
    setBetAmount: setBoundedBet,
    setChatValue,
    setIsMuted,
    setRailTab,
    setSettingsOpen,
    settingsOpen,
  };
}
