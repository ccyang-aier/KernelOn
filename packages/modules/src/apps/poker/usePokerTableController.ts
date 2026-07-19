'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import {
  applyPokerAction,
  chooseAiAction,
  createShowcaseGameState,
  evaluateBestHand,
  getActivePlayer,
  getCallAmount,
  getMinimumRaiseTo,
  getPlayer,
  getPot,
  startNextHand,
  type PokerGameState,
  type PokerPlayerAction,
} from './pokerGameEngine';
import type { PokerNotice } from './usePokerLobbyController';

export type PokerRailTab = 'activity' | 'chat' | 'range';

type GameEvent =
  | { type: 'player-action'; action: PokerPlayerAction; seatId: string }
  | { type: 'ai-turn' }
  | { type: 'next-hand'; seed: number };

function gameReducer(state: PokerGameState, event: GameEvent) {
  if (event.type === 'player-action') return applyPokerAction(state, event.seatId, event.action);
  if (event.type === 'next-hand') return startNextHand(state, event.seed);
  const activePlayer = getActivePlayer(state);
  const action = chooseAiAction(state);
  return activePlayer && action ? applyPokerAction(state, activePlayer.id, action) : state;
}

export function usePokerTableController() {
  const [game, dispatch] = useReducer(gameReducer, undefined, createShowcaseGameState);
  const [betSelection, setBetSelection] = useState({ amount: 720, turnKey: '' });
  const [chatValue, setChatValue] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [notice, setNotice] = useState<PokerNotice>(null);
  const [railTab, setRailTab] = useState<PokerRailTab>('activity');
  const [reactionCounts, setReactionCounts] = useState([8, 6, 2, 1, 1]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turnClock, setTurnClock] = useState({ key: '', seconds: 20 });
  const noticeTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const hero = getPlayer(game, 'hero')!;
  const activePlayer = getActivePlayer(game);
  const pot = getPot(game);
  const callAmount = getCallAmount(game, 'hero');
  const minimumRaiseTo = getMinimumRaiseTo(game, 'hero');
  const maximumRaiseTo = hero.streetBet + hero.stack;
  const isHeroTurn = game.phase === 'playing' && activePlayer?.id === 'hero';
  const heroTurnKey = isHeroTurn ? `${game.handNumber}:${game.street}:${game.logs.length}` : '';
  const canRaise = isHeroTurn && maximumRaiseTo > game.currentBet && hero.stack > callAmount;
  const suggestedBet = Math.max(
    minimumRaiseTo,
    game.currentBet > 0 ? game.currentBet * 3 : pot * 0.66,
  );
  const clampBet = useCallback(
    (amount: number) => {
      const minimum = Math.min(minimumRaiseTo, maximumRaiseTo);
      return Math.min(maximumRaiseTo, Math.max(minimum, Math.round(amount / 10) * 10));
    },
    [maximumRaiseTo, minimumRaiseTo],
  );
  const betAmount = clampBet(
    betSelection.turnKey === heroTurnKey ? betSelection.amount : suggestedBet,
  );
  const turnSeconds = turnClock.key === heroTurnKey ? turnClock.seconds : 20;

  useEffect(
    () => () => {
      if (noticeTimerRef.current) globalThis.clearTimeout(noticeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (game.phase !== 'playing' || !activePlayer || activePlayer.id === 'hero') return;
    const timer = globalThis.setTimeout(() => dispatch({ type: 'ai-turn' }), 460);
    return () => globalThis.clearTimeout(timer);
  }, [activePlayer, game.logs.length, game.phase, game.street]);

  useEffect(() => {
    if (!isHeroTurn) return;
    const timer = globalThis.setInterval(() => {
      setTurnClock((current) =>
        current.key === heroTurnKey
          ? { ...current, seconds: Math.max(0, current.seconds - 1) }
          : { key: heroTurnKey, seconds: 19 },
      );
    }, 1_000);
    return () => globalThis.clearInterval(timer);
  }, [heroTurnKey, isHeroTurn]);

  useEffect(() => {
    if (!isHeroTurn || turnClock.key !== heroTurnKey || turnClock.seconds > 0) return;
    dispatch({
      action: callAmount === 0 ? { type: 'check' } : { type: 'fold' },
      seatId: 'hero',
      type: 'player-action',
    });
  }, [callAmount, heroTurnKey, isHeroTurn, turnClock]);

  const announce = useCallback((message: string) => {
    if (noticeTimerRef.current) globalThis.clearTimeout(noticeTimerRef.current);
    const id = Date.now();
    setNotice({ id, message });
    noticeTimerRef.current = globalThis.setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current));
      noticeTimerRef.current = null;
    }, 2_300);
  }, []);

  const setBoundedBet = useCallback(
    (amount: number) => {
      setBetSelection({ amount: clampBet(amount), turnKey: heroTurnKey });
    },
    [clampBet, heroTurnKey],
  );

  const betPercent = useMemo(() => {
    if (maximumRaiseTo <= minimumRaiseTo) return 100;
    return ((betAmount - minimumRaiseTo) / (maximumRaiseTo - minimumRaiseTo)) * 100;
  }, [betAmount, maximumRaiseTo, minimumRaiseTo]);

  const choosePreset = useCallback(
    (preset: 'half' | 'twoThirds' | 'pot' | 'allIn') => {
      const amount =
        preset === 'allIn'
          ? maximumRaiseTo
          : preset === 'pot'
            ? pot
            : pot * (preset === 'half' ? 0.5 : 2 / 3);
      setBoundedBet(amount);
      announce(
        preset === 'allIn'
          ? '已将加注额设为全下'
          : `加注额已调整为 ${Math.min(maximumRaiseTo, Math.max(minimumRaiseTo, Math.round(amount / 10) * 10)).toLocaleString('zh-CN')}`,
      );
    },
    [announce, maximumRaiseTo, minimumRaiseTo, pot, setBoundedBet],
  );

  const act = useCallback(
    (action: 'fold' | 'call' | 'raise') => {
      if (!isHeroTurn) {
        announce(
          game.phase === 'settled'
            ? '本手已经结算，请开始下一手'
            : `等待 ${activePlayer?.name ?? '其他玩家'} 行动`,
        );
        return;
      }
      if (action === 'fold') {
        dispatch({ action: { type: 'fold' }, seatId: 'hero', type: 'player-action' });
        announce('已弃牌，牌局将自动推进至结算');
        return;
      }
      if (action === 'call') {
        const playerAction: PokerPlayerAction =
          callAmount === 0 ? { type: 'check' } : { type: 'call' };
        dispatch({ action: playerAction, seatId: 'hero', type: 'player-action' });
        announce(callAmount === 0 ? '已过牌' : `已跟注 ${callAmount.toLocaleString('zh-CN')}`);
        return;
      }
      if (!canRaise) {
        announce('当前筹码不足以再次加注');
        return;
      }
      dispatch({ action: { to: betAmount, type: 'raise' }, seatId: 'hero', type: 'player-action' });
      announce(
        betAmount === maximumRaiseTo
          ? `已全下 ${betAmount.toLocaleString('zh-CN')}`
          : `已加注至 ${betAmount.toLocaleString('zh-CN')}`,
      );
    },
    [
      activePlayer?.name,
      announce,
      betAmount,
      callAmount,
      canRaise,
      game.phase,
      isHeroTurn,
      maximumRaiseTo,
    ],
  );

  const nextHand = useCallback(() => {
    dispatch({ seed: game.handNumber + 17, type: 'next-hand' });
    announce(`第 ${(game.handNumber + 1).toLocaleString('zh-CN')} 手牌开始，庄位顺时针轮转`);
  }, [announce, game.handNumber]);

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

  const heroHand = useMemo(
    () => evaluateBestHand([...hero.holeCards, ...game.board]),
    [game.board, hero.holeCards],
  );
  const potOdds = callAmount > 0 ? `${(pot / callAmount).toFixed(1)} : 1` : '无需跟注';
  const estimatedEquity = Math.min(
    94,
    Math.round(26 + heroHand.category * 9 + (heroHand.kickers[0] ?? 0) * 0.65),
  );

  return {
    act,
    activePlayer,
    announce,
    betAmount,
    betPercent,
    callAmount,
    canRaise,
    chatValue,
    choosePreset,
    estimatedEquity,
    game,
    hero,
    heroHand,
    isHeroTurn,
    isMuted,
    maximumRaiseTo,
    minimumRaiseTo,
    nextHand,
    notice,
    pot,
    potOdds,
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
    turnSeconds,
  };
}
