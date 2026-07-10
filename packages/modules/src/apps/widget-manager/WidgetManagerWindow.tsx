'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckSquare,
  ChevronDown,
  Cloud,
  DollarSign,
  Grid2X2,
  Heart,
  Image,
  Menu,
  Music,
  Search,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import {
  AppFrame,
  useShellSelector,
  type AppFrameProps,
  type AppWindowSurfaceProps,
} from '@kernelon/shell';

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
      { id: 'photos', name: '照片', Icon: Image },
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
const widgetDisplayOrder = new Map(
  [
    'weather-small',
    'calendar-small',
    'stock',
    'music',
    'fx',
    'sleep',
    'rings',
    'todo',
    'photo-medium',
    'weather-large',
    'calendar-week',
    'music-large',
    'timer',
    'photo-large',
    'calendar-month',
  ].map((id, index) => [id, index]),
);
const widgetLayoutClassNames = new Map([
  ['weather-small', 'row-span-4'],
  ['calendar-small', 'row-span-4'],
  ['stock', 'row-span-4'],
  ['music', 'row-span-2'],
  ['fx', 'row-span-2'],
  ['sleep', 'row-span-2'],
  ['rings', 'row-span-3'],
  ['todo', 'row-span-3'],
  ['photo-medium', 'row-span-3'],
  ['weather-large', 'row-span-3'],
  ['calendar-week', 'row-span-3'],
  ['music-large', 'row-span-4'],
  ['timer', 'row-span-2'],
  ['photo-large', 'row-span-4'],
  ['calendar-month', 'row-span-4'],
]);
const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
const widgetManagerHeader: AppFrameProps['header'] = {
  center: [{ id: 'widget-manager-title-control', type: 'slot' }],
  density: 'comfortable',
  identity: { title: '' },
  leading: [{ id: 'widget-manager-menu-control', type: 'slot' }],
  mode: 'standard',
  preset: 'editor',
  trailing: [{ id: 'widget-manager-search-control', type: 'slot' }],
};

