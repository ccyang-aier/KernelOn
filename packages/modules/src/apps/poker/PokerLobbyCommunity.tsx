'use client';

import { Coins, RefreshCw, Spade } from 'lucide-react';
import { motion } from 'motion/react';

import { dailyTasks, pokerAssetRoot, pokerFriends } from './data';

export function TournamentPanel({ onOpen }: Readonly<{ onOpen(): void }>) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-[#574724] bg-[#111412] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#ddc68d]">赛事预告</h2>
        <button
          className="text-[10px] text-[#8f8b81] transition hover:text-[#d7bc7b] active:translate-x-0.5"
          onClick={onOpen}
          type="button"
        >
          更多赛事 ›
        </button>
      </div>
      <motion.button
        className="group relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[7px] border border-[#413a2c] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
        onClick={onOpen}
        transition={{ damping: 26, stiffness: 320, type: 'spring' }}
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
      >
        <img
          alt="深夜冠军赛奖杯"
          className="absolute inset-0 h-full w-full object-cover object-left brightness-150 saturate-[1.18] transition duration-500 group-hover:scale-[1.02]"
          src={`${pokerAssetRoot}/tournament-trophy.webp`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,11,10,0.08),rgba(9,11,10,0.7)_44%,rgba(9,11,10,0.97)_100%)]" />
        <div className="relative ml-[34%] flex h-full flex-col px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <strong className="text-[17px] text-[#e8ddc3]">深夜冠军赛</strong>
            <span className="text-right text-[20px] font-bold text-[#e7d1a0]">21:30</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <strong className="text-[20px] text-[#df5b4d]">¥500K</strong>
            <span className="text-[12px] text-[#d46c56]">保底</span>
          </div>
          <div className="mt-auto">
            <div className="flex justify-between text-[10px] text-[#88867e]">
              <span>报名中</span>
              <span>632 / 1200</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#262923]">
              <div className="h-full w-[53%] rounded-full bg-[linear-gradient(90deg,#9f7a36,#e0bd6d)]" />
            </div>
          </div>
        </div>
      </motion.button>
    </section>
  );
}

interface FriendsPanelProps {
  message: string | null;
  onInvite(name: string): void;
  onViewAll(): void;
}

export function FriendsPanel({ message, onInvite, onViewAll }: FriendsPanelProps) {
  return (
    <section className="min-h-0 overflow-hidden rounded-[10px] border border-[#574724] bg-[#111412] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#ddc68d]">好友在玩</h2>
        <button
          className="text-[10px] text-[#8f8b81] transition hover:text-[#d7bc7b]"
          onClick={onViewAll}
          type="button"
        >
          查看全部 ›
        </button>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {pokerFriends.map((friend) => (
          <motion.button
            aria-label={`邀请 ${friend.name} 同桌`}
            className="group min-w-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
            key={friend.id}
            onClick={() => onInvite(friend.name)}
            transition={{ damping: 24, stiffness: 330, type: 'spring' }}
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="relative mx-auto block aspect-square w-[min(76px,100%)] overflow-hidden rounded-full border-2 border-[#8f713a] bg-[#1b1e1b] shadow-[0_7px_16px_rgba(0,0,0,0.32)] transition-colors group-hover:border-[#d3af62]">
              <img alt="" className="h-full w-full object-cover" src={friend.avatar} />
              <span className="absolute bottom-0 right-1 size-2.5 rounded-full border-2 border-[#171a18] bg-[#55c268]" />
            </span>
            <strong className="mt-4 block truncate text-[11px] text-[#e2d8c2]">
              {friend.name}
            </strong>
            <span className="mt-1.5 block truncate text-[10px] text-[#85837c]">
              {friend.status}
            </span>
            <span className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-[#b9b1a0]">
              <span className="size-1.5 rounded-full bg-[#55b767]" /> {friend.stakes}
            </span>
          </motion.button>
        ))}
      </div>
      {message ? (
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 truncate text-center text-[10px] text-[#76bd78]"
          initial={{ opacity: 0, y: 4 }}
        >
          {message}
        </motion.p>
      ) : null}
    </section>
  );
}

interface DailyTasksProps {
  onClaim(id: string, label: string): void;
  progress: Record<string, number>;
}

export function DailyTasks({ onClaim, progress }: DailyTasksProps) {
  return (
    <section className="relative min-h-0 overflow-hidden rounded-[10px] border border-[#574724] bg-[#111412] p-3 pr-[112px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <h2 className="text-[16px] font-bold text-[#ddc68d]">每日任务</h2>
      <div className="mt-2 space-y-2">
        {dailyTasks.map((task, index) => {
          const claimed = Boolean(progress[task.id]);
          const current = claimed ? task.target : task.current;
          const percent = Math.min(100, (current / task.target) * 100);

          return (
            <motion.button
              aria-label={`${claimed ? '已领取' : '领取'} ${task.label}`}
              className="flex h-[42px] w-full items-center gap-2 rounded-[6px] border border-[#32342f] bg-[#0f1210] px-2 text-left transition-colors hover:border-[#695736] disabled:cursor-default disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
              disabled={claimed}
              key={task.id}
              onClick={() => onClaim(task.id, task.label)}
              type="button"
              whileTap={claimed ? undefined : { scale: 0.985 }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-[#665230] bg-[#171b17] text-[#d0b36e]">
                {index === 0 ? (
                  <Spade className="size-4" />
                ) : index === 1 ? (
                  <Coins className="size-4" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between gap-2 text-[10px] text-[#a9a59a]">
                  <span className="truncate">
                    {claimed ? `${task.label} · 已领取` : task.label}
                  </span>
                  <span>
                    {current.toLocaleString()} / {task.target.toLocaleString()}
                  </span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#2a2c27]">
                  <motion.span
                    animate={{ width: `${percent}%` }}
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#9d7839,#e2c57c)]"
                    initial={false}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="absolute right-4 top-2 flex w-[82px] flex-col items-center">
        <img
          alt="每日任务等级 12"
          className="size-[74px] rounded-full object-cover mix-blend-screen ring-1 ring-[#6f542b]"
          src={`${pokerAssetRoot}/brand-crest.webp`}
        />
        <span className="mt-[-10px] rounded-full border border-[#6b542e] bg-[#151812] px-2 py-0.5 text-[11px] font-bold text-[#d8b96e]">
          LV.12
        </span>
        <div className="mt-3 space-y-2">
          <span className="block rounded-[6px] border border-[#58452a] bg-[#171914] px-3 py-1 text-center text-[12px] font-semibold text-[#d5b570]">
            ¥300
          </span>
          <span className="block rounded-[6px] border border-[#58452a] bg-[#171914] px-3 py-1 text-center text-[12px] font-semibold text-[#d5b570]">
            ¥200
          </span>
        </div>
      </div>
      <p className="mt-2 text-[9px] text-[#77766f]">每日任务 23:59:12 后刷新</p>
    </section>
  );
}
