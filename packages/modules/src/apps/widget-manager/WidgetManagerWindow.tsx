'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckSquare,
  Cloud,
  DollarSign,
  Grid2X2,
  Heart,
  Image,
  Music,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { useShellSelector, type AppWindowSurfaceProps } from '@kernelon/shell';

type DemoWidgetCategory =
  | 'all'
  | 'featured'
  | 'added'
  | 'weather'
  | 'calendar'
  | 'music'
  | 'health'
  | 'productivity'
  | 'finance'
  | 'photos';
type DemoWidgetSize = 'small' | 'medium' | 'large';
type DemoWidgetSizeFilter = 'all' | DemoWidgetSize;
type DemoWidgetTemplate =
  | 'weather-small'
  | 'weather-large'
  | 'calendar-small'
  | 'calendar-week'
  | 'calendar-month'
  | 'music'
  | 'music-large'
  | 'rings'
  | 'sleep'
  | 'todo'
  | 'timer'
  | 'stock'
  | 'fx'
  | 'photo-large'
  | 'photo-medium';

interface DemoWidget {
  id: string;
  name: string;
  category: Exclude<DemoWidgetCategory, 'all' | 'featured' | 'added'>;
  size: DemoWidgetSize;
  height: number;
  gradient: string;
  template: DemoWidgetTemplate;
  widgetId: string;
}

const sidebarSections = [
  {
    label: '浏览',
    items: [
      { id: 'all', name: '全部小组件', Icon: Grid2X2 },
      { id: 'featured', name: '精选推荐', Icon: Sparkles },
      { id: 'added', name: '已添加', Icon: Heart },
    ],
  },
  {
    label: '分类',
    items: [
      { id: 'weather', name: '天气', Icon: Cloud },
      { id: 'calendar', name: '日历', Icon: Calendar },
      { id: 'music', name: '音乐', Icon: Music },
      { id: 'health', name: '健康', Icon: Activity },
      { id: 'productivity', name: '效率', Icon: CheckSquare },
      { id: 'finance', name: '财务', Icon: DollarSign },
    ],
  },
] satisfies Array<{
  label: string;
  items: Array<{ id: DemoWidgetCategory; name: string; Icon: LucideIcon }>;
}>;

const categoryChips = [
  { id: 'all', name: '全部' },
  { id: 'weather', name: '天气' },
  { id: 'calendar', name: '日历' },
  { id: 'music', name: '音乐' },
  { id: 'health', name: '健康' },
  { id: 'productivity', name: '效率' },
  { id: 'finance', name: '财务' },
  { id: 'photos', name: '照片' },
] satisfies Array<{ id: DemoWidgetCategory; name: string }>;

const sizeFilters = [
  { id: 'all', name: '全部尺寸' },
  { id: 'small', name: '小' },
  { id: 'medium', name: '中' },
  { id: 'large', name: '大' },
] satisfies Array<{ id: DemoWidgetSizeFilter; name: string }>;

