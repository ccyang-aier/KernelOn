'use client';

import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState, type ReactNode } from 'react';

import { pokerAssetRoot, pokerNavigation } from './data';
import type { PokerToolbarMenu } from './usePokerLobbyController';

interface PokerSidebarProps {
  activeNav: string;
  onMembership(): void;
  onSelect(id: string, label: string): void;
}

export function PokerSidebar({ activeNav, onMembership, onSelect }: PokerSidebarProps) {
  return (
    <aside className="relative flex min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#141716_0%,#101312_58%,#0e1110_100%)] px-[14px] pb-4 pt-3 shadow-[inset_-1px_0_0_rgba(255,255,255,0.025)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:url('/kernelon-assets/apps/poker/lobby-hero.webp')] [background-position:88%_center] [background-size:cover]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,17,15,0.82),rgba(14,17,16,0.94))]" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-[168px] flex-col items-center pb-4 pt-0.5">
          <img
            alt="黑桃局徽章"
            className="size-[126px] object-contain mix-blend-lighten brightness-110 contrast-150 drop-shadow-[0_8px_22px_rgba(196,155,75,0.18)] [mask-image:radial-gradient(ellipse_72%_72%_at_50%_50%,#000_72%,transparent_100%)]"
            src={`${pokerAssetRoot}/brand-crest.webp`}
          />
          <strong className="mt-[-6px] text-[26px] font-semibold tracking-[0.1em] text-[#d2af66] [text-shadow:0_2px_12px_rgba(198,161,91,0.22)]">
            黑桃局
          </strong>
        </div>
        <nav aria-label="黑桃局导航" className="flex flex-col gap-[calc(8px/var(--poker-density))]">
          {pokerNavigation.map(({ Icon, id, label }) => {
            return (
              <PokerSidebarNavigationItem
                active={id === activeNav}
                Icon={Icon}
                id={id}
                key={id}
                label={label}
                onSelect={onSelect}
              />
            );
          })}
        </nav>
        <motion.button
          className="absolute left-[calc(5px/var(--poker-density))] right-[calc(1px/var(--poker-density))] bottom-[calc(86px/var(--poker-density))] flex min-h-[calc(92px/var(--poker-density))] items-center gap-3 rounded-[9px] border border-[#66502a]/70 bg-black/15 px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-[#a17d39] hover:bg-[#172019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/65"
          onClick={onMembership}
          transition={{ damping: 24, stiffness: 340, type: 'spring' }}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.975 }}
        >
          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[11px] ring-1 ring-[#80652e]">
            <img
              alt="黑桃会员"
              className="size-full scale-[1.32] object-cover mix-blend-lighten brightness-110 contrast-125 [mask-image:radial-gradient(ellipse_78%_78%_at_50%_50%,#000_76%,transparent_100%)]"
              src={`${pokerAssetRoot}/brand-crest.webp`}
            />
          </span>
          <span className="min-w-0">
            <strong className="block whitespace-nowrap text-[13px] font-semibold text-[#d7ba79]">
              黑桃会员
            </strong>
            <span className="mt-1 block whitespace-nowrap text-[10px] text-[#8f897c]">
              尊享专属牌权
            </span>
          </span>
          <ChevronRight className="ml-auto size-4 text-[#8c7447]" />
        </motion.button>
      </div>
    </aside>
  );
}

interface PokerSidebarNavigationItemProps {
  active: boolean;
  Icon: LucideIcon;
  id: string;
  label: string;
  onSelect(id: string, label: string): void;
}

