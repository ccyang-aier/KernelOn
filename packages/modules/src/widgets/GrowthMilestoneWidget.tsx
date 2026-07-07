'use client';

import { Award, CheckCircle2, Milestone } from 'lucide-react';

export default function GrowthMilestoneWidget() {
  return (
    <div className="flex h-full w-full select-none flex-col items-stretch justify-between gap-1 p-1 font-sans text-ko-ink">
      <div className="flex w-full shrink-0 items-center justify-between text-[11px] font-bold text-ko-ink/80 opacity-90">
        <div className="flex items-center gap-1.5">
          <Milestone className="size-3.5 text-ko-accent" />
          <span>新员工成长里程碑</span>
        </div>
        <span className="rounded-md border border-emerald-500/10 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700">
          已启动
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-1">
        <div className="group relative flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 shadow-lg">
          <Award className="size-8 text-amber-900 drop-shadow-md" />
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
          <div className="pointer-events-none absolute inset-0.5 rounded-2xl border border-white/30" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[12px] font-bold text-ko-ink/85">融内核 · 第一阶段</span>
          <span className="text-[9px] font-bold text-ko-muted">解锁：导师师徒关系确立</span>
        </div>
      </div>
      <footer className="flex shrink-0 items-center justify-center gap-1 rounded-xl border border-emerald-500/10 bg-emerald-500/5 py-1 text-[9px] font-extrabold text-emerald-600">
        <CheckCircle2 className="size-3" strokeWidth={3} />
        <span>导师评语已提交，考核合格</span>
      </footer>
    </div>
  );
}