export default function WidgetManagerWindow({ window: windowDescriptor }: AppWindowSurfaceProps) {
  const widgets = useShellSelector((state) => state.widgets);
  const screens = useShellSelector((state) => state.screens);
  const currentScreenId = useShellSelector((state) => state.currentScreenId);
  const setPendingWidgetPlacement = useShellSelector((state) => state.setPendingWidgetPlacement);
  const minimizeWindow = useShellSelector((state) => state.minimizeWindow);
  const [activeCategory, setActiveCategory] = useState<DemoWidgetCategory>('all');
  const [activeSize, setActiveSize] = useState<DemoWidgetSizeFilter>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const sidebarState = isSidebarCollapsed ? 'collapsed' : 'expanded';
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
      demoWidgets
        .filter((widget) => {
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
            matchesCategory &&
            matchesSize &&
            matchesSearch &&
            availableWidgetIds.has(widget.widgetId)
          );
        })
        .sort(
          (left, right) =>
            (widgetDisplayOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
            (widgetDisplayOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER),
        ),
    [activeCategory, activeSize, availableWidgetIds, existingWidgetCounts, normalizedQuery],
  );

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  }, []);

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
  const headerSlots = useWidgetManagerHeaderSlots({
    isSidebarCollapsed,
    onQueryChange: setQuery,
    onSidebarToggle: handleSidebarToggle,
    query,
  });

  return (
    <AppFrame header={widgetManagerHeader} headerSlots={headerSlots} scroll="hidden">
      <div
        className={cx(
          'relative grid h-full w-full select-none overflow-hidden bg-[#eef3f7] font-sans text-[#303844] transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isSidebarCollapsed ? 'grid-cols-[88px_minmax(0,1fr)]' : 'grid-cols-[276px_minmax(0,1fr)]',
        )}
        data-sidebar-state={sidebarState}
        data-testid="widget-manager-window"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_77%_2%,rgba(194,211,224,0.30),transparent_33%),radial-gradient(circle_at_16%_100%,rgba(255,255,255,0.82),transparent_42%),linear-gradient(180deg,rgba(248,251,253,0.78),rgba(235,241,246,0.82))]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle,rgba(71,84,101,0.32)_0.55px,transparent_0.75px)] [background-size:7px_7px]" />
        <aside
          className={cx(
            'relative z-10 flex h-full flex-col border-r border-white/60 bg-[linear-gradient(180deg,rgba(238,244,248,0.74),rgba(224,233,240,0.66))] shadow-[inset_-1px_0_0_rgba(255,255,255,0.72),14px_0_40px_rgba(77,91,105,0.05)] backdrop-blur-[30px] transition-[gap,padding,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isSidebarCollapsed
              ? 'gap-4 px-3 pb-5 pt-[18px]'
              : 'gap-5 px-[22px] pb-[22px] pt-[18px]',
          )}
          data-collapsed={String(isSidebarCollapsed)}
          data-surface="frosted-sidebar"
          data-testid="widget-manager-sidebar"
        >
          {sidebarSections.map((section) => (
            <nav className="flex flex-col gap-2" key={section.label} aria-label={section.label}>
              <div
                className={cx(
                  'px-2 text-[12px] font-semibold text-[#4d5664] transition-[height,opacity,transform] duration-300 ease-out',
                  isSidebarCollapsed
                    ? 'h-0 -translate-x-1 overflow-hidden opacity-0'
                    : 'h-[18px] translate-x-0 opacity-100',
                )}
              >
                {section.label}
              </div>
              {section.items.map(({ Icon, id, name }) => {
                const isActive = activeCategory === id;

                return (
                  <button
                    className={cx(
                      'flex h-11 w-full items-center rounded-[14px] text-left text-[15px] font-semibold outline-none transition-[background-color,color,box-shadow,transform,padding,gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
                      isSidebarCollapsed ? 'justify-center gap-0 px-0' : 'justify-start gap-3 px-3',
                      isActive
                        ? 'bg-[#178bff] text-white shadow-[0_14px_26px_rgba(19,132,255,0.24),inset_0_1px_0_rgba(255,255,255,0.46)]'
                        : 'text-[#5f6773] hover:bg-white/54 hover:text-[#27313f]',
                    )}
                    key={id}
                    onClick={() => setActiveCategory(id)}
                    type="button"
                  >
                    <Icon className="size-[19px] shrink-0" strokeWidth={2} />
                    <span
                      className={cx(
                        'truncate transition-[width,opacity,transform] duration-300 ease-out',
                        isSidebarCollapsed
                          ? 'w-0 -translate-x-1 opacity-0'
                          : 'w-auto translate-x-0 opacity-100',
                      )}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </nav>
          ))}
          <div className="mt-auto border-t border-white/58 pt-4">
            <button
              className={cx(
                'flex h-10 w-full items-center rounded-[14px] text-left text-[15px] font-semibold text-[#5f6773] outline-none transition-[background-color,color,padding,gap] duration-300 ease-out hover:bg-white/54 hover:text-[#27313f] focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
                isSidebarCollapsed ? 'justify-center gap-0 px-0' : 'justify-start gap-3 px-3',
              )}
              type="button"
            >
              <Settings className="size-[19px] shrink-0" strokeWidth={2} />
              <span
                className={cx(
                  'transition-[width,opacity,transform] duration-300 ease-out',
                  isSidebarCollapsed
                    ? 'w-0 -translate-x-1 overflow-hidden opacity-0'
                    : 'w-auto translate-x-0 opacity-100',
                )}
              >
                设置
              </span>
            </button>
          </div>
        </aside>
        <main className="relative z-10 flex min-w-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(252,253,254,0.52),rgba(244,248,251,0.58))]">
          <header
            className="shrink-0 px-[28px] pb-[18px] pt-[24px]"
            data-testid="widget-manager-toolbar"
          >
            <div className="flex items-center justify-between gap-5">
              <div className="flex min-w-0 gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categoryChips.map((chip) => {
                  const isActive = activeCategory === chip.id;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={cx(
                        'h-9 shrink-0 rounded-full border px-5 text-[14px] font-semibold outline-none backdrop-blur-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
                        isActive
                          ? 'border-[#111820] bg-[#111820] text-white shadow-[0_12px_22px_rgba(24,31,42,0.16),inset_0_1px_0_rgba(255,255,255,0.16)]'
                          : 'border-white/70 bg-white/40 text-[#384150] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] hover:bg-white/70',
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
              <div className="flex h-9 shrink-0 items-center gap-2 rounded-[13px] border border-white/68 bg-white/44 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_18px_rgba(73,86,101,0.06)] backdrop-blur-xl">
                {sizeFilters.map((filter) => {
                  const isActive = activeSize === filter.id;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={cx(
                        'inline-flex h-8 min-w-10 items-center justify-center gap-1 rounded-[9px] px-3 text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
                        isActive
                          ? 'bg-white text-[#101722] shadow-[0_6px_14px_rgba(40,50,65,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]'
                          : 'text-[#7a828d] hover:bg-white/60 hover:text-[#27313f]',
                      )}
                      key={filter.id}
                      onClick={() => setActiveSize(filter.id)}
                      type="button"
                    >
                      {filter.name}
                      {filter.id === 'all' ? <ChevronDown className="size-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>
          <section className="min-h-0 flex-1 overflow-y-auto px-[26px] pb-[28px] pt-[2px] [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.18)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/18">
            {filteredWidgets.length > 0 ? (
              <div
                className="grid auto-rows-[56px] grid-cols-[minmax(0,1.12fr)_minmax(0,0.8fr)_minmax(0,0.95fr)] gap-[14px] pr-2"
                data-testid="widget-manager-grid"
              >
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
    </AppFrame>
  );
}

function useWidgetManagerHeaderSlots({
  isSidebarCollapsed,
  onQueryChange,
  onSidebarToggle,
  query,
}: Readonly<{
  isSidebarCollapsed: boolean;
  onQueryChange(query: string): void;
  onSidebarToggle(): void;
  query: string;
}>) {
  const menuControl = useMemo(
    () => (
      <button
        aria-expanded={!isSidebarCollapsed}
        aria-label={isSidebarCollapsed ? '展开小组件侧栏' : '收起小组件侧栏'}
        className={cx(
          'absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[11px] border text-[#424b58] outline-none backdrop-blur-xl transition-[left,background-color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/62 hover:bg-white/46 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
          isSidebarCollapsed ? 'left-[76px]' : 'left-[234px]',
          isSidebarCollapsed
            ? 'border-white/58 bg-white/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_8px_18px_rgba(65,78,92,0.08)]'
            : 'border-transparent bg-transparent shadow-none',
        )}
        onClick={onSidebarToggle}
        type="button"
      >
        <Menu className="size-5" strokeWidth={1.9} />
      </button>
    ),
    [isSidebarCollapsed, onSidebarToggle],
  );
  const titleControl = useMemo(
    () => (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center text-[15px] font-semibold text-[#303845] [text-shadow:0_1px_0_rgba(255,255,255,0.86)]"
        data-testid="widget-manager-title-control"
      >
        Widgets 管理
      </div>
    ),
    [],
  );
  const searchControl = useMemo(
    () => (
      <label className="flex h-10 w-[226px] items-center gap-2 rounded-[18px] border border-white/70 bg-white/46 px-3.5 text-[#5d6673] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_24px_rgba(48,61,74,0.07)] backdrop-blur-xl transition-all duration-200 focus-within:bg-white/74 focus-within:ring-2 focus-within:ring-white/80">
        <Search className="size-4 shrink-0" strokeWidth={2.2} />
        <input
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#1f2937] outline-none placeholder:text-[#808894]"
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="搜索"
          type="search"
          value={query}
        />
      </label>
    ),
    [onQueryChange, query],
  );

  return useMemo(
    () => ({
      'widget-manager-menu-control': menuControl,
      'widget-manager-search-control': searchControl,
      'widget-manager-title-control': titleControl,
    }),
    [menuControl, searchControl, titleControl],
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
        'group relative block h-full min-h-[112px] overflow-hidden rounded-[18px] border text-left shadow-[0_10px_24px_rgba(31,42,55,0.13),inset_0_1px_0_rgba(255,255,255,0.38)] outline-none transition-all duration-300 will-change-transform hover:-translate-y-0.5 hover:scale-[1.006] hover:shadow-[0_16px_32px_rgba(31,42,55,0.17),inset_0_1px_0_rgba(255,255,255,0.42)] active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35',
        resolveWidgetLayoutClassName(widget.id),
        added
          ? 'border-[#0a84ff] shadow-[0_0_0_2px_rgba(10,132,255,0.28),0_12px_26px_rgba(0,0,0,0.14)]'
          : 'border-white/80',
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
      className="relative h-full overflow-hidden p-4 text-white"
      style={{ background: widget.gradient }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.84)_1px,transparent_1px)] opacity-[0.05] [background-size:5px_5px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,255,255,0)_40%)]" />
      <div className="relative z-10 h-full">{renderWidgetFace(widget.template)}</div>
    </div>
  );
}

function resolveWidgetLayoutClassName(widgetId: string): string {
  return widgetLayoutClassNames.get(widgetId) ?? 'row-span-3';
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
