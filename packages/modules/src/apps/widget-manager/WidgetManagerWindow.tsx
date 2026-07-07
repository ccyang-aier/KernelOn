'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  ChevronRight,
  Clock,
  Grid2X2,
  Layers3,
  Plus,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';

import type { WidgetManifest } from '@kernelon/core';
import { useShellSelector, type AppWindowSurfaceProps } from '@kernelon/shell';

type WidgetCategoryId = 'all' | 'operations' | 'mentor' | 'growth';

const widgetCategories = [
  { id: 'all', name: '全部小组件', Icon: Grid2X2 },
  { id: 'operations', name: '流程跟踪', Icon: Activity },
  { id: 'mentor', name: '导师带教', Icon: Users },
  { id: 'growth', name: '成长打卡', Icon: Award },
] satisfies Array<{ id: WidgetCategoryId; name: string; Icon: LucideIcon }>;

const widgetCategoryById: Record<string, Exclude<WidgetCategoryId, 'all'>> = {
  'growth-milestone': 'growth',
  'mentor-load': 'mentor',
  'onboarding-progress': 'operations',
  'training-task': 'growth',
};

export default function WidgetManagerWindow({ window: windowDescriptor }: AppWindowSurfaceProps) {
  const widgets = useShellSelector((state) => state.widgets);
  const screens = useShellSelector((state) => state.screens);
  const currentScreenId = useShellSelector((state) => state.currentScreenId);
  const addWidgetToScreen = useShellSelector((state) => state.addWidgetToScreen);
  const minimizeWindow = useShellSelector((state) => state.minimizeWindow);
  const setPendingWidgetPlacement = useShellSelector((state) => state.setPendingWidgetPlacement);
  const [activeCategory, setActiveCategory] = useState<WidgetCategoryId>('all');
  const [query, setQuery] = useState('');
  const [recentlyAddedWidgetId, setRecentlyAddedWidgetId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const currentScreen = screens.find((screen) => screen.id === currentScreenId);
  const existingWidgetCounts = useMemo(
    () =>
      (currentScreen?.items ?? []).reduce<Record<string, number>>((counts, item) => {
        if (item.kind === 'widget') {
          counts[item.targetId] = (counts[item.targetId] ?? 0) + 1;
        }

        return counts;
      }, {}),
    [currentScreen?.items],
  );
  const filteredWidgets = useMemo(
    () =>
      widgets.filter((widget) => {
        const category = widgetCategoryById[widget.id] ?? 'operations';
        const matchesCategory = activeCategory === 'all' || category === activeCategory;
        const searchableText = `${widget.name} ${widget.description}`.toLowerCase();

        return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
      }),
    [activeCategory, normalizedQuery, widgets],
  );

  useEffect(() => {
    if (!recentlyAddedWidgetId) {
      return undefined;
    }

    const timer = globalThis.setTimeout(() => setRecentlyAddedWidgetId(null), 1400);

    return () => globalThis.clearTimeout(timer);
  }, [recentlyAddedWidgetId]);

  const handlePlaceOnDesktop = useCallback(
    (widget: WidgetManifest) => {
      setPendingWidgetPlacement({
        height: widget.defaultGrid.height,
        widgetId: widget.id,
        width: widget.defaultGrid.width,
      });
      minimizeWindow(windowDescriptor.id);
    },
    [minimizeWindow, setPendingWidgetPlacement, windowDescriptor.id],
  );

  const handleQuickAdd = useCallback(
    (widget: WidgetManifest) => {
      addWidgetToScreen(currentScreenId, widget.id, widget.defaultGrid);
      setRecentlyAddedWidgetId(widget.id);
    },
    [addWidgetToScreen, currentScreenId],
  );

  return (
    <div className="flex h-full w-full select-none bg-transparent font-sans text-ko-ink">
      <aside className="flex w-52 shrink-0 flex-col gap-4 border-r border-white/40 bg-white/28 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="size-5 text-ko-accent" />
          <span className="text-sm font-bold tracking-wide">小组件分类</span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="小组件分类">
          {widgetCategories.map(({ Icon, id, name }) => {
            const isActive = activeCategory === id;

            return (
              <button
                className={`relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold outline-none transition-all duration-200 ${
                  isActive
                    ? 'border border-white/40 bg-white/50 text-ko-accent-strong shadow-sm'
                    : 'text-ko-ink/70 hover:bg-white/20'
                }`}
                key={id}
                onClick={() => setActiveCategory(id)}
                type="button"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`size-4 ${isActive ? 'text-ko-accent' : 'text-ko-ink/60'}`} />
                  <span>{name}</span>
                </span>
                <ChevronRight className="size-3.5 opacity-40" />
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-white/30 bg-white/20 p-3 text-[10px] leading-relaxed text-ko-muted">
          <p className="mb-1 font-semibold text-ko-ink/70">放置方式</p>
          <p>桌面放置会收起窗口，移动鼠标到桌面后点击确认落点。</p>
          <p className="mt-1">快速添加会直接使用该小组件的默认网格位置。</p>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col bg-transparent">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/30 px-6">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ko-ink/40" />
            <input
              className="h-9 w-full rounded-xl border border-white/40 bg-white/30 pl-9 pr-4 text-xs text-ko-ink/90 outline-none transition-all placeholder:text-ko-ink/40 focus:border-ko-accent/40 focus:bg-white/50 focus:ring-1 focus:ring-ko-accent/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索可用小组件..."
              type="search"
              value={query}
            />
          </div>
          <div className="shrink-0 rounded-xl border border-white/40 bg-white/30 px-3 py-1 text-[11px] font-semibold text-ko-muted">
            共 {filteredWidgets.length} 个小组件
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-5">
            {filteredWidgets.map((widget) => (
              <WidgetCard
                countOnDesktop={existingWidgetCounts[widget.id] ?? 0}
                isRecentlyAdded={recentlyAddedWidgetId === widget.id}
                key={widget.id}
                onPlaceOnDesktop={handlePlaceOnDesktop}
                onQuickAdd={handleQuickAdd}
                widget={widget}
              />
            ))}
          </div>
          {filteredWidgets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-ko-muted">
              <Layers3 className="size-8 opacity-40" />
              <span className="text-xs font-medium">没有找到符合条件的小组件</span>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function WidgetCard({
  countOnDesktop,
  isRecentlyAdded,
  onPlaceOnDesktop,
  onQuickAdd,
  widget,
}: Readonly<{
  countOnDesktop: number;
  isRecentlyAdded: boolean;
  onPlaceOnDesktop(widget: WidgetManifest): void;
  onQuickAdd(widget: WidgetManifest): void;
  widget: WidgetManifest;
}>) {
  const isWide = widget.defaultGrid.width >= 4;

  return (
    <motion.article
      className={`group relative flex flex-col justify-between gap-3 overflow-hidden rounded-3xl border border-white/55 bg-white/34 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-[12px] ${
        isWide ? 'col-span-2' : 'col-span-1'
      }`}
      transition={{ damping: 22, stiffness: 260, type: 'spring' }}
      whileHover={{
        boxShadow: '0 16px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)',
        scale: 1.018,
        y: -4,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {countOnDesktop > 0 ? (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-ko-accent/90 px-2 py-0.5 text-[9px] font-bold text-white shadow">
          已在桌面 x{countOnDesktop}
        </div>
      ) : null}
      <div className="relative h-28 overflow-hidden rounded-2xl border border-white/30 bg-white/20 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.08)_1px,transparent_1px)] opacity-40 [background-size:12px_12px]" />
        <div className="relative h-full w-full">
          <WidgetPreview widgetId={widget.id} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-ko-ink">{widget.name}</h3>
          <span className="rounded-full border border-ko-accent/10 bg-ko-accent-soft px-2 py-0.5 text-[9px] font-bold text-ko-accent">
            {widget.defaultGrid.width} x {widget.defaultGrid.height} 网格
          </span>
        </div>
        <p className="line-clamp-2 text-[10px] leading-relaxed text-ko-muted">
          {widget.description}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="flex h-8 items-center justify-center gap-1.5 rounded-xl border border-white/50 bg-white/44 text-[10px] font-bold text-ko-ink/80 shadow-sm transition-all duration-300 hover:bg-white/70"
          onClick={() => onPlaceOnDesktop(widget)}
          type="button"
        >
          <Grid2X2 className="size-3.5" />
          <span>桌面放置</span>
        </button>
        <button
          className={`flex h-8 items-center justify-center gap-1.5 rounded-xl border text-[10px] font-bold shadow-sm transition-all duration-300 ${
            isRecentlyAdded
              ? 'border-emerald-400/40 bg-emerald-500/80 text-white'
              : 'border-white/50 bg-ko-accent text-white hover:bg-ko-accent-strong'
          }`}
          onClick={() => onQuickAdd(widget)}
          type="button"
        >
          <Plus className="size-3.5" />
          <span>{isRecentlyAdded ? '已添加' : '快速添加'}</span>
        </button>
      </div>
    </motion.article>
  );
}

function WidgetPreview({ widgetId }: Readonly<{ widgetId: string }>) {
  if (widgetId === 'onboarding-progress') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <div className="relative flex size-16 items-center justify-center">
          <svg className="size-full -rotate-90">
            <circle cx="32" cy="32" fill="transparent" r="28" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              fill="transparent"
              r="28"
              stroke="#54b399"
              strokeDasharray="175"
              strokeDashoffset="52"
              strokeLinecap="round"
              strokeWidth="6"
            />
          </svg>
          <span className="absolute text-[12px] font-bold text-ko-ink/80">70%</span>
        </div>
        <span className="text-[10px] font-medium text-ko-muted">第二阶段：导师匹配</span>
      </div>
    );
  }

  if (widgetId === 'mentor-load') {
    return (
      <div className="flex h-full flex-col justify-center gap-2 px-3">
        {[
          ['李四 (P0 导师)', '2 / 3', '66%', 'bg-ko-accent', 'text-ko-accent'],
          ['王五 (高级导师)', '3 / 3 满载', '100%', 'bg-amber-500', 'text-amber-600'],
        ].map(([name, value, width, barClassName, valueClassName]) => (
          <div className="flex flex-col gap-1.5" key={name}>
            <div className="flex justify-between text-[10px] font-medium text-ko-ink/80">
              <span>{name}</span>
              <span className={`${valueClassName} font-bold`}>{value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className={`h-full rounded-full ${barClassName}`} style={{ width }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (widgetId === 'growth-milestone') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-300/40 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-lg">
          <Award className="size-6 text-amber-900 drop-shadow-md" />
        </div>
        <span className="text-[11px] font-bold text-ko-ink/85">内核开发者勋章</span>
        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">
          已解锁
        </span>
      </div>
    );
  }

  if (widgetId === 'training-task') {
    return (
      <div className="flex h-full w-full items-center justify-between px-6">
        <div className="flex max-w-[55%] flex-col gap-1.5">
          {['新员工带教计划安排.pdf', 'KernelOn OS 技术架构分享'].map((task, index) => (
            <div className="flex items-center gap-1.5" key={task}>
              <span className={`size-1.5 rounded-full ${index === 0 ? 'bg-ko-accent' : 'bg-amber-500'}`} />
              <span className="truncate text-[11px] font-semibold text-ko-ink/80">{task}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-gradient-to-r from-ko-accent to-ko-accent-strong px-3 py-1.5 text-[10px] font-bold text-white shadow-md">
          <Clock className="size-3" />
          <span>一键签到</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-[10px] text-ko-muted">
      预览不可用
    </div>
  );
}
