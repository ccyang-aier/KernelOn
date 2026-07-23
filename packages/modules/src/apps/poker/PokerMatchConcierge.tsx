'use client';

import {
  CircleGauge,
  Clock3,
  Info,
  LoaderCircle,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import { pokerAssetRoot } from './data';
import {
  matchingAvatars,
  pokerMatchModes,
  pokerMatchStakes,
  type PokerMatchMode,
  type PokerMatchSeats,
  type PokerMatchStakes,
} from './pokerRoomData';
import type { PokerRoomBrowserController } from './usePokerRoomBrowserController';

const matchModeIcons: Record<PokerMatchMode, LucideIcon> = {
  quick: Zap,
  regular: Users,
  short: CircleGauge,
  tournament: Trophy,
};

export function PokerMatchConcierge({
  controller,
}: Readonly<{ controller: PokerRoomBrowserController }>) {
  const reducedMotion = useReducedMotion();

  return (
    <aside className="grid min-h-0 grid-rows-[404px_minmax(0,1fr)] gap-2">
      <section className="overflow-hidden rounded-[10px] border border-[#67502a] bg-[linear-gradient(145deg,#181b19,#111412)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-bold tracking-[.06em] text-[#e4c47f]">匹配管家</h2>
          <Info className="size-4 text-[#9d8250]" strokeWidth={1.6} />
        </div>

        <MatchSectionLabel>选择玩法</MatchSectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {pokerMatchModes.map((mode) => {
            const Icon = matchModeIcons[mode.id];
            const selected = controller.matchMode === mode.id;
            return (
              <ChoiceButton
                key={mode.id}
                label={mode.label}
                onClick={() => controller.setMatchMode(mode.id)}
                selected={selected}
              >
                <Icon className="size-[18px]" />
              </ChoiceButton>
            );
          })}
        </div>

        <MatchSectionLabel>选择盲注</MatchSectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {pokerMatchStakes.map((stakes) => (
            <ChoiceButton
              key={stakes}
              label={stakes}
              onClick={() => controller.setMatchStakes(stakes)}
              selected={controller.matchStakes === stakes}
            >
              <span className="grid size-5 place-items-center rounded-full border border-current text-[9px]">
                ♠
              </span>
            </ChoiceButton>
          ))}
        </div>

        <MatchSectionLabel>选择座位</MatchSectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {([6, 9] as const).map((seats) => (
            <ChoiceButton
              key={seats}
              label={`${seats} 人桌`}
              onClick={() => controller.setMatchSeats(seats)}
              selected={controller.matchSeats === seats}
            />
          ))}
        </div>

        <motion.button
          className="mt-4 h-[54px] w-full rounded-[8px] border border-[#e4c480] bg-[linear-gradient(180deg,#e9cf95,#c59a4e)] text-[18px] font-black tracking-[.06em] text-[#17130c] shadow-[inset_0_1px_0_rgba(255,255,255,.62),0_10px_24px_rgba(0,0,0,.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2dca9] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={controller.matchStatus === 'matching'}
          onClick={controller.startMatching}
          type="button"
          whileTap={{ scale: 0.98 }}
        >
          {controller.matchStatus === 'matching' ? '匹配进行中' : '开始匹配'}
        </motion.button>
        <p className="mt-2 text-center text-[10px] text-[#6f716c]">
          系统将根据你的偏好为你寻找合适的牌桌
        </p>
      </section>

      <section className="relative min-h-0 overflow-hidden rounded-[10px] border border-[#5b4627] bg-[radial-gradient(circle_at_50%_35%,rgba(91,66,27,.16),transparent_46%),linear-gradient(180deg,#151715,#0e110f)] shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(216,177,96,.15)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(circle_at_center,#000,transparent_70%)]" />
        <AnimatePresence initial={false} mode="wait">
          {controller.joinedRoom ? (
            <JoinedRoomPanel controller={controller} key="joined-room" />
          ) : controller.matchStatus === 'idle' ? (
            <IdleMatchPanel key="idle" />
          ) : (
            <ActiveMatchPanel
              key={controller.matchStatus}
              matchPlayers={controller.matchPlayers}
              matchSeats={controller.matchSeats}
              matchStakes={controller.matchStakes}
              onCancel={controller.cancelMatching}
              onEnter={controller.enterMatchedRoom}
              ready={controller.matchStatus === 'ready'}
              reducedMotion={Boolean(reducedMotion)}
            />
          )}
        </AnimatePresence>
      </section>
    </aside>
  );
}

function MatchSectionLabel({ children }: Readonly<{ children: string }>) {
  return <p className="mb-2 mt-4 text-[11px] font-medium text-[#85847d]">{children}</p>;
}

function ChoiceButton({
  children,
  label,
  onClick,
  selected,
}: Readonly<{
  children?: ReactNode;
  label: string;
  onClick(): void;
  selected: boolean;
}>) {
  return (
    <motion.button
      aria-pressed={selected}
      className={`flex h-11 items-center justify-center gap-1.5 rounded-[7px] border text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60 ${
        selected
          ? 'border-[#b89250] bg-[linear-gradient(145deg,#2a3c31,#15281f)] text-[#ead8ae] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_5px_13px_rgba(0,0,0,.22)]'
          : 'border-[#454038] bg-[#181b18] text-[#98958d] hover:border-[#756448] hover:text-[#d7c8a5]'
      }`}
      onClick={onClick}
      type="button"
      whileTap={{ scale: 0.965 }}
    >
      {children}
      {label}
    </motion.button>
  );
}

function IdleMatchPanel() {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex h-full flex-col items-center justify-center px-6 text-center"
      exit={{ opacity: 0, scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.98 }}
    >
      <div className="relative grid size-[112px] place-items-center rounded-full border border-[#5e4a2c] bg-[radial-gradient(circle,#201e15,#0f1210_67%)] shadow-[0_18px_42px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.05)]">
        <span className="absolute inset-2 rounded-full border border-dashed border-[#745c32]/70" />
        <img
          alt="匹配管家筹码"
          className="size-[72px] rounded-full object-cover mix-blend-screen brightness-110 contrast-125"
          src={`${pokerAssetRoot}/brand-crest.webp`}
        />
      </div>
      <h3 className="mt-5 text-[17px] font-bold text-[#dbc38e]">准备寻找合适牌桌</h3>
      <p className="mt-2 max-w-[280px] text-[11px] leading-5 text-[#777a74]">
        选择玩法、盲注与座位数量，匹配管家将为你创建公平牌局
      </p>
      <div className="mt-5 flex items-center gap-4 text-[10px] text-[#817e75]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-[#a78a50]" /> 公平牌局
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 className="size-3.5 text-[#a78a50]" /> 平均 22 秒
        </span>
      </div>
    </motion.div>
  );
}

