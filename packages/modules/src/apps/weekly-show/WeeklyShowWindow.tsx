'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  FileCheck2,
  Flower2,
  Gift,
  Heart,
  History,
  Home,
  PanelLeft,
  Search,
  Send,
  Settings,
} from 'lucide-react';

import { AppFrame, type AppFrameProps, type AppWindowSurfaceProps } from '@kernelon/shell';

import {
  categoryStyles,
  weeklyShowCategories,
  weeklyShowEntries,
  type WeeklyShowCategory,
  type WeeklyShowEntry,
} from './data';

const weeklyShowHeader: AppFrameProps['header'] = {
  center: [{ id: 'weekly-show-title', type: 'slot' }],
  density: 'comfortable',
  identity: { title: '' },
  leading: [{ id: 'weekly-show-leading', type: 'slot' }],
  mode: 'standard',
  preset: 'editor',
  trailing: [{ id: 'weekly-show-trailing', type: 'slot' }],
};

const navItems = [
  { Icon: Home, id: 'stage', label: '本周舞台' },
  { Icon: FileCheck2, id: 'submissions', label: '我的投稿' },
  { Icon: History, id: 'history', label: '历史展台' },
  { Icon: Settings, id: 'settings', label: '设置' },
] as const;

type WeeklyShowNavId = (typeof navItems)[number]['id'];
type WeeklyShowReaction = 'coffee' | 'flower' | 'like';
type WeeklyShowSort = 'score' | 'latest' | 'likes';

interface NavHistoryState {
  entries: WeeklyShowNavId[];
  index: number;
}

interface ReactionCounts {
  coffee: number;
  flower: number;
  like: number;
}

const navLabels = Object.fromEntries(navItems.map(({ id, label }) => [id, label])) as Record<
  WeeklyShowNavId,
  string
>;

const sortOptions: { id: WeeklyShowSort; label: string }[] = [
  { id: 'score', label: '互动得分' },
  { id: 'latest', label: '最新投稿' },
  { id: 'likes', label: '点赞数量' },
];

const avatarUrl = '/kernelon-assets/avatars/current-user.png';
const spriteUrl = '/kernelon-assets/weekly-show/works-sprite.png';

