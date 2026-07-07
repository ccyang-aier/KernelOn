'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Calendar, CheckCircle2, Clock } from 'lucide-react';

const trainingTasks = [
  { label: '内核启动与开发流程.pdf', status: '待学', tone: 'active' },
  { label: 'Vibe Coding 前端开发哲学', status: '待学', tone: 'active' },
  { label: '新团队规章与行政指南', status: '已读', tone: 'done' },
] as const;

export default function TrainingTaskWidget() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  return (
    <div className="flex h-full w-full select-none flex-col items-stretch justify-between gap-2 p-1 font-sans text-ko-ink">
      <div className="flex w-full shrink-0 items-center justify-between text-[11px] font-bold text-ko-ink/80 opacity-90">
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-ko-accent" />
          <span>新员工培训打卡中心</span>
        </div>
        <span className="text-[9px] font-bold tracking-wide text-ko-muted">4x2 双栏卡片</span>
      </div>
      <div className="flex min-h-0 flex-1 items-stretch gap-4">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          {trainingTasks.map((task) => (
            <div
              className={`flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-white/10 ${
                task.tone === 'done' ? 'opacity-60' : ''
              }`}
              key={task.label}
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  task.tone === 'done' ? 'bg-ko-ink/30' : 'bg-ko-accent'
                }`}
              />
              <span
                className={`min-w-0 flex-1 truncate text-[10px] ${
                  task.tone === 'done'
                    ? 'font-medium text-ko-ink/75 line-through'
                    : 'font-bold text-ko-ink/85'
                }`}
              >
                {task.label}
              </span>
              <span
                className={`shrink-0 text-[8px] font-bold ${
                  task.tone === 'done' ? 'text-emerald-600' : 'text-ko-muted'
                }`}
              >
                {task.status}
              </span>
            </div>
          ))}
        </div>
        <div className="my-1 w-px shrink-0 bg-white/20" />
        <div className="flex w-40 shrink-0 flex-col items-center justify-center gap-2">
          <AnimatePresence mode="wait">
            {!isCheckedIn ? (
              <motion.button
                className="relative flex h-11 w-full items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-ko-accent to-ko-accent-strong text-[11px] font-bold tracking-wider text-white shadow-md transition-all duration-300 hover:shadow-lg active:brightness-95"
                data-widget-interactive
                key="punch-button"
                onClick={() => setIsCheckedIn(true)}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Calendar className="size-4 shrink-0" />
                <span>一键日常签到</span>
              </motion.button>
            ) : (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-black tracking-wider text-emerald-600 shadow-[0_2px_10px_rgba(16,185,129,0.1)]"
                initial={{ opacity: 0, scale: 0.8 }}
                key="checked-in"
              >
                <CheckCircle2 className="size-4 stroke-[3px]" />
                <span>今日打卡完成</span>
              </motion.div>
            )}
          </AnimatePresence>
          <span className="flex items-center gap-1 text-[8px] font-bold text-ko-muted opacity-80">
            <Clock className="size-2.5" />
            <span>日常签到重置时间：次日0点</span>
          </span>
        </div>
      </div>
      <footer className="flex w-full shrink-0 items-center justify-between border-t border-white/10 px-1 pt-1.5 text-[9px] font-bold text-ko-muted">
        <span>
          签到日常连续：<span className="font-black text-ko-ink/80">5 天</span>
        </span>
        <span>
          阶段课程通关：<span className="font-black text-ko-accent">2 / 3 门</span>
        </span>
      </footer>
    </div>
  );
}