function ActiveMatchPanel({
  matchPlayers,
  matchSeats,
  matchStakes,
  onCancel,
  onEnter,
  ready,
  reducedMotion,
}: Readonly<{
  matchPlayers: number;
  matchSeats: PokerMatchSeats;
  matchStakes: PokerMatchStakes;
  onCancel(): void;
  onEnter(): void;
  ready: boolean;
  reducedMotion: boolean;
}>) {
  const remainingSeconds = Math.max(0, 18 - Math.max(0, matchPlayers - 4) * 6);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative flex h-full flex-col items-center px-5 py-4 text-center"
      exit={{ opacity: 0, y: 5 }}
      initial={{ opacity: 0, y: 8 }}
    >
      <h3 className={`text-[17px] font-bold ${ready ? 'text-[#7bd884]' : 'text-[#e0c382]'}`}>
        {ready ? '牌桌匹配完成' : '匹配中...'}
      </h3>
      <div className="relative mt-3 grid size-[142px] place-items-center">
        <motion.span
          animate={reducedMotion || ready ? undefined : { rotate: 360 }}
          className={`absolute inset-0 rounded-full border border-dashed ${
            ready ? 'border-[#54a765]' : 'border-[#a67d38]'
          }`}
          transition={{ duration: 6, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
        />
        <span className="absolute inset-[14px] rounded-full border border-[#765b2d]/70 shadow-[0_0_28px_rgba(201,154,68,.13)]" />
        <motion.div
          animate={
            reducedMotion || ready
              ? undefined
              : { boxShadow: ['0 0 18px rgba(202,157,70,.18)', '0 0 38px rgba(202,157,70,.38)'] }
          }
          className="relative grid size-[86px] place-items-center rounded-full border-4 border-[#9b7739] bg-[radial-gradient(circle,#40331e,#171713_64%)]"
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
        >
          {ready ? (
            <ShieldCheck className="size-10 text-[#78d284]" />
          ) : (
            <LoaderCircle className="size-10 text-[#dfbc70]" strokeWidth={1.35} />
          )}
        </motion.div>
      </div>

      <p className="mt-2 text-[13px] font-semibold text-[#e5d7b9]">
        {ready ? '王冠深筹牌桌已为你创建' : '正在寻找合适牌桌'}
      </p>
      <p className="mt-1 text-[11px] text-[#a49f92]">
        已匹配 {matchPlayers} / {matchSeats} 位玩家
      </p>
      <p className="mt-1 text-[10px] text-[#777a73]">
        {ready ? `盲注 ${matchStakes} · 全员已就绪` : `预计 ${remainingSeconds} 秒`}
      </p>

      <div className="mt-3 flex max-w-full items-center justify-center -space-x-1">
        {Array.from({ length: matchSeats }).map((_, index) => {
          const occupied = index < matchPlayers;
          return occupied ? (
            <motion.img
              alt="已匹配玩家"
              animate={{ opacity: 1, scale: 1 }}
              className="size-9 rounded-full border-2 border-[#9c7b3f] object-cover shadow-[0_4px_10px_rgba(0,0,0,.5)]"
              initial={{ opacity: 0, scale: 0.72 }}
              key={`matched-${index}`}
              src={matchingAvatars[index % matchingAvatars.length]}
            />
          ) : (
            <motion.span
              animate={
                reducedMotion ? undefined : { borderColor: ['#4e4739', '#9a7941', '#4e4739'] }
              }
              className="size-9 rounded-full border border-dashed bg-[#10130f]"
              key={`waiting-${index}`}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
            />
          );
        })}
      </div>

      <motion.button
        className={`mt-auto h-11 w-full rounded-[8px] border text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60 ${
          ready
            ? 'border-[#e0bd72] bg-[linear-gradient(180deg,#e6ca8e,#c3994e)] text-[#17130c] hover:brightness-105'
            : 'border-[#534b3c] bg-[#181b18] text-[#aaa69c] hover:border-[#826a40] hover:text-[#dfc88f]'
        }`}
        onClick={ready ? onEnter : onCancel}
        type="button"
        whileTap={{ scale: 0.975 }}
      >
        {ready ? '进入牌桌' : '取消匹配'}
      </motion.button>
    </motion.div>
  );
}

function JoinedRoomPanel({ controller }: Readonly<{ controller: PokerRoomBrowserController }>) {
  const joinedRoom = controller.joinedRoom;
  if (!joinedRoom) {
    return null;
  }

  const roomPlayers = Math.min(joinedRoom.room.capacity, joinedRoom.room.players + 1);
  const ready = joinedRoom.status === 'ready';

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative flex h-full flex-col items-center px-5 py-5 text-center"
      exit={{ opacity: 0, y: 6 }}
      initial={{ opacity: 0, y: 10 }}
    >
      <p className="text-[11px] font-semibold tracking-[.12em] text-[#99845b]">已加入房间</p>
      <div className="relative mt-3 size-[106px] overflow-hidden rounded-full border-2 border-[#a27e3e] shadow-[0_15px_35px_rgba(0,0,0,.5)]">
        <img
          alt={`${joinedRoom.room.name}房间`}
          className="h-full w-full object-cover"
          src={joinedRoom.room.image}
        />
        <span className="absolute inset-0 bg-black/20" />
      </div>
      <h3 className="mt-3 text-[18px] font-bold text-[#e6cc91]">{joinedRoom.room.name}</h3>
      <p className="mt-1 text-[11px] text-[#8b8981]">
        {joinedRoom.room.stakes} · {roomPlayers} / {joinedRoom.room.capacity} 人
      </p>
      <div
        className={`mt-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${
          ready
            ? 'border-[#3d7848] bg-[#15371e] text-[#78d484]'
            : 'border-[#604d2e] bg-[#231d12] text-[#c7a663]'
        }`}
      >
        {ready ? (
          <ShieldCheck className="size-4" />
        ) : (
          <LoaderCircle className="size-4 animate-spin" />
        )}
        {ready ? '成员已就绪' : '等待房主开始'}
      </div>
      <div className="mt-auto grid w-full grid-cols-2 gap-2">
        <button
          className="h-11 rounded-[8px] border border-[#4d493f] bg-[#171a17] text-[12px] font-semibold text-[#9f9c94] transition hover:border-[#77684d] hover:text-[#d5c49f]"
          onClick={controller.leaveJoinedRoom}
          type="button"
        >
          退出房间
        </button>
        <button
          className="h-11 rounded-[8px] border border-[#e0bd73] bg-[linear-gradient(180deg,#e6ca8e,#c3994e)] text-[12px] font-bold text-[#17130c] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!ready}
          onClick={controller.enterJoinedRoom}
          type="button"
        >
          {ready ? '进入牌桌' : '等待就绪'}
        </button>
      </div>
    </motion.div>
  );
}