export default function WeeklyShowWindow(props: AppWindowSurfaceProps) {
  void props;
  const [activeCategory, setActiveCategory] = useState<WeeklyShowCategory>('全部');
  const [navHistory, dispatchNavigation] = useReducer(navigationReducer, {
    entries: ['stage'],
    index: 0,
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openHeaderMenu, setOpenHeaderMenu] = useState<'notifications' | 'user' | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<WeeklyShowSort>('score');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [reactions, setReactions] = useState<Record<string, ReactionCounts>>({});
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const activeNav = navHistory.entries[navHistory.index] ?? 'stage';
  const weekMeta = useMemo(() => getWeekMeta(weekOffset), [weekOffset]);
  const navigate = useCallback((id: WeeklyShowNavId) => {
    dispatchNavigation({ id, type: 'navigate' });
  }, []);
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value && activeNav !== 'stage') {
        navigate('stage');
      }
    },
    [activeNav, navigate],
  );
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return weeklyShowEntries
      .filter(
        (entry) =>
          (activeCategory === '全部' || entry.category === activeCategory) &&
          (!normalizedQuery ||
            entry.title.toLocaleLowerCase().includes(normalizedQuery) ||
            entry.author.toLocaleLowerCase().includes(normalizedQuery) ||
            entry.description.toLocaleLowerCase().includes(normalizedQuery)),
      )
      .sort((left, right) => compareEntries(left, right, sortMode, reactions));
  }, [activeCategory, query, reactions, sortMode]);
  const handleReaction = useCallback((entryId: string, reaction: WeeklyShowReaction) => {
    setReactions((current) => {
      const previous = current[entryId] ?? { coffee: 0, flower: 0, like: 0 };

      return {
        ...current,
        [entryId]: { ...previous, [reaction]: previous[reaction] + 1 },
      };
    });
  }, []);
  const headerSlots = useWeeklyShowHeaderSlots({
    activeNav,
    canGoBack: navHistory.index > 0,
    canGoForward: navHistory.index < navHistory.entries.length - 1,
    hasUnreadNotifications,
    isSidebarCollapsed,
    onBack: () => dispatchNavigation({ type: 'back' }),
    onForward: () => dispatchNavigation({ type: 'forward' }),
    onMarkNotificationsRead: () => setHasUnreadNotifications(false),
    onMenuChange: setOpenHeaderMenu,
    onNavigate: navigate,
    onQueryChange: handleQueryChange,
    onSidebarToggle: () => setIsSidebarCollapsed((current) => !current),
    openMenu: openHeaderMenu,
    query,
  });

  return (
    <AppFrame
      contentClassName="!bg-transparent"
      className="relative [&_[data-app-header-row=primary]]:min-h-[64px] [&_[data-app-window-controls=true]]:top-8 [&_[data-kernelon-app-header=true]]:absolute [&_[data-kernelon-app-header=true]]:inset-x-0 [&_[data-kernelon-app-header=true]]:top-0 [&_[data-kernelon-app-header=true]]:z-30 [&_[data-kernelon-app-header=true]]:h-16 [&_[data-kernelon-app-header=true]]:min-h-16 [&_[data-kernelon-app-header=true]]:overflow-visible [&_[data-kernelon-app-header=true]]:border-0 [&_[data-kernelon-app-header=true]]:bg-transparent [&_[data-kernelon-app-header=true]]:shadow-none [&_[data-kernelon-app-header=true]]:![backdrop-filter:none]"
      header={weeklyShowHeader}
      headerSlots={headerSlots}
      scroll="hidden"
    >
      <div
        className={`grid h-full min-h-0 overflow-hidden bg-[linear-gradient(145deg,rgba(214,237,255,0.96),rgba(234,244,252,0.86)_48%,rgba(207,225,241,0.92))] text-[#202124] transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isSidebarCollapsed ? 'grid-cols-[96px_minmax(0,1fr)]' : 'grid-cols-[286px_minmax(0,1fr)]'
        }`}
        data-sidebar-state={isSidebarCollapsed ? 'collapsed' : 'expanded'}
        data-testid="weekly-show-window"
      >
        <aside
          className={`relative z-10 overflow-hidden pb-6 pt-[82px] shadow-[inset_0_1px_0_rgba(255,255,255,0.74)] transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSidebarCollapsed ? 'px-3' : 'px-4'
          }`}
          data-collapsed={String(isSidebarCollapsed)}
          data-surface="frosted-sidebar"
          data-testid="weekly-show-sidebar"
        >
          <div className="relative flex h-full flex-col">
            <div
              className={`mb-6 flex items-center py-2 transition-[gap,padding] duration-300 ${
                isSidebarCollapsed ? 'justify-center gap-0 pl-0 pr-6' : 'gap-3 px-3'
              }`}
            >
              <img
                alt="Weekly Show"
                className="size-9 shrink-0 rounded-[10px] object-cover shadow-[0_5px_12px_rgba(36,107,187,0.24)]"
                src="/kernelon-assets/dock-icons/weekly-show.png"
              />
              <span
                className={`overflow-hidden whitespace-nowrap text-[20px] font-bold tracking-[-0.02em] text-[#17202a] transition-[width,opacity,transform] duration-300 ${
                  isSidebarCollapsed
                    ? 'w-0 -translate-x-1 opacity-0'
                    : 'w-[150px] translate-x-0 opacity-100'
                }`}
              >
                Weekly Show
              </span>
            </div>
            <nav aria-label="Weekly Show 导航" className="mr-6 space-y-2">
              {navItems.map(({ Icon, id, label }) => {
                const active = id === activeNav;

                return (
                  <button
                    aria-current={active ? 'page' : undefined}
                    aria-label={isSidebarCollapsed ? label : undefined}
                    className={`relative flex h-[58px] w-full items-center rounded-[29px] text-[17px] font-semibold outline-none transition-[gap,padding,background-color,color,box-shadow,transform] duration-300 focus-visible:ring-2 focus-visible:ring-[#2488ee]/40 active:scale-[0.98] ${
                      isSidebarCollapsed
                        ? 'justify-center gap-0 px-0'
                        : 'justify-start gap-4 px-[22px]'
                    } ${
                      active
                        ? 'z-10 bg-white/84 text-[#438cf2] shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_10px_24px_rgba(69,113,160,0.09)]'
                        : 'text-[#647181] hover:bg-white/38 hover:text-[#354253]'
                    }`}
                    key={id}
                    onClick={() => navigate(id)}
                    type="button"
                  >
                    <Icon
                      className="size-[23px]"
                      fill={active && id === 'stage' ? 'currentColor' : 'none'}
                      strokeWidth={2}
                    />
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[width,opacity,transform] duration-300 ${
                        isSidebarCollapsed
                          ? 'w-0 -translate-x-1 opacity-0'
                          : 'w-[120px] translate-x-0 opacity-100'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div
              className={`mt-auto overflow-hidden px-4 text-[11px] font-medium leading-5 text-[#7d8996] transition-[height,opacity] duration-300 ${
                isSidebarCollapsed ? 'h-0 opacity-0' : 'h-10 opacity-100'
              }`}
            >
              <p>每周发现好创意</p>
              <p>让灵感被看见</p>
            </div>
          </div>
        </aside>

        <div
          className="relative z-20 ml-[-24px] min-h-0 overflow-hidden rounded-l-[28px] bg-white before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-7 before:rounded-l-[28px] before:border-y before:border-l before:border-[#a9c2d3] before:content-['']"
          data-surface="stacked-content-panel"
          data-testid="weekly-show-content-panel"
        >
          <main
            className="h-full min-h-0 overflow-y-auto px-[clamp(34px,4vw,64px)] pb-10 pt-[96px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            data-testid="weekly-show-content-scroll"
          >
            {activeNav === 'stage' ? (
              <section className="w-full max-w-[1170px]" data-testid="weekly-show-stage">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h1 className="text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#111317]">
                      Weekly Show 第 {21 + weekOffset} 期
                    </h1>
                    <p className="mt-2 text-[17px] font-medium text-[#7e8187]">
                      每周精选优质作品，发现和分享创意与灵感
                    </p>
                  </div>
                  <div className="flex h-12 min-w-[350px] items-center justify-between rounded-[24px] border border-[#eceef1] bg-[#fafafa] px-3 text-[16px] text-[#666a70] shadow-[inset_0_1px_0_#fff]">
                    <button
                      aria-label="上一周"
                      className="rounded-full p-1.5 outline-none transition hover:bg-white active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
                      onClick={() => setWeekOffset((value) => value - 1)}
                      type="button"
                    >
                      <ChevronLeft className="size-[18px]" />
                    </button>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-[17px] text-[#888d93]" />
                      <strong className="text-[#3f4247]">第 {21 + weekOffset} 周</strong>
                      <span className="ml-2 tabular-nums">{weekMeta.range}</span>
                    </div>
                    <button
                      aria-label="下一周"
                      className="rounded-full p-1.5 outline-none transition hover:bg-white active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
                      onClick={() => setWeekOffset((value) => value + 1)}
                      type="button"
                    >
                      <ChevronRight className="size-[18px]" />
                    </button>
                  </div>
                </div>

                <StageTimeline weekOffset={weekOffset} />

                <div
                  className="mt-[26px] flex items-center justify-between gap-5"
                  data-testid="weekly-show-filters"
                >
                  <div className="flex min-w-0 gap-2.5 overflow-x-auto [scrollbar-width:none]">
                    {weeklyShowCategories.map((category) => {
                      const active = category === activeCategory;

                      return (
                        <button
                          aria-pressed={active}
                          className={`h-8 shrink-0 rounded-full px-[19px] text-[13px] font-medium transition ${
                            active
                              ? 'bg-[#2488ee] text-white shadow-[0_7px_16px_rgba(36,136,238,0.20)]'
                              : 'bg-[#f5f5f5] text-[#64666a] hover:bg-[#eceff3]'
                          }`}
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          type="button"
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative shrink-0">
                    <button
                      aria-expanded={isSortMenuOpen}
                      aria-haspopup="menu"
                      className="flex items-center gap-2 rounded-[12px] px-2.5 py-2 text-[13px] text-[#777b81] outline-none transition hover:bg-[#f5f7f9] focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
                      onClick={() => setIsSortMenuOpen((current) => !current)}
                      type="button"
                    >
                      排序：
                      <strong className="text-[#4c5055]">
                        {sortOptions.find(({ id }) => id === sortMode)?.label}
                      </strong>
                      <ChevronDown
                        className={`size-4 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isSortMenuOpen ? (
                      <div
                        aria-label="作品排序"
                        className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[148px] rounded-[14px] border border-[#e6eaee] bg-white p-1.5 shadow-[0_16px_38px_rgba(37,52,67,0.14)]"
                        role="menu"
                      >
                        {sortOptions.map((option) => (
                          <button
                            aria-checked={sortMode === option.id}
                            className={`flex h-9 w-full items-center rounded-[10px] px-3 text-left text-[13px] outline-none transition focus-visible:ring-2 focus-visible:ring-[#2488ee]/35 ${
                              sortMode === option.id
                                ? 'bg-[#edf6ff] font-semibold text-[#247fd9]'
                                : 'text-[#59616a] hover:bg-[#f4f6f8]'
                            }`}
                            key={option.id}
                            onClick={() => {
                              setSortMode(option.id);
                              setIsSortMenuOpen(false);
                            }}
                            role="menuitemradio"
                            type="button"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {filteredEntries.length > 0 ? (
                  <div
                    className="mt-[22px] grid grid-cols-3 gap-x-5 gap-y-[18px]"
                    data-testid="weekly-show-grid"
                  >
                    {filteredEntries.map((entry, index) => (
                      <EntryCard
                        entry={entry}
                        key={entry.id}
                        onReact={(reaction) => handleReaction(entry.id, reaction)}
                        rank={index < 3 ? index + 1 : undefined}
                        reactionCounts={reactions[entry.id] ?? { coffee: 0, flower: 0, like: 0 }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-24 flex flex-col items-center text-[#8a8f95]">
                    <Search className="mb-3 size-8 opacity-45" />
                    <p className="text-sm font-medium">没有找到匹配的作品</p>
                  </div>
                )}
              </section>
            ) : (
              <WeeklyShowSecondaryView
                activeNav={activeNav}
                emailNotificationsEnabled={emailNotificationsEnabled}
                onEmailNotificationsChange={setEmailNotificationsEnabled}
                onNavigate={navigate}
                onSelectWeek={(selectedWeek) => {
                  setWeekOffset(selectedWeek - 21);
                  navigate('stage');
                }}
                onWeeklyDigestChange={setWeeklyDigestEnabled}
                weeklyDigestEnabled={weeklyDigestEnabled}
              />
            )}
          </main>
        </div>
      </div>
    </AppFrame>
  );
}

function WeeklyShowSecondaryView({
  activeNav,
  emailNotificationsEnabled,
  onEmailNotificationsChange,
  onNavigate,
  onSelectWeek,
  onWeeklyDigestChange,
  weeklyDigestEnabled,
}: Readonly<{
  activeNav: Exclude<WeeklyShowNavId, 'stage'>;
  emailNotificationsEnabled: boolean;
  onEmailNotificationsChange(value: boolean): void;
  onNavigate(id: WeeklyShowNavId): void;
  onSelectWeek(week: number): void;
  onWeeklyDigestChange(value: boolean): void;
  weeklyDigestEnabled: boolean;
}>) {
  if (activeNav === 'submissions') {
    return (
      <section className="w-full max-w-[980px]" data-testid="weekly-show-submissions">
        <PageHeading description="查看作品状态，并在开放期继续完善投稿。" title="我的投稿" />
        <div className="mt-8 overflow-hidden rounded-[18px] border border-[#e8ebee] bg-white shadow-[0_12px_34px_rgba(39,52,66,0.05)]">
          {weeklyShowEntries.slice(0, 2).map((entry, index) => (
            <article
              className="flex items-center gap-5 border-b border-[#eef0f2] px-5 py-5 last:border-b-0"
              key={entry.id}
            >
              <div
                aria-label={`${entry.title}作品封面`}
                className="h-[78px] w-[128px] shrink-0 rounded-[12px] bg-cover"
                role="img"
                style={{
                  backgroundImage: `url(${spriteUrl})`,
                  backgroundPosition: entry.spritePosition,
                  backgroundSize: '300% 200%',
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-[#282d33]">{entry.title}</h2>
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                      index === 0 ? 'bg-[#e9f4ff] text-[#2d83d8]' : 'bg-[#fff3df] text-[#bc7826]'
                    }`}
                  >
                    {index === 0 ? '投票中' : '待完善'}
                  </span>
                </div>
                <p className="mt-2 truncate text-[13px] text-[#858b92]">{entry.description}</p>
              </div>
              <div className="text-right text-[12px] text-[#92969b]">
                <strong className="block text-[20px] text-[#ef514b]">
                  {formatScore(entry.score)}
                </strong>
                当前得分
              </div>
            </article>
          ))}
        </div>
        <button
          className="mt-6 rounded-[12px] bg-[#2488ee] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(36,136,238,0.2)] outline-none transition hover:bg-[#167ee5] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#2488ee]/40 focus-visible:ring-offset-2"
          onClick={() => onNavigate('stage')}
          type="button"
        >
          返回本周舞台
        </button>
      </section>
    );
  }

  if (activeNav === 'history') {
    return (
      <section className="w-full max-w-[980px]" data-testid="weekly-show-history">
        <PageHeading description="回看往期入选作品与创意主题。" title="历史展台" />
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[20, 19, 18, 17, 16, 15].map((week, index) => (
            <button
              className="group rounded-[18px] border border-[#e7eaed] bg-white p-5 text-left shadow-[0_8px_24px_rgba(38,51,64,0.04)] outline-none transition hover:-translate-y-0.5 hover:border-[#cfe2f5] hover:shadow-[0_14px_30px_rgba(38,82,122,0.09)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
              key={week}
              onClick={() => onSelectWeek(week)}
              type="button"
            >
              <span className="text-[12px] font-semibold text-[#8b9198]">第 {week} 期</span>
              <strong className="mt-3 block text-[18px] text-[#2b3036]">
                {
                  [
                    '城市与自然',
                    '微小而确定',
                    '未来工作方式',
                    '光影实验',
                    '身边的手艺',
                    '重新发现日常',
                  ][index]
                }
              </strong>
              <span className="mt-6 flex items-center justify-between text-[12px] text-[#8b9198]">
                6 件入选作品
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[760px]" data-testid="weekly-show-settings">
      <PageHeading description="管理 Weekly Show 的提醒与内容偏好。" title="设置" />
      <div className="mt-8 overflow-hidden rounded-[18px] border border-[#e7eaed] bg-white px-6 shadow-[0_10px_30px_rgba(39,52,66,0.045)]">
        <SettingToggle
          checked={emailNotificationsEnabled}
          description="投稿状态和互动变化时发送站内通知。"
          label="互动提醒"
          onChange={onEmailNotificationsChange}
        />
        <SettingToggle
          checked={weeklyDigestEnabled}
          description="每周五汇总本周高分作品与下一期主题。"
          label="每周精选摘要"
          onChange={onWeeklyDigestChange}
        />
      </div>
    </section>
  );
}

function PageHeading({ description, title }: Readonly<{ description: string; title: string }>) {
  return (
    <div>
      <h1 className="text-[32px] font-bold leading-tight tracking-[-0.035em] text-[#111317]">
        {title}
      </h1>
      <p className="mt-2 text-[17px] font-medium text-[#7e8187]">{description}</p>
    </div>
  );
}

function SettingToggle({
  checked,
  description,
  label,
  onChange,
}: Readonly<{
  checked: boolean;
  description: string;
  label: string;
  onChange(value: boolean): void;
}>) {
  return (
    <div className="flex items-center justify-between border-b border-[#edf0f2] py-5 last:border-b-0">
      <div>
        <strong className="text-[15px] font-semibold text-[#30353b]">{label}</strong>
        <p className="mt-1 text-[13px] text-[#888e95]">{description}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`relative h-7 w-12 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2488ee]/40 focus-visible:ring-offset-2 ${
          checked ? 'bg-[#2488ee]' : 'bg-[#cbd1d7]'
        }`}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={`absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function StageTimeline({ weekOffset }: Readonly<{ weekOffset: number }>) {
  const currentWeek = getWeekMeta(weekOffset);
  const previousWeek = getWeekMeta(weekOffset - 1);

  return (
    <div
      className="mt-[28px] flex h-[114px] items-center rounded-[14px] border border-[#e9ebee] bg-white px-7 shadow-[0_8px_28px_rgba(38,50,62,0.025)]"
      data-testid="weekly-show-timeline"
    >
      <TimelineStep Icon={Send} date={previousWeek.range} label="投稿阶段" />
      <div className="mx-4 h-px flex-1 bg-[#d9dde1]" />
      <TimelineStep Icon={BarChart3} active date={currentWeek.range} label="投票阶段" />
      <div className="mx-4 h-px flex-1 bg-[#d9dde1]" />
      <TimelineStep Icon={Gift} date={currentWeek.resultRange} label="结果公示" />
      <div className="ml-8 min-w-[174px] rounded-[10px] border border-[#e9eef5] bg-[#f7faff] px-5 py-3 text-center">
        <p className="text-[12px] text-[#85888d]">投票截止</p>
        <p className="mt-1 text-[15px] font-bold text-[#3289ee]">{currentWeek.deadline} 18:00</p>
      </div>
    </div>
  );
}

function TimelineStep({
  Icon,
  active = false,
  date,
  label,
}: Readonly<{ Icon: typeof Send; active?: boolean; date: string; label: string }>) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        className={`flex size-[50px] items-center justify-center rounded-full border ${active ? 'border-[#3e9af2] bg-[#2f91ed] text-white shadow-[0_8px_18px_rgba(47,145,237,0.22)]' : 'border-[#eceef0] bg-white text-[#3f444a]'}`}
      >
        <Icon className="size-[23px]" strokeWidth={active ? 2.8 : 1.9} />
      </span>
      <span>
        <strong className="block text-[16px] font-semibold text-[#484b50]">{label}</strong>
        <span className="mt-1 block text-[13px] text-[#888b90]">{date}</span>
      </span>
    </div>
  );
}

function EntryCard({
  entry,
  onReact,
  rank,
  reactionCounts,
}: Readonly<{
  entry: WeeklyShowEntry;
  onReact(reaction: WeeklyShowReaction): void;
  rank?: number;
  reactionCounts: ReactionCounts;
}>) {
  const reactionBonus = getReactionTotal(reactionCounts);

  return (
    <article className="group relative overflow-hidden rounded-[12px] border border-[#e7e9eb] bg-white shadow-[0_6px_20px_rgba(28,39,49,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(28,39,49,0.09)]">
      <div
        aria-label={`${entry.title}作品封面`}
        className="aspect-[16/6.65] w-full bg-cover"
        role="img"
        style={{
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: entry.spritePosition,
          backgroundSize: '300% 200%',
        }}
      />
      {rank ? <RankRibbon rank={rank} /> : null}
      <div className="px-3.5 pb-3 pt-3">
        <div className="flex items-center gap-2 text-[13px] text-[#868a90]">
          <img
            alt=""
            className="size-5 rounded-full object-cover ring-1 ring-black/5"
            src={avatarUrl}
          />
          <span className="truncate">
            {entry.author} · {entry.employeeId}
          </span>
          <span
            className={`ml-1 rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium ${categoryStyles[entry.category]}`}
          >
            {entry.category}
          </span>
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#2b2e32]">
              {entry.title}
            </h2>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.55] text-[#858a91]">
              {entry.description}
            </p>
          </div>
          <div className="text-right">
            <strong className="block text-[22px] leading-none text-[#ef4d47]">
              {formatScore(entry.score + reactionBonus)}
            </strong>
            <span className="mt-1 block text-[10px] text-[#96999d]">互动得分</span>
          </div>
        </div>
      </div>
      <div className="flex h-14 items-center justify-between border-t border-[#eff0f1] px-3.5 text-[13px] text-[#81858a]">
        <button
          aria-label={`送咖啡 ${entry.title}`}
          className="flex items-center gap-1.5 rounded-md outline-none transition hover:text-[#d88935] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#d88935]/35"
          onClick={() => onReact('coffee')}
          type="button"
        >
          <Coffee className="size-4 text-[#c39454]" />
          送咖啡 {entry.coffees + reactionCounts.coffee}
        </button>
        <button
          aria-label={`送鲜花 ${entry.title}`}
          className="flex items-center gap-1.5 rounded-md outline-none transition hover:text-[#d85f81] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#d85f81]/35"
          onClick={() => onReact('flower')}
          type="button"
        >
          <Flower2 className="size-4 text-[#df6f8d]" />
          送鲜花 {entry.flowers + reactionCounts.flower}
        </button>
        <button
          aria-label={`点赞 ${entry.title}`}
          className="flex items-center gap-1.5 rounded-md outline-none transition hover:text-[#ee5751] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#ee5751]/35"
          onClick={() => onReact('like')}
          type="button"
        >
          <Heart className="size-4 fill-[#ef5c55] text-[#ef5c55]" />
          点赞 {entry.likes + reactionCounts.like}
        </button>
      </div>
    </article>
  );
}

function RankRibbon({ rank }: Readonly<{ rank: number }>) {
  const tone = rank === 1 ? 'bg-[#ffb526]' : rank === 2 ? 'bg-[#aeb7c1]' : 'bg-[#d87931]';

  return (
    <span
      className={`absolute -right-[38px] top-[13px] w-[126px] rotate-45 py-1 text-center text-[11px] font-bold tracking-[0.08em] text-white shadow-sm ${tone}`}
    >
      TOP {rank}
    </span>
  );
}

function useWeeklyShowHeaderSlots({
  activeNav,
  canGoBack,
  canGoForward,
  hasUnreadNotifications,
  isSidebarCollapsed,
  onBack,
  onForward,
  onMarkNotificationsRead,
  onMenuChange,
  onNavigate,
  onQueryChange,
  onSidebarToggle,
  openMenu,
  query,
}: Readonly<{
  activeNav: WeeklyShowNavId;
  canGoBack: boolean;
  canGoForward: boolean;
  hasUnreadNotifications: boolean;
  isSidebarCollapsed: boolean;
  onBack(): void;
  onForward(): void;
  onMarkNotificationsRead(): void;
  onMenuChange(menu: 'notifications' | 'user' | null): void;
  onNavigate(id: WeeklyShowNavId): void;
  onQueryChange(value: string): void;
  onSidebarToggle(): void;
  openMenu: 'notifications' | 'user' | null;
  query: string;
}>) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        const searchInput = searchInputRef.current;

        if (
          !searchInput ||
          (typeof searchInput.checkVisibility === 'function' && !searchInput.checkVisibility())
        ) {
          return;
        }

        event.preventDefault();
        searchInput.focus();
      }

      if (event.key === 'Escape') {
        onMenuChange(null);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [onMenuChange]);

  return useMemo(
    () => ({
      'weekly-show-leading': (
        <div
          className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-2.5 transition-[left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSidebarCollapsed ? 'left-[122px]' : 'left-[312px]'
          }`}
          data-testid="weekly-show-leading-controls"
        >
          <button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? '展开 Weekly Show 侧栏' : '收起 Weekly Show 侧栏'}
            className="flex size-9 items-center justify-center rounded-[12px] border border-white/65 bg-white/64 text-[#3d434a] shadow-[0_4px_10px_rgba(39,55,72,0.05)] outline-none transition hover:bg-white/88 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
            onClick={onSidebarToggle}
            type="button"
          >
            <PanelLeft className="size-[18px]" />
          </button>
          <div className="flex h-9 items-center overflow-hidden rounded-[12px] border border-white/65 bg-white/64 shadow-[0_4px_10px_rgba(39,55,72,0.05)]">
            <button
              aria-label="后退"
              className="flex h-full w-9 items-center justify-center text-[#353a40] outline-none transition hover:bg-white active:scale-95 focus-visible:bg-white disabled:cursor-not-allowed disabled:text-[#b6bbc1]"
              disabled={!canGoBack}
              onClick={onBack}
              type="button"
            >
              <ChevronLeft className="size-[18px]" />
            </button>
            <span className="h-4 w-px bg-[#e4e7ea]" />
            <button
              aria-label="前进"
              className="flex h-full w-9 items-center justify-center text-[#353a40] outline-none transition hover:bg-white active:scale-95 focus-visible:bg-white disabled:cursor-not-allowed disabled:text-[#b6bbc1]"
              disabled={!canGoForward}
              onClick={onForward}
              type="button"
            >
              <ChevronRight className="size-[18px]" />
            </button>
          </div>
        </div>
      ),
      'weekly-show-title': (
        <div
          className={`pointer-events-none absolute right-[530px] top-1/2 -translate-y-1/2 text-center text-[16px] font-bold tracking-[-0.01em] text-[#202328] transition-[left] duration-500 ${
            isSidebarCollapsed ? 'left-[72px]' : 'left-[262px]'
          }`}
          data-testid="weekly-show-title-control"
        >
          {navLabels[activeNav]}
        </div>
      ),
      'weekly-show-trailing': (
        <div className="contents">
          <label className="absolute right-[180px] top-1/2 flex h-10 w-[330px] -translate-y-1/2 items-center gap-2 rounded-[20px] border border-[#edf0f3] bg-[#fafbfc]/92 px-4 text-[#7a8189] shadow-[0_5px_14px_rgba(30,45,61,0.03)]">
            <Search className="size-[17px] shrink-0" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#30343a] outline-none placeholder:text-[#8e949b]"
              onChange={(event) => onQueryChange(event.currentTarget.value)}
              placeholder="搜索作品、作者或内容"
              ref={searchInputRef}
              type="search"
              value={query}
            />
            <span className="text-[12px] font-semibold text-[#9ca1a7]">Ctrl K</span>
          </label>
          <div className="absolute right-[120px] top-1/2 -translate-y-1/2">
            <button
              aria-expanded={openMenu === 'notifications'}
              aria-haspopup="menu"
              aria-label="通知"
              className="relative flex size-9 items-center justify-center rounded-full outline-none transition hover:bg-black/[0.04] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
              onClick={() => onMenuChange(openMenu === 'notifications' ? null : 'notifications')}
              type="button"
            >
              <Bell className="size-[19px]" strokeWidth={2} />
              {hasUnreadNotifications ? (
                <span className="absolute right-[7px] top-[6px] size-1.5 rounded-full bg-[#ef5750] ring-2 ring-white" />
              ) : null}
            </button>
            {openMenu === 'notifications' ? (
              <div
                className="absolute right-0 top-[46px] z-40 w-[286px] rounded-[16px] border border-[#e6e9ed] bg-white p-3 shadow-[0_18px_48px_rgba(34,48,63,0.16)]"
                role="menu"
              >
                <div className="flex items-center justify-between px-1 pb-2">
                  <strong className="text-[14px] text-[#2d3238]">通知</strong>
                  <button
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-[#2d83d8] outline-none hover:bg-[#edf6ff] focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
                    onClick={onMarkNotificationsRead}
                    role="menuitem"
                    type="button"
                  >
                    全部标为已读
                  </button>
                </div>
                <div className="rounded-[12px] bg-[#f5f8fb] px-3 py-3 text-[12px] leading-5 text-[#636b74]">
                  <strong className="block text-[#343a41]">《鲸落之境》进入本周 TOP 1</strong>
                  作品新增了 24 次互动 · 10 分钟前
                </div>
              </div>
            ) : null}
          </div>
          <div className="absolute right-[30px] top-1/2 -translate-y-1/2">
            <button
              aria-expanded={openMenu === 'user'}
              aria-haspopup="menu"
              aria-label="用户菜单"
              className="flex items-center gap-2 rounded-full outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
              onClick={() => onMenuChange(openMenu === 'user' ? null : 'user')}
              type="button"
            >
              <img
                alt="当前用户"
                className="size-10 rounded-full object-cover ring-1 ring-black/5"
                src={avatarUrl}
              />
              <ChevronDown
                className={`size-4 transition-transform ${openMenu === 'user' ? 'rotate-180' : ''}`}
              />
            </button>
            {openMenu === 'user' ? (
              <div
                className="absolute right-0 top-[50px] z-40 w-[210px] rounded-[16px] border border-[#e6e9ed] bg-white p-2 shadow-[0_18px_48px_rgba(34,48,63,0.16)]"
                role="menu"
              >
                <div className="border-b border-[#edf0f2] px-3 py-2.5">
                  <strong className="block text-[13px] text-[#30353b]">当前用户</strong>
                  <span className="mt-1 block text-[11px] text-[#92979d]">创意社区成员</span>
                </div>
                <button
                  className="mt-1 flex h-9 w-full items-center rounded-[10px] px-3 text-left text-[13px] text-[#59616a] outline-none hover:bg-[#f4f6f8] focus-visible:ring-2 focus-visible:ring-[#2488ee]/35"
                  onClick={() => {
                    onNavigate('settings');
                    onMenuChange(null);
                  }}
                  role="menuitem"
                  type="button"
                >
                  偏好设置
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ),
    }),
    [
      activeNav,
      canGoBack,
      canGoForward,
      hasUnreadNotifications,
      isSidebarCollapsed,
      onBack,
      onForward,
      onMarkNotificationsRead,
      onMenuChange,
      onNavigate,
      onQueryChange,
      onSidebarToggle,
      openMenu,
      query,
    ],
  );
}

function formatScore(score: number) {
  return score >= 1000 ? `${(score / 1000).toFixed(1)}k` : String(score);
}

function compareEntries(
  left: WeeklyShowEntry,
  right: WeeklyShowEntry,
  sortMode: WeeklyShowSort,
  reactions: Record<string, ReactionCounts>,
) {
  if (sortMode === 'latest') {
    return weeklyShowEntries.indexOf(right) - weeklyShowEntries.indexOf(left);
  }

  if (sortMode === 'likes') {
    return (
      right.likes +
      (reactions[right.id]?.like ?? 0) -
      (left.likes + (reactions[left.id]?.like ?? 0))
    );
  }

  return (
    right.score +
    getReactionTotal(reactions[right.id]) -
    (left.score + getReactionTotal(reactions[left.id]))
  );
}

function getReactionTotal(reactions?: ReactionCounts) {
  return reactions ? reactions.coffee + reactions.flower + reactions.like : 0;
}

function getWeekMeta(weekOffset: number) {
  const start = new Date(Date.UTC(2025, 4, 19 + weekOffset * 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const resultEnd = new Date(end);
  resultEnd.setUTCDate(resultEnd.getUTCDate() + 2);

  return {
    deadline: `${end.getUTCMonth() + 1}月${end.getUTCDate()}日`,
    range: `${formatShortDate(start)} - ${formatShortDate(end)}`,
    resultRange: `${formatShortDate(new Date(end.getTime() + 86_400_000))} - ${formatShortDate(resultEnd)}`,
  };
}

function formatShortDate(date: Date) {
  return `${date.getUTCMonth() + 1}.${date.getUTCDate()}`;
}

function navigationReducer(
  state: NavHistoryState,
  action: { id: WeeklyShowNavId; type: 'navigate' } | { type: 'back' } | { type: 'forward' },
): NavHistoryState {
  if (action.type === 'back') {
    return { ...state, index: Math.max(0, state.index - 1) };
  }

  if (action.type === 'forward') {
    return { ...state, index: Math.min(state.entries.length - 1, state.index + 1) };
  }

  if (state.entries[state.index] === action.id) {
    return state;
  }

  const entries = [...state.entries.slice(0, state.index + 1), action.id];
  return { entries, index: entries.length - 1 };
}
