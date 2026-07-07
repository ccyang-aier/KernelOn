'use client';

import { AlertTriangle, Users } from 'lucide-react';

const mentorLoads = [
  { current: 1, max: 2, name: '张三 (主架构师)', status: 'normal' },
  { current: 2, max: 3, name: '李四 (骨干导师)', status: 'normal' },
  { current: 3, max: 3, name: '王五 (高级导师)', status: 'warning' },
] as const;

export default function MentorLoadWidget() {
  return (
    <div className="flex h-full w-full select-none flex-col items-stretch justify-between gap-1 p-1 font-sans text-ko-ink">
      <div className="flex w-full shrink-0 items-center justify-between text-[11px] font-bold text-ko-ink/80 opacity-90">
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 text-ko-accent" />
          <span>骨干导师带教负载</span>
        </div>
        <span className="flex items-center gap-0.5 rounded-md border border-amber-500/10 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-700">
          <AlertTriangle className="size-2.5" />
          <span>带教预警</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2">
        {mentorLoads.map((mentor) => {
          const isWarning = mentor.status === 'warning';
          const ratio = (mentor.current / mentor.max) * 100;

          return (
            <div className="flex flex-col gap-1" key={mentor.name}>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="max-w-[70%] truncate text-ko-ink/80">{mentor.name}</span>
                <span className={isWarning ? 'font-extrabold text-amber-600' : 'font-extrabold text-ko-accent'}>
                  {mentor.current} / {mentor.max}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWarning
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                      : 'bg-gradient-to-r from-ko-ring to-ko-accent'
                  }`}
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <footer className="shrink-0 text-center text-[9px] font-bold tracking-wide text-ko-muted">
        整体负载率：<span className="font-black text-ko-ink/80">75%</span> | 当前空余名额：
        <span className="font-black text-ko-accent">2人</span>
      </footer>
    </div>
  );
}