const demoWidgets: DemoWidget[] = [
  {
    id: 'weather-small',
    name: '天气',
    category: 'weather',
    size: 'small',
    height: 150,
    gradient: 'linear-gradient(135deg,#4facfe,#0072ff)',
    template: 'weather-small',
    widgetId: 'onboarding-progress',
  },
  {
    id: 'weather-large',
    name: '天气·大',
    category: 'weather',
    size: 'medium',
    height: 150,
    gradient: 'linear-gradient(135deg,#2980b9,#6dd5fa)',
    template: 'weather-large',
    widgetId: 'mentor-load',
  },
  {
    id: 'calendar-small',
    name: '日历',
    category: 'calendar',
    size: 'small',
    height: 150,
    gradient: 'linear-gradient(135deg,#ff5858,#f857a6)',
    template: 'calendar-small',
    widgetId: 'growth-milestone',
  },
  {
    id: 'calendar-week',
    name: '日历·周视图',
    category: 'calendar',
    size: 'medium',
    height: 180,
    gradient: 'linear-gradient(135deg,#ff9966,#ff5e62)',
    template: 'calendar-week',
    widgetId: 'growth-milestone',
  },
  {
    id: 'music',
    name: '音乐播放',
    category: 'music',
    size: 'medium',
    height: 150,
    gradient: 'linear-gradient(135deg,#834d9b,#3b1c53)',
    template: 'music',
    widgetId: 'training-task',
  },
  {
    id: 'music-large',
    name: '歌单精选',
    category: 'music',
    size: 'large',
    height: 220,
    gradient: 'linear-gradient(135deg,#8e2de2,#4a00e0)',
    template: 'music-large',
    widgetId: 'training-task',
  },
  {
    id: 'rings',
    name: '健身圆环',
    category: 'health',
    size: 'small',
    height: 150,
    gradient: 'linear-gradient(135deg,#0f2027,#2c5364)',
    template: 'rings',
    widgetId: 'onboarding-progress',
  },
  {
    id: 'sleep',
    name: '睡眠分析',
    category: 'health',
    size: 'medium',
    height: 150,
    gradient: 'linear-gradient(135deg,#5f2c82,#1a1a40)',
    template: 'sleep',
    widgetId: 'mentor-load',
  },
  {
    id: 'todo',
    name: '备忘清单',
    category: 'productivity',
    size: 'small',
    height: 170,
    gradient: 'linear-gradient(135deg,#ffb347,#e07a1f)',
    template: 'todo',
    widgetId: 'training-task',
  },
  {
    id: 'timer',
    name: '番茄钟',
    category: 'productivity',
    size: 'small',
    height: 150,
    gradient: 'linear-gradient(135deg,#ff6a00,#ee0979)',
    template: 'timer',
    widgetId: 'training-task',
  },
  {
    id: 'stock',
    name: '股票行情',
    category: 'finance',
    size: 'medium',
    height: 150,
    gradient: 'linear-gradient(135deg,#11998e,#0c5c50)',
    template: 'stock',
    widgetId: 'mentor-load',
  },
  {
    id: 'fx',
    name: '汇率换算',
    category: 'finance',
    size: 'small',
    height: 150,
    gradient: 'linear-gradient(135deg,#0f2027,#203a43)',
    template: 'fx',
    widgetId: 'onboarding-progress',
  },
  {
    id: 'photo-large',
    name: '照片回忆',
    category: 'photos',
    size: 'large',
    height: 260,
    gradient: 'linear-gradient(135deg,#fc5c7d,#6a82fb)',
    template: 'photo-large',
    widgetId: 'growth-milestone',
  },
  {
    id: 'photo-medium',
    name: '照片精选',
    category: 'photos',
    size: 'medium',
    height: 150,
    gradient: 'linear-gradient(135deg,#f7971e,#c96b06)',
    template: 'photo-medium',
    widgetId: 'growth-milestone',
  },
  {
    id: 'calendar-month',
    name: '日历·月视图',
    category: 'calendar',
    size: 'large',
    height: 220,
    gradient: 'linear-gradient(135deg,#7f00ff,#4b0f8f)',
    template: 'calendar-month',
    widgetId: 'growth-milestone',
  },
];

const featuredWidgetIds = new Set(['weather-small', 'calendar-small', 'music']);
const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