function PokerSidebarNavigationItem({
  active,
  Icon,
  id,
  label,
  onSelect,
}: PokerSidebarNavigationItemProps) {
  const [interactionKey, setInteractionKey] = useState(0);
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      aria-current={active ? 'page' : undefined}
      className={`group relative ml-0.5 flex h-[calc(48px/var(--poker-density))] w-[calc(100%+6px)] items-center gap-[calc(10px/var(--poker-density))] overflow-hidden rounded-[10px] border px-[calc(10px/var(--poker-density))] text-left text-[15px] font-semibold transition-[border-color,color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/65 ${
        active
          ? 'border-[#b28d4e]/80 text-[#f0e5cc] shadow-[0_10px_26px_rgba(0,0,0,0.24)]'
          : 'border-transparent text-[#92958f] hover:border-[#716044]/45 hover:bg-[#18201c]/55 hover:text-[#ddd3bd]'
      }`}
      data-nav-feedback={interactionKey > 0 ? 'pulse' : 'idle'}
      onClick={() => {
        setInteractionKey((value) => value + 1);
        onSelect(id, label);
      }}
      transition={{ damping: 26, stiffness: 390, type: 'spring' }}
      type="button"
      whileHover={active || reducedMotion ? { x: 0 } : { x: 2 }}
      whileTap={{ scale: 0.965 }}
    >
      {active ? (
        <motion.span
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 rounded-[9px] bg-[radial-gradient(circle_at_17%_50%,rgba(221,184,109,0.16),transparent_37%),linear-gradient(105deg,rgba(40,61,49,0.98),rgba(23,43,35,0.98)_52%,rgba(14,31,26,0.99))] shadow-[inset_0_1px_0_rgba(255,245,213,0.11),inset_0_-1px_0_rgba(0,0,0,0.28),inset_18px_0_34px_rgba(197,159,83,0.045)]"
          initial={{ opacity: 0, scale: 0.97 }}
          layoutId="poker-sidebar-active"
          transition={{ damping: 28, stiffness: 330, type: 'spring' }}
        />
      ) : null}
      {active ? (
        <>
          <motion.span
            animate={{ opacity: 1, scaleY: 1 }}
            className="absolute bottom-2 left-0 top-2 z-10 w-[3px] origin-center rounded-r-full bg-[linear-gradient(180deg,#f0d696,#b78b42)] shadow-[0_0_15px_rgba(222,184,103,0.62)]"
            initial={{ opacity: 0, scaleY: 0.35 }}
            transition={{ delay: 0.08, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          />
          <span className="absolute inset-x-4 top-0 z-10 h-px bg-[linear-gradient(90deg,transparent,rgba(244,219,166,0.34),transparent)]" />
        </>
      ) : null}
      <AnimatePresence initial={false} mode="popLayout">
        {!active && interactionKey > 0 && !reducedMotion ? (
          <motion.span
            animate={{ opacity: [0, 0.48, 0], x: ['-35%', '145%'] }}
            className="pointer-events-none absolute inset-y-0 z-0 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(220,187,119,0.22),transparent)]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, x: '-35%' }}
            key={interactionKey}
            transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
      </AnimatePresence>
      <motion.span
        animate={
          interactionKey > 0 && !active && !reducedMotion
            ? { rotate: [0, -7, 4, 0], scale: [1, 0.88, 1.08, 1] }
            : { rotate: 0, scale: 1 }
        }
        className={`relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border transition-[border-color,background-color,box-shadow] duration-200 ${
          active
            ? 'border-[#a78348]/75 bg-[linear-gradient(145deg,rgba(208,173,101,0.2),rgba(76,63,38,0.14))] shadow-[inset_0_1px_0_rgba(255,245,214,0.12),0_5px_14px_rgba(0,0,0,0.22)]'
            : 'border-transparent bg-transparent group-hover:border-[#67583e]/45 group-hover:bg-[#22271f]/70'
        }`}
        key={`icon-${interactionKey}`}
        transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
      >
        <Icon
          aria-hidden="true"
          className={`size-[18px] transition-colors duration-200 ${
            active ? 'text-[#e4c77f]' : 'text-[#8e928c] group-hover:text-[#cbbb91]'
          }`}
          fill={active ? 'currentColor' : 'none'}
          strokeWidth={active ? 1.65 : 1.8}
        />
      </motion.span>
      <span className={`relative z-10 ${active ? 'tracking-[0.025em]' : ''}`}>{label}</span>
      {active ? (
        <motion.span
          animate={
            reducedMotion
              ? { opacity: 0.82, scale: 1 }
              : { opacity: [0.65, 1, 0.65], scale: [0.9, 1.08, 0.9] }
          }
          className="relative z-10 ml-auto size-1.5 rounded-full bg-[#dfbd72] shadow-[0_0_11px_rgba(223,189,114,0.8)]"
          transition={{ duration: 2.4, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
        />
      ) : null}
    </motion.button>
  );
}

interface PokerToolbarProps {
  menu: PokerToolbarMenu;
  onAnnounce(message: string): void;
  onMenuChange(value: PokerToolbarMenu): void;
  onSearch(value: string): void;
  query: string;
}

export function PokerToolbar({
  menu,
  onAnnounce,
  onMenuChange,
  onSearch,
  query,
}: PokerToolbarProps) {
  return (
    <header className="relative z-40 flex items-center gap-3 border-b border-[#29271f] bg-[linear-gradient(180deg,#101311_0%,#0d100f_100%)] px-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      <div className="flex min-w-[280px] items-center gap-3">
        <img
          alt="SpadeKing"
          className="size-11 rounded-full bg-[#171914] object-cover p-0.5 mix-blend-screen ring-1 ring-[#a88540]"
          src={`${pokerAssetRoot}/brand-crest.webp`}
        />
        <span className="text-[17px] font-semibold tracking-[0.01em] text-[#e6d8ba]">
          晚上好，SpadeKing
        </span>
      </div>
      <label className="ml-auto flex h-9 w-[286px] items-center gap-2.5 rounded-[10px] border border-[#2e2d28] bg-[#0b0d0c] px-3 text-[#77766f] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition focus-within:border-[#7b6333] focus-within:ring-1 focus-within:ring-[#a3823e]/40">
        <Search className="size-[17px] shrink-0" strokeWidth={1.8} />
        <input
          aria-label="搜索玩家、俱乐部或赛事"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#d7d0c1] outline-none placeholder:text-[#74726b]"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="搜索玩家 / 俱乐部 / 赛事"
          type="search"
          value={query}
        />
      </label>
      <motion.button
        className="flex h-9 min-w-[140px] items-center justify-center gap-2 rounded-[10px] border border-[#2d2c27] bg-[#111412] px-3 text-[12px] text-[#a9a69c] transition-colors hover:border-[#615035] hover:text-[#e6d8ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
        onClick={() => onAnnounce('当前有 128 位牌友在线')}
        type="button"
        whileTap={{ scale: 0.96 }}
      >
        <Users className="size-[17px]" />
        <span className="size-2 rounded-full bg-[#54b667] shadow-[0_0_8px_rgba(84,182,103,0.35)]" />
        128 在线
      </motion.button>
      <div className="relative">
        <motion.button
          aria-expanded={menu === 'notifications'}
          aria-label="查看通知"
          className="relative flex size-10 items-center justify-center rounded-[10px] border border-[#2d2c27] bg-[#111412] text-[#ada99d] transition-colors hover:border-[#665334] hover:text-[#eadcbd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
          onClick={() => onMenuChange(menu === 'notifications' ? null : 'notifications')}
          type="button"
          whileTap={{ scale: 0.92 }}
        >
          <Bell className="size-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-[#111412] bg-[#c85b4c] text-[10px] font-bold text-white">
            3
          </span>
        </motion.button>
        <AnimatePresence>
          {menu === 'notifications' ? (
            <ToolbarPopover className="right-0 w-72" title="通知">
              <PopoverRow title="深夜冠军赛将在 21:30 开始" meta="8 分钟前" />
              <PopoverRow title="NightOwl 邀请你加入牌桌" meta="12 分钟前" />
              <PopoverRow title="每日任务进度已更新" meta="1 小时前" />
            </ToolbarPopover>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="relative">
        <motion.button
          aria-expanded={menu === 'wallet'}
          className="flex h-11 min-w-[196px] items-center justify-between gap-3 rounded-[10px] border border-[#8a6a31]/90 bg-[linear-gradient(180deg,#1e1d17_0%,#141612_100%)] px-4 text-[20px] font-bold tracking-[0.04em] text-[#e4c27b] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition-colors hover:border-[#c09b51] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
          onClick={() => onMenuChange(menu === 'wallet' ? null : 'wallet')}
          type="button"
          whileTap={{ scale: 0.97 }}
        >
          <span className="flex items-center gap-2">
            <CircleDollarSign className="size-[22px]" /> ¥12,680
          </span>
          <ChevronDown className="size-4" />
        </motion.button>
        <AnimatePresence>
          {menu === 'wallet' ? (
            <ToolbarPopover className="right-0 w-64" title="账户资产">
              <div className="rounded-[8px] border border-[#403620] bg-[#0e110f] p-3">
                <p className="text-[11px] text-[#858177]">可用余额</p>
                <strong className="mt-1 block text-[24px] text-[#e6c57e]">¥12,680</strong>
                <button
                  className="mt-3 h-8 w-full rounded-[7px] bg-[#d2ad62] text-xs font-bold text-[#15120b] transition hover:brightness-105 active:scale-[0.98]"
                  onClick={() => {
                    onMenuChange(null);
                    onAnnounce('资产明细已同步到当前账户');
                  }}
                  type="button"
                >
                  资产明细
                </button>
              </div>
            </ToolbarPopover>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

function ToolbarPopover({
  children,
  className,
  title,
}: Readonly<{ children: ReactNode; className: string; title: string }>) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`absolute top-11 z-50 rounded-[12px] border border-[#4d412a] bg-[#151816]/98 p-3 text-[#ddd2ba] shadow-[0_18px_54px_rgba(0,0,0,0.6)] ${className}`}
      exit={{ opacity: 0, scale: 0.98, y: -5 }}
      initial={{ opacity: 0, scale: 0.98, y: -7 }}
      role="dialog"
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <strong className="mb-2 block text-[13px] text-[#e5c77f]">{title}</strong>
      {children}
    </motion.div>
  );
}

function PopoverRow({ meta, title }: Readonly<{ meta: string; title: string }>) {
  return (
    <button
      className="w-full border-t border-[#292b27] py-2.5 text-left transition-colors first:border-0 hover:text-[#f1e5ca] active:bg-white/[0.025]"
      type="button"
    >
      <span className="block text-xs font-medium text-[#d8cfbc]">{title}</span>
      <span className="mt-1 block text-[10px] text-[#77786f]">{meta}</span>
    </button>
  );
}
