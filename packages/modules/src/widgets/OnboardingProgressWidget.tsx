'use client';

import { Activity } from 'lucide-react';

export default function OnboardingProgressWidget() {
  const percentage = 70;
  const radius = 38;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <div className="flex h-full w-full select-none flex-col items-center justify-between p-1 font-sans text-ko-ink">
      <div className="flex w-full items-center justify-between text-[11px] font-bold text-ko-ink/80 opacity-90">
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-ko-accent" />
          <span>新员工入职进度</span>
        </div>
        <span className="rounded-md bg-ko-accent-soft px-1.5 py-0.5 text-[10px] text-ko-accent">
          P0 运作
        </span>
      </div>
      <div className="relative flex flex-1 items-center justify-center py-2">
        <div className="relative flex size-24 items-center justify-center">
          <svg className="size-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              fill="transparent"
              r={radius}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="7"
            />
            <circle
              cx="48"
              cy="48"
              fill="transparent"
              r={radius}
              stroke="url(#onboarding-progress-gradient)"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="7"
            />
            <defs>
              <linearGradient id="onboarding-progress-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#54b399" />
                <stop offset="100%" stopColor="#176f5d" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-lg font-black tracking-tight text-ko-ink">{percentage}%</span>
            <span className="text-[9px] font-bold tracking-wide text-ko-muted">总体进度</span>
          </div>
        </div>
      </div>
      <footer className="w-full truncate rounded-xl border border-white/30 bg-white/40 px-2 py-1 text-center text-[10px] font-semibold text-ko-ink/75 shadow-sm">
        当前阶段：<span className="font-bold text-ko-accent">带教关系匹配与跟进</span>
      </footer>
    </div>
  );
}
