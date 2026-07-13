'use client';

import { useMemo, useState } from 'react';
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

const avatarUrl = '/kernelon-assets/avatars/current-user.png';
const spriteUrl = '/kernelon-assets/weekly-show/works-sprite.png';

export default function WeeklyShowWindow(props: AppWindowSurfaceProps) {
  void props;
  const [activeCategory, setActiveCategory] = useState<WeeklyShowCategory>('全部');
  const [activeNav, setActiveNav] = useState<(typeof navItems)[number]['id']>('stage');
  const [query, setQuery] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return weeklyShowEntries.filter(
      (entry) =>
        (activeCategory === '全部' || entry.category === activeCategory) &&
        (!normalizedQuery ||
          entry.title.toLocaleLowerCase().includes(normalizedQuery) ||
          entry.author.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [activeCategory, query]);
  const headerSlots = useWeeklyShowHeaderSlots(query, setQuery);

  return (
    <AppFrame
      contentClassName="!bg-transparent"
      className="relative [&_[data-app-header-row=primary]]:min-h-[64px] [&_[data-app-window-controls=true]]:top-8 [&_[data-kernelon-app-header=true]]:absolute [&_[data-kernelon-app-header=true]]:inset-x-0 [&_[data-kernelon-app-header=true]]:top-0 [&_[data-kernelon-app-header=true]]:z-30 [&_[data-kernelon-app-header=true]]:h-16 [&_[data-kernelon-app-header=true]]:min-h-16 [&_[data-kernelon-app-header=true]]:overflow-visible [&_[data-kernelon-app-header=true]]:border-0 [&_[data-kernelon-app-header=true]]:bg-transparent [&_[data-kernelon-app-header=true]]:shadow-none [&_[data-kernelon-app-header=true]]:backdrop-blur-0"
      header={weeklyShowHeader}
      headerSlots={headerSlots}
      scroll="hidden"
    >
      <div
        className="grid h-full min-h-0 grid-cols-[286px_minmax(0,1fr)] overflow-hidden bg-[linear-gradient(145deg,rgba(214,237,255,0.96),rgba(234,244,252,0.86)_48%,rgba(207,225,241,0.92))] text-[#202124]"
        data-testid="weekly-show-window"
      >
        <aside
          className="relative overflow-hidden px-4 pb-6 pt-[82px] shadow-[inset_0_1px_0_rgba(255,255,255,0.74)] backdrop-blur-[30px]"
          data-surface="frosted-sidebar"
          data-testid="weekly-show-sidebar"
        >
          <div className="pointer-events-none absolute -left-20 top-16 size-64 rounded-full bg-[#80c7ff]/22 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="mb-6 flex items-center gap-3 px-3 py-2">
              <img
                alt="Weekly Show"
                className="size-9 rounded-[10px] object-cover shadow-[0_5px_12px_rgba(36,107,187,0.24)]"
                src="/kernelon-assets/dock-icons/weekly-show.png"
              />
              <span className="text-[20px] font-bold tracking-[-0.02em] text-[#17202a]">
                Weekly Show
              </span>
            </div>
            <nav aria-label="Weekly Show 导航" className="space-y-2">
              {navItems.map(({ Icon, id, label }) => {
                const active = id === activeNav;

                return (
                  <button
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-[58px] w-full items-center gap-4 rounded-[29px] px-[22px] text-[17px] font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-white/74 text-[#438cf2] shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_12px_28px_rgba(69,113,160,0.10)] backdrop-blur-2xl'
                        : 'text-[#647181] hover:bg-white/38 hover:text-[#354253]'
                    }`}
                    key={id}
                    onClick={() => setActiveNav(id)}
                    type="button"
                  >
                    <Icon
                      className="size-[23px]"
                      fill={active && id === 'stage' ? 'currentColor' : 'none'}
                      strokeWidth={2}
                    />
                    {label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto px-4 text-[11px] font-medium leading-5 text-[#7d8996]">
              <p>每周发现好创意</p>
              <p>让灵感被看见</p>
            </div>
          </div>
        </aside>

        <main
          className="relative z-10 ml-[-24px] min-h-0 overflow-y-auto rounded-l-[28px] bg-white px-[clamp(34px,4vw,64px)] pb-10 pt-[96px] shadow-[-12px_0_38px_rgba(75,112,145,0.10),inset_1px_0_0_rgba(255,255,255,0.96)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-surface="stacked-content-panel"
          data-testid="weekly-show-content-panel"
        >
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
                  className="rounded-full p-1.5 hover:bg-white"
                  onClick={() => setWeekOffset((value) => value - 1)}
                  type="button"
                >
                  <ChevronLeft className="size-[18px]" />
                </button>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-[17px] text-[#888d93]" />
                  <strong className="text-[#3f4247]">第 {21 + weekOffset} 周</strong>
                  <span className="ml-2">5.19 - 5.25</span>
                </div>
                <button
                  aria-label="下一周"
                  className="rounded-full p-1.5 hover:bg-white"
                  onClick={() => setWeekOffset((value) => value + 1)}
                  type="button"
                >
                  <ChevronRight className="size-[18px]" />
                </button>
              </div>
            </div>

            <StageTimeline />

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
              <button
                className="flex shrink-0 items-center gap-2 text-[13px] text-[#777b81]"
                type="button"
              >
                排序：<strong className="text-[#4c5055]">互动得分</strong>
                <ChevronDown className="size-4" />
              </button>
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
                    onReact={() =>
                      setReactions((current) => ({
                        ...current,
                        [entry.id]: (current[entry.id] ?? 0) + 1,
                      }))
                    }
                    rank={index < 3 ? index + 1 : undefined}
                    reactionBonus={reactions[entry.id] ?? 0}
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
        </main>
      </div>
    </AppFrame>
  );
}

function StageTimeline() {
  return (
    <div
      className="mt-[28px] flex h-[114px] items-center rounded-[14px] border border-[#e9ebee] bg-white px-7 shadow-[0_8px_28px_rgba(38,50,62,0.025)]"
      data-testid="weekly-show-timeline"
    >
      <TimelineStep Icon={Send} date="5.12 - 5.18" label="投稿阶段" />
      <div className="mx-4 h-px flex-1 bg-[#d9dde1]" />
      <TimelineStep Icon={BarChart3} active date="5.19 - 5.25" label="投票阶段" />
      <div className="mx-4 h-px flex-1 bg-[#d9dde1]" />
      <TimelineStep Icon={Gift} date="5.26 - 5.27" label="结果公示" />
      <div className="ml-8 min-w-[174px] rounded-[10px] border border-[#e9eef5] bg-[#f7faff] px-5 py-3 text-center">
        <p className="text-[12px] text-[#85888d]">投票截止</p>
        <p className="mt-1 text-[15px] font-bold text-[#3289ee]">5月25日 18:00</p>
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
  reactionBonus,
}: Readonly<{ entry: WeeklyShowEntry; onReact(): void; rank?: number; reactionBonus: number }>) {
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
          className="flex items-center gap-1.5 hover:text-[#d88935]"
          onClick={onReact}
          type="button"
        >
          <Coffee className="size-4 text-[#c39454]" />
          送咖啡 {entry.coffees}
        </button>
        <button
          className="flex items-center gap-1.5 hover:text-[#d85f81]"
          onClick={onReact}
          type="button"
        >
          <Flower2 className="size-4 text-[#df6f8d]" />
          送鲜花 {entry.flowers}
        </button>
        <button
          aria-label={`点赞 ${entry.title}`}
          className="flex items-center gap-1.5 hover:text-[#ee5751]"
          onClick={onReact}
          type="button"
        >
          <Heart className="size-4 fill-[#ef5c55] text-[#ef5c55]" />
          点赞 {entry.likes + reactionBonus}
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

function useWeeklyShowHeaderSlots(query: string, onQueryChange: (value: string) => void) {
  return useMemo(
    () => ({
      'weekly-show-leading': (
        <div className="absolute left-[280px] top-1/2 flex -translate-y-1/2 items-center gap-2.5">
          <button
            aria-label="切换侧栏"
            className="flex size-9 items-center justify-center rounded-[12px] border border-white/65 bg-white/64 text-[#3d434a] shadow-[0_6px_15px_rgba(39,55,72,0.06)]"
            type="button"
          >
            <PanelLeft className="size-[18px]" />
          </button>
          <div className="flex h-9 items-center overflow-hidden rounded-[12px] border border-white/65 bg-white/64 shadow-[0_6px_15px_rgba(39,55,72,0.06)]">
            <button
              aria-label="后退"
              className="flex h-full w-9 items-center justify-center text-[#353a40] hover:bg-white"
              type="button"
            >
              <ChevronLeft className="size-[18px]" />
            </button>
            <span className="h-4 w-px bg-[#e4e7ea]" />
            <button
              aria-label="前进"
              className="flex h-full w-9 items-center justify-center text-[#a8adb3] hover:bg-white"
              type="button"
            >
              <ChevronRight className="size-[18px]" />
            </button>
          </div>
        </div>
      ),
      'weekly-show-title': (
        <div className="absolute left-[262px] right-0 top-1/2 -translate-y-1/2 text-center text-[16px] font-bold tracking-[-0.01em] text-[#202328]">
          本周舞台
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
              type="search"
              value={query}
            />
            <span className="text-[12px] font-semibold text-[#9ca1a7]">⌘K</span>
          </label>
          <button
            aria-label="通知"
            className="absolute right-[120px] top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-black/[0.04]"
            type="button"
          >
            <Bell className="size-[19px]" strokeWidth={2} />
            <span className="absolute right-[7px] top-[6px] size-1.5 rounded-full bg-[#ef5750] ring-2 ring-white" />
          </button>
          <button
            aria-label="用户菜单"
            className="absolute right-[30px] top-1/2 flex -translate-y-1/2 items-center gap-2"
            type="button"
          >
            <img
              alt="当前用户"
              className="size-10 rounded-full object-cover ring-1 ring-black/5"
              src={avatarUrl}
            />
            <ChevronDown className="size-4" />
          </button>
        </div>
      ),
    }),
    [onQueryChange, query],
  );
}

function formatScore(score: number) {
  return score >= 1000 ? `${(score / 1000).toFixed(1)}k` : String(score);
}