export default function WidgetManagerWindow({ window: windowDescriptor }: AppWindowSurfaceProps) {
  const widgets = useShellSelector((state) => state.widgets);
  const screens = useShellSelector((state) => state.screens);
  const currentScreenId = useShellSelector((state) => state.currentScreenId);
  const setPendingWidgetPlacement = useShellSelector((state) => state.setPendingWidgetPlacement);
  const minimizeWindow = useShellSelector((state) => state.minimizeWindow);
  const [activeCategory, setActiveCategory] = useState<DemoWidgetCategory>('all');
  const [activeSize, setActiveSize] = useState<DemoWidgetSizeFilter>('all');
  const [query, setQuery] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
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
  const availableWidgetIds = useMemo(() => new Set(widgets.map((widget) => widget.id)), [widgets]);
  const filteredWidgets = useMemo(
    () =>
      demoWidgets.filter((widget) => {
        const isAdded = (existingWidgetCounts[widget.widgetId] ?? 0) > 0;
        const matchesCategory =
          activeCategory === 'all' ||
          (activeCategory === 'featured' && featuredWidgetIds.has(widget.id)) ||
          (activeCategory === 'added' && isAdded) ||
          widget.category === activeCategory;
        const matchesSize = activeSize === 'all' || widget.size === activeSize;
        const matchesSearch =
          !normalizedQuery || widget.name.toLowerCase().includes(normalizedQuery);

        return (
          matchesCategory && matchesSize && matchesSearch && availableWidgetIds.has(widget.widgetId)
        );
      }),
    [activeCategory, activeSize, availableWidgetIds, existingWidgetCounts, normalizedQuery],
  );

  const handleAddWidget = useCallback(
    (demoWidget: DemoWidget) => {
      const widget = widgets.find((candidate) => candidate.id === demoWidget.widgetId);

      if (!widget) {
        return;
      }

      setPendingWidgetPlacement({
        height: widget.defaultGrid.height,
        widgetId: widget.id,
        width: widget.defaultGrid.width,
      });
      setRecentlyAddedId(demoWidget.id);
      globalThis.setTimeout(() => setRecentlyAddedId(null), 1400);
      minimizeWindow(windowDescriptor.id);
    },
    [minimizeWindow, setPendingWidgetPlacement, widgets, windowDescriptor.id],
  );

  return (
    <div className="relative flex h-full w-full select-none overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.66),rgba(232,244,246,0.36)_46%,rgba(255,255,255,0.50))] font-sans text-[#1b2228] backdrop-blur-[30px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,0.72),transparent_36%),radial-gradient(circle_at_82%_14%,rgba(126,189,208,0.24),transparent_34%),radial-gradient(circle_at_68%_92%,rgba(238,184,218,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.20)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:42px_42px]" />
      <aside className="relative z-10 flex w-[190px] shrink-0 flex-col gap-5 border-r border-white/45 bg-white/[0.24] px-5 py-6 shadow-[inset_-1px_0_0_rgba(255,255,255,0.34)] backdrop-blur-[28px]">
        {sidebarSections.map((section) => (
          <nav className="flex flex-col gap-1" key={section.label} aria-label={section.label}>
            <div className="mb-1 px-1 text-[11px] font-semibold text-[#596168]">
              {section.label}
            </div>
            {section.items.map(({ Icon, id, name }) => {
              const isActive = activeCategory === id;

              return (
                <button
                  className={cx(
                    'flex h-10 w-full items-center justify-between rounded-xl border px-3 text-left text-[13.5px] font-semibold outline-none backdrop-blur-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
                    isActive
                      ? 'border-white/50 bg-[#0a84ff]/85 text-white shadow-[0_14px_28px_rgba(10,132,255,0.24),inset_0_1px_0_rgba(255,255,255,0.34)]'
                      : 'border-transparent text-[#626970] hover:border-white/45 hover:bg-white/[0.34] hover:text-[#1b2228] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]',
                  )}
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{name}</span>
                  </span>
                  <span
                    className={cx('text-xl leading-none', isActive ? 'opacity-90' : 'opacity-35')}
                  >
                    ›
                  </span>
                </button>
              );
            })}
          </nav>
        ))}
      </aside>
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 px-6 pb-3 pt-6">
          <div className="flex items-center gap-4">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/45 bg-white/[0.32] px-3 text-[#606871] shadow-[0_10px_28px_rgba(35,48,58,0.08),inset_0_1px_0_rgba(255,255,255,0.56)] backdrop-blur-2xl">
              <Search className="size-4 shrink-0" />
              <input
                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[#1b2228] outline-none placeholder:text-[#8d9199]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索小组件"
                type="search"
                value={query}
              />
            </label>
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/45 bg-white/[0.28] p-1 shadow-[0_10px_28px_rgba(35,48,58,0.08),inset_0_1px_0_rgba(255,255,255,0.48)] backdrop-blur-2xl">
              {sizeFilters.map((filter) => {
                const isActive = activeSize === filter.id;

                return (
                  <button
                    className={cx(
                      'h-8 rounded-lg px-3 text-xs font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
                      isActive
                        ? 'bg-[#15181c]/90 text-white shadow-[0_8px_18px_rgba(20,24,28,0.18),inset_0_1px_0_rgba(255,255,255,0.16)]'
                        : 'text-[#626970] hover:bg-white/[0.46] hover:text-[#1b2228]',
                    )}
                    key={filter.id}
                    onClick={() => setActiveSize(filter.id)}
                    type="button"
                  >
                    {filter.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryChips.map((chip) => {
              const isActive = activeCategory === chip.id;

              return (
                <button
                  className={cx(
                    'h-8 shrink-0 rounded-full border px-4 text-[12.5px] font-semibold outline-none backdrop-blur-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
                    isActive
                      ? 'border-[#15181c]/90 bg-[#15181c]/90 text-white shadow-[0_10px_22px_rgba(20,24,28,0.18),inset_0_1px_0_rgba(255,255,255,0.16)]'
                      : 'border-white/45 bg-white/[0.18] text-[#626970] shadow-[inset_0_1px_0_rgba(255,255,255,0.34)] hover:bg-white/[0.38] hover:text-[#1b2228]',
                  )}
                  key={chip.id}
                  onClick={() => setActiveCategory(chip.id)}
                  type="button"
                >
                  {chip.name}
                </button>
              );
            })}
          </div>
        </header>
        <section className="min-h-0 flex-1 overflow-y-auto px-6 pb-7 pt-3 [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.15)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15">
          {filteredWidgets.length > 0 ? (
            <div className="[column-count:1] [column-gap:18px] md:[column-count:2] xl:[column-count:3]">
              {filteredWidgets.map((widget) => (
                <WidgetCard
                  countOnDesktop={existingWidgetCounts[widget.widgetId] ?? 0}
                  isRecentlyAdded={recentlyAddedId === widget.id}
                  key={widget.id}
                  onAdd={handleAddWidget}
                  widget={widget}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-[#6e6e73]">
              <Search className="size-9 opacity-45" />
              <span className="text-sm font-medium">没有找到匹配的小组件</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function WidgetCard({
  countOnDesktop,
  isRecentlyAdded,
  onAdd,
  widget,
}: Readonly<{
  countOnDesktop: number;
  isRecentlyAdded: boolean;
  onAdd(widget: DemoWidget): void;
  widget: DemoWidget;
}>) {
  const added = countOnDesktop > 0 || isRecentlyAdded;

  return (
    <button
      className={cx(
        'group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-[22px] border text-left shadow-[0_12px_30px_rgba(30,42,50,0.10),inset_0_1px_0_rgba(255,255,255,0.38)] outline-none transition-all duration-300 will-change-transform hover:-translate-y-0.5 hover:scale-[1.012] hover:shadow-[0_18px_38px_rgba(30,42,50,0.16),inset_0_1px_0_rgba(255,255,255,0.42)] active:scale-[0.975] focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
        added
          ? 'border-[#0a84ff] shadow-[0_0_0_2px_rgba(10,132,255,0.28),0_12px_26px_rgba(0,0,0,0.14)]'
          : 'border-white/55',
      )}
      onClick={() => onAdd(widget)}
      title={widget.name}
      type="button"
    >
      {added ? (
        <span className="absolute right-2.5 top-2.5 z-20 size-2.5 rounded-full bg-[#0a84ff] shadow-[0_0_0_3px_rgba(10,132,255,0.25)]" />
      ) : null}
      <WidgetFace widget={widget} />
    </button>
  );
}

function WidgetFace({ widget }: Readonly<{ widget: DemoWidget }>) {
  return (
    <div
      className="relative overflow-hidden p-4 text-white"
      style={{ background: widget.gradient, height: widget.height }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.84)_1px,transparent_1px)] opacity-[0.05] [background-size:5px_5px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,255,255,0)_40%)]" />
      <div className="relative z-10 h-full">{renderWidgetFace(widget.template)}</div>
    </div>
  );
}

function renderWidgetFace(template: DemoWidgetTemplate) {
  if (template === 'weather-small') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">☀️ 晴朗</div>
        <div className="mt-4 text-[36px] font-bold leading-none tracking-normal">24°</div>
        <div className="mt-3 text-[11px] font-semibold text-white/76">最高 27° 最低 18°</div>
      </div>
    );
  }

  if (template === 'weather-large') {
    return (
      <div className="flex h-full items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-white/92">☁️ 多云</div>
          <div className="mt-3 text-[36px] font-bold leading-none tracking-normal">21°</div>
          <div className="mt-3 text-[11px] font-semibold text-white/76">体感 20° · 湿度 62%</div>
        </div>
        <div className="text-[42px] drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]">⛅</div>
      </div>
    );
  }

  if (template === 'calendar-small') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">7月</div>
        <div className="mt-2 text-[46px] font-bold leading-none tracking-normal">7</div>
        <div className="mt-3 text-[11px] font-semibold text-white/76">周二 · 2个日程</div>
      </div>
    );
  }

  if (template === 'calendar-week') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">本周</div>
        <WeekRow />
        <div className="mt-3 text-[11px] font-semibold text-white/78">10:00 产品评审会</div>
      </div>
    );
  }

  if (template === 'calendar-month') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">2026年7月</div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }).map((_, index) => (
            <span
              className={cx(
                'rounded-[4px] py-0.5 text-center text-[8px] text-white/70',
                index === 6 ? 'bg-white text-[#1d1d1f]' : '',
              )}
              key={index}
            >
              {index + 1}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (template === 'music') {
    return (
      <div className="flex h-full items-center gap-3">
        <div className="size-[42px] shrink-0 rounded-lg bg-gradient-to-br from-white/35 to-black/25 shadow-[0_4px_10px_rgba(0,0,0,0.35)]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold">夜航星辰</div>
          <div className="mt-1 truncate text-[11px] text-white/74">Moonlight · 陈某某</div>
          <ProgressBar value={46} />
        </div>
      </div>
    );
  }

  if (template === 'music-large') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">每日推荐</div>
        <div className="mt-6 flex h-[70px] items-end justify-center gap-2">
          {[40, 65, 30, 80, 55, 25, 70].map((height, index) => (
            <span
              className="w-2 rounded-full bg-white/85"
              key={index}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="mt-3 text-center text-[11px] font-semibold text-white/72">
          30首 · 2小时18分
        </div>
      </div>
    );
  }

  if (template === 'rings') {
    return (
      <div className="flex h-full items-center justify-center">
        <ProgressRing color="#ff375f" size={72} stroke={7} value={72} />
      </div>
    );
  }

  if (template === 'sleep') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">🌙 睡眠</div>
        <div className="mt-2 text-[28px] font-bold tracking-normal">7小时42分</div>
        <ProgressBar value={78} />
        <div className="mt-2 text-[11px] text-white/72">昨晚 23:10 - 06:52</div>
      </div>
    );
  }

  if (template === 'todo') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">待办事项</div>
        <div className="mt-4 flex flex-col gap-2">
          {['完成设计稿', '回复邮件', '买咖啡豆'].map((task, index) => (
            <div className="flex items-center gap-2 text-[11px] font-semibold" key={task}>
              <span
                className={cx(
                  'size-[13px] rounded-full border-2 border-white/80',
                  index === 0 ? 'bg-white' : '',
                )}
              />
              <span className={index === 0 ? 'text-white/55 line-through' : ''}>{task}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (template === 'timer') {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <ProgressRing color="#ffffff" size={70} stroke={6} value={60} />
        <div className="-mt-[47px] text-[22px] font-bold tabular-nums">18:24</div>
      </div>
    );
  }

  if (template === 'stock') {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold text-white/92">AAPL</div>
          <div className="text-[11px] font-semibold text-[#7cffb2]">+2.34%</div>
        </div>
        <div className="mt-2 text-[26px] font-bold tracking-normal">$213.48</div>
        <svg className="mt-1 h-9 w-full" preserveAspectRatio="none" viewBox="0 0 100 36">
          <polyline
            fill="rgba(255,255,255,0.18)"
            points="0,30 15,24 30,27 45,15 60,20 75,8 90,12 100,4 100,36 0,36"
          />
          <polyline
            fill="none"
            points="0,30 15,24 30,27 45,15 60,20 75,8 90,12 100,4"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  if (template === 'fx') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">USD → CNY</div>
        <div className="mt-3 text-[28px] font-bold tracking-normal">7.15</div>
        <div className="mt-2 text-[11px] text-white/72">↑ 0.02 今日</div>
      </div>
    );
  }

  if (template === 'photo-large') {
    return (
      <div>
        <div className="text-[12px] font-semibold text-white/92">这一天 · 2024</div>
        <div className="mt-3 grid h-[194px] grid-cols-2 gap-1 overflow-hidden rounded-[10px]">
          {[
            'linear-gradient(135deg,rgba(255,255,255,0.35),rgba(0,0,0,0.2))',
            'linear-gradient(135deg,rgba(255,255,255,0.15),rgba(0,0,0,0.35))',
            'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(0,0,0,0.3))',
            'linear-gradient(135deg,rgba(255,255,255,0.2),rgba(0,0,0,0.15))',
          ].map((gradient) => (
            <span key={gradient} style={{ background: gradient }} />
          ))}
        </div>
      </div>
    );
  }

  if (template === 'photo-medium') {
    return (
      <div className="relative -m-4 h-[150px] overflow-hidden p-4">
        <Image className="absolute right-4 top-4 size-9 text-white/60" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4">
          <div className="text-[12px] font-semibold text-white/92">每日精选</div>
          <div className="mt-1 text-[11px] text-white/72">拍摄于 昆明</div>
        </div>
      </div>
    );
  }

  return null;
}

function WeekRow() {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1">
      {weekDays.map((day, index) => (
        <span
          className={cx(
            'rounded-[4px] py-1 text-center text-[9px] text-white/70',
            index === 1 ? 'bg-white font-bold text-[#1d1d1f]' : '',
          )}
          key={day}
        >
          {day}
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ value }: Readonly<{ value: number }>) {
  return (
    <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/25">
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );
}

function ProgressRing({
  color,
  size,
  stroke,
  value,
}: Readonly<{
  color: string;
  size: number;
  stroke: number;
  value: number;
}>) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * value) / 100;
  const center = size / 2;

  return (
    <svg
      aria-hidden
      className="-rotate-90 drop-shadow"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <circle
        cx={center}
        cy={center}
        fill="transparent"
        r={radius}
        stroke="rgba(255,255,255,0.24)"
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        fill="transparent"
        r={radius}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth={stroke}
      />
    </svg>
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
