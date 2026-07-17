'use client';

import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Coins,
  Info,
  LockKeyhole,
  RefreshCw,
  Search,
  Spade,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

import { AppFrame, type AppFrameProps, type AppWindowSurfaceProps } from '@kernelon/shell';

import { dailyTasks, pokerAssetRoot, pokerFriends, pokerNavigation, pokerTables } from './data';

type Notice = { id: number; message: string } | null;

const pokerHeader: AppFrameProps['header'] = {
  density: 'compact',
  identity: { title: '' },
  mode: 'immersive',
  preset: 'plain',
};

const pokerFrameStyle = {
  '--ko-app-header-border': 'rgba(198, 161, 91, 0.17)',
  '--ko-app-header-inset-shadow': 'inset 0 1px 0 rgba(255,255,255,0.035)',
  '--ko-app-header-surface': 'linear-gradient(180deg, #1b1e1f 0%, #151819 100%)',
  colorScheme: 'dark',
  fontFamily:
    'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
} as CSSProperties;

export default function PokerLobbyWindow(props: AppWindowSurfaceProps) {
  void props;
  const [activeNav, setActiveNav] = useState('lobby');
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [joinTarget, setJoinTarget] = useState<string | null>(null);
  const [menu, setMenu] = useState<'notifications' | 'wallet' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [query, setQuery] = useState('');
  const [rotation, setRotation] = useState(0);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});

  const filteredTables = useMemo(() => {
    const rotated = pokerTables.map(
      (_, index) => pokerTables[(index + rotation) % pokerTables.length]!,
    );
    const normalized = query.trim().toLocaleLowerCase();

    if (!normalized) {
      return rotated;
    }

    return rotated.filter(
      (table) =>
        table.name.toLocaleLowerCase().includes(normalized) || table.stakes.includes(normalized),
    );
  }, [query, rotation]);

  function announce(message: string) {
    const id = Date.now();
    setNotice({ id, message });
    globalThis.setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current));
    }, 2400);
  }

  function selectNavigation(id: string, label: string) {
    setActiveNav(id);
    if (id !== 'lobby') {
      announce(`${label}将在后续界面继续实现`);
    }
  }

  return (
    <AppFrame
      className="[&_[data-kernelon-app-header=true]]:border-[#2a2e2e] [&_[data-kernelon-app-header=true]]:bg-[#171a1b] [&_[data-kernelon-app-header=true]]:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
      contentClassName="!bg-[#090c0c]"
      header={pokerHeader}
      scroll="hidden"
      style={pokerFrameStyle}
    >
      <div
        className="h-full min-h-0 overflow-auto bg-[#090c0c] text-[#e9dfc7] [scrollbar-color:#5b4a2e_#101313]"
        data-testid="poker-lobby-window"
      >
        <div className="grid h-full min-h-[800px] min-w-[1220px] grid-cols-[200px_minmax(0,1fr)]">
          <PokerSidebar activeNav={activeNav} onSelect={selectNavigation} />
          <div className="grid min-h-0 grid-rows-[64px_minmax(0,1fr)] overflow-hidden border-l border-[#2f2b23] bg-[#0b0e0d]">
            <PokerToolbar menu={menu} onMenuChange={setMenu} onSearch={setQuery} query={query} />
            <main className="min-h-0 overflow-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid h-full min-h-[740px] grid-rows-[339px_203px_238px] gap-2">
                <div className="grid min-h-0 grid-cols-[minmax(0,1.74fr)_minmax(350px,1fr)] gap-2">
                  <HeroPanel onJoin={() => setJoinTarget('今晚主桌 · 10 / 20')} />
                  <TodayPanel onContinue={() => setJoinTarget('深筹常规桌 · 10 / 20')} />
                </div>
                <QuickTables
                  onJoin={setJoinTarget}
                  onRotate={() => setRotation((value) => (value + 1) % pokerTables.length)}
                  tables={filteredTables}
                />
                <div className="grid min-h-0 grid-cols-[0.9fr_1.08fr_1.08fr] gap-2">
                  <TournamentPanel onOpen={() => announce('已打开深夜冠军赛报名详情')} />
                  <FriendsPanel
                    message={friendMessage}
                    onInvite={(name) => {
                      setFriendMessage(`已向 ${name} 发送同桌邀请`);
                      announce(`邀请已发送给 ${name}`);
                    }}
                  />
                  <DailyTasks
                    onClaim={(id, label) => {
                      setTaskProgress((current) => ({ ...current, [id]: 1 }));
                      announce(`${label}奖励已领取`);
                    }}
                    progress={taskProgress}
                  />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      {joinTarget ? (
        <JoinDialog
          onCancel={() => setJoinTarget(null)}
          onConfirm={() => {
            announce(`正在进入 ${joinTarget}`);
            setJoinTarget(null);
          }}
          target={joinTarget}
        />
      ) : null}
      {notice ? (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-[#806634]/70 bg-[#131715]/96 px-5 py-2.5 text-[13px] font-semibold text-[#efe3c7] shadow-[0_14px_38px_rgba(0,0,0,0.52)]"
          role="status"
        >
          {notice.message}
        </div>
      ) : null}
    </AppFrame>
  );
}

function PokerSidebar({
  activeNav,
  onSelect,
}: Readonly<{ activeNav: string; onSelect(id: string, label: string): void }>) {
  return (
    <aside className="relative flex min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#151817_0%,#111413_58%,#101312_100%)] px-4 pb-4 pt-3 shadow-[inset_-1px_0_0_rgba(255,255,255,0.025)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:url('/kernelon-assets/apps/poker/lobby-hero.webp')] [background-position:85%_center] [background-size:cover]" />
      <div className="absolute inset-0 bg-[#101312]/90" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col items-center pb-4 pt-1">
          <img
            alt="黑桃局徽章"
            className="size-[112px] object-contain drop-shadow-[0_8px_22px_rgba(196,155,75,0.18)]"
            src={`${pokerAssetRoot}/brand-crest.webp`}
          />
          <strong className="text-[24px] font-semibold tracking-[0.09em] text-[#d9b86f] [text-shadow:0_2px_12px_rgba(198,161,91,0.26)]">
            黑桃局
          </strong>
        </div>
        <nav aria-label="黑桃局导航" className="space-y-2">
          {pokerNavigation.map(({ Icon, id, label }) => {
            const active = id === activeNav;

            return (
              <button
                aria-current={active ? 'page' : undefined}
                className={`group flex h-[56px] w-full items-center gap-4 rounded-[9px] border px-[18px] text-left text-[17px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/65 ${
                  active
                    ? 'border-[#a58545]/80 bg-[linear-gradient(90deg,#234c3a_0%,#18372d_100%)] text-[#f0e5cb] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_22px_rgba(0,0,0,0.26)]'
                    : 'border-transparent text-[#aaa79d] hover:border-[#4b4030]/60 hover:bg-white/[0.035] hover:text-[#e8dcc0]'
                }`}
                key={id}
                onClick={() => onSelect(id, label)}
                type="button"
              >
                <Icon
                  aria-hidden="true"
                  className={`size-[23px] ${active ? 'text-[#e5c77f]' : 'text-[#9c9a92] group-hover:text-[#cbb985]'}`}
                  fill={active ? 'currentColor' : 'none'}
                  strokeWidth={active ? 1.8 : 1.9}
                />
                {label}
              </button>
            );
          })}
        </nav>
        <button
          className="mt-[clamp(36px,9vh,92px)] flex min-h-[92px] items-center gap-3 rounded-[9px] border border-[#66502a]/80 bg-black/20 px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition hover:border-[#a17d39] hover:bg-[#172019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/65"
          type="button"
        >
          <img
            alt="黑桃会员"
            className="size-12 rounded-[10px] object-cover ring-1 ring-[#80652e]"
            src={`${pokerAssetRoot}/brand-crest.webp`}
          />
          <span>
            <strong className="block text-[14px] font-semibold text-[#d7ba79]">黑桃会员</strong>
            <span className="mt-1 block text-[11px] text-[#8f897c]">尊享专属牌权</span>
          </span>
          <ChevronRight className="ml-auto size-4 text-[#8c7447]" />
        </button>
      </div>
    </aside>
  );
}

function PokerToolbar({
  menu,
  onMenuChange,
  onSearch,
  query,
}: Readonly<{
  menu: 'notifications' | 'wallet' | null;
  onMenuChange(value: 'notifications' | 'wallet' | null): void;
  onSearch(value: string): void;
  query: string;
}>) {
  return (
    <header className="relative z-40 flex items-center gap-3 border-b border-[#29271f] bg-[linear-gradient(180deg,#101311_0%,#0d100f_100%)] px-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      <div className="flex min-w-[280px] items-center gap-3">
        <img
          alt="SpadeKing"
          className="size-10 rounded-full bg-[#171914] object-cover p-0.5 ring-1 ring-[#a88540]"
          src={`${pokerAssetRoot}/brand-crest.webp`}
        />
        <span className="text-[17px] font-semibold tracking-[0.01em] text-[#e6d8ba]">
          晚上好，SpadeKing
        </span>
      </div>
      <label className="ml-auto flex h-9 w-[286px] items-center gap-2.5 rounded-[10px] border border-[#2e2d28] bg-[#0b0d0c] px-3 text-[#77766f] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] focus-within:border-[#7b6333] focus-within:ring-1 focus-within:ring-[#a3823e]/40">
        <Search className="size-[17px] shrink-0" strokeWidth={1.8} />
        <input
          aria-label="搜索玩家、俱乐部或赛事"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#d7d0c1] outline-none placeholder:text-[#74726b]"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="搜索玩家 / 俱乐部 / 赛事"
          type="search"
          value={query}
        />
      </label>
      <button
        className="flex h-9 items-center gap-2 rounded-[10px] border border-[#2d2c27] bg-[#111412] px-3 text-[12px] text-[#a9a69c] transition hover:border-[#615035] hover:text-[#e6d8ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
        type="button"
      >
        <Users className="size-[17px]" />
        <span className="size-2 rounded-full bg-[#54b667] shadow-[0_0_8px_rgba(84,182,103,0.35)]" />
        128 在线
      </button>
      <div className="relative">
        <button
          aria-expanded={menu === 'notifications'}
          aria-label="查看通知"
          className="relative flex size-9 items-center justify-center rounded-[10px] border border-[#2d2c27] bg-[#111412] text-[#ada99d] transition hover:border-[#665334] hover:text-[#eadcbd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
          onClick={() => onMenuChange(menu === 'notifications' ? null : 'notifications')}
          type="button"
        >
          <Bell className="size-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-[#111412] bg-[#c85b4c] text-[10px] font-bold text-white">
            3
          </span>
        </button>
        {menu === 'notifications' ? (
          <ToolbarPopover className="right-0 w-72" title="通知">
            <PopoverRow title="深夜冠军赛将在 21:30 开始" meta="8 分钟前" />
            <PopoverRow title="NightOwl 邀请你加入牌桌" meta="12 分钟前" />
            <PopoverRow title="每日任务进度已更新" meta="1 小时前" />
          </ToolbarPopover>
        ) : null}
      </div>
      <div className="relative">
        <button
          aria-expanded={menu === 'wallet'}
          className="flex h-9 min-w-[164px] items-center justify-between gap-3 rounded-[10px] border border-[#8a6a31]/90 bg-[linear-gradient(180deg,#1e1d17_0%,#141612_100%)] px-3 text-[18px] font-bold tracking-[0.04em] text-[#e4c27b] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition hover:border-[#c09b51] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
          onClick={() => onMenuChange(menu === 'wallet' ? null : 'wallet')}
          type="button"
        >
          <span className="flex items-center gap-2">
            <CircleDollarSign className="size-[22px]" /> ¥12,680
          </span>
          <ChevronDown className="size-4" />
        </button>
        {menu === 'wallet' ? (
          <ToolbarPopover className="right-0 w-64" title="账户资产">
            <div className="rounded-[8px] border border-[#403620] bg-[#0e110f] p-3">
              <p className="text-[11px] text-[#858177]">可用余额</p>
              <strong className="mt-1 block text-[24px] text-[#e6c57e]">¥12,680</strong>
              <button
                className="mt-3 h-8 w-full rounded-[7px] bg-[#d2ad62] text-xs font-bold text-[#15120b]"
                type="button"
              >
                资产明细
              </button>
            </div>
          </ToolbarPopover>
        ) : null}
      </div>
    </header>
  );
}

function ToolbarPopover({
  children,
  className,
  title,
}: Readonly<{ children: ReactNode; className: string; title: string }>) {
  return (
    <div
      className={`absolute top-11 z-50 rounded-[12px] border border-[#4d412a] bg-[#151816]/98 p-3 text-[#ddd2ba] shadow-[0_18px_54px_rgba(0,0,0,0.6)] ${className}`}
      role="dialog"
    >
      <strong className="mb-2 block text-[13px] text-[#e5c77f]">{title}</strong>
      {children}
    </div>
  );
}

function PopoverRow({ meta, title }: Readonly<{ meta: string; title: string }>) {
  return (
    <button
      className="w-full border-t border-[#292b27] py-2.5 text-left first:border-0"
      type="button"
    >
      <span className="block text-xs font-medium text-[#d8cfbc]">{title}</span>
      <span className="mt-1 block text-[10px] text-[#77786f]">{meta}</span>
    </button>
  );
}

function HeroPanel({ onJoin }: Readonly<{ onJoin(): void }>) {
  return (
    <section className="group relative min-h-0 overflow-hidden rounded-[10px] border border-[#75592b]/85 bg-[#07100c] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <img
        alt="今晚主桌牌桌"
        className="absolute inset-0 h-full w-full object-cover object-[64%_center] transition duration-700 group-hover:scale-[1.015]"
        src={`${pokerAssetRoot}/lobby-hero.webp`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,9,7,0.97)_0%,rgba(4,9,7,0.86)_33%,rgba(4,9,7,0.28)_66%,rgba(4,9,7,0.04)_100%)]" />
      <div className="absolute inset-y-0 left-0 flex w-[52%] flex-col px-7 pb-10 pt-5">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] text-[#d76a56]">
          <span className="size-2 rounded-full bg-[#db5f50] shadow-[0_0_8px_rgba(219,95,80,0.45)]" />
          LIVE
        </div>
        <h1 className="mt-4 text-[54px] font-black leading-none tracking-[-0.045em] text-[#f0e5cc] [text-shadow:0_3px_18px_rgba(0,0,0,0.45)]">
          今晚主桌
        </h1>
        <div className="mt-4 flex items-center gap-9 text-[clamp(24px,2vw,34px)] font-semibold tracking-[0.015em] text-[#e4d3ad]">
          <span className="flex items-center gap-2">
            10 / 20 <Coins className="size-5 text-[#b8964f]" />
          </span>
          <span className="flex items-center gap-2">
            <Users className="size-6 text-[#d0ae67]" /> 6 / 9
          </span>
        </div>
        <p className="mt-2 text-[17px] font-semibold tracking-[0.04em] text-[#d8bc7a]">
          深筹 · 常规桌
        </p>
        <button
          className="mt-auto flex h-[56px] w-[232px] items-center justify-center gap-8 rounded-[8px] border border-[#e0bf77] bg-[linear-gradient(180deg,#e9ce91_0%,#cda357_100%)] text-[20px] font-black tracking-[0.08em] text-[#17130c] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_10px_24px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d79e]"
          onClick={onJoin}
          type="button"
        >
          立即入座 <ChevronRight className="size-5" strokeWidth={2.6} />
        </button>
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {[0, 1, 2, 3].map((dot) => (
          <span
            className={`size-2 rounded-full ${dot === 1 ? 'bg-[#d3b268]' : 'bg-[#7a7d74]/75'}`}
            key={dot}
          />
        ))}
      </div>
    </section>
  );
}

function TodayPanel({ onContinue }: Readonly<{ onContinue(): void }>) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-[#725829]/80 bg-[linear-gradient(145deg,#151817_0%,#0e1110_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[21px] font-bold text-[#eee2c9]">今日牌局</h2>
        <Info className="size-5 text-[#b3975b]" strokeWidth={1.7} />
      </div>
      <div className="mt-3 grid grid-cols-3 divide-x divide-[#4d493d]">
        <Metric label="今日游戏" value="3" unit="场" />
        <Metric positive label="今日盈亏" value="+2,480" />
        <Metric label="今日胜率" value="62%" />
      </div>
      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[7px] border-b border-[#292d29] bg-[url('/kernelon-assets/apps/poker/profit-chart.webp')] bg-[length:100%_100%] bg-center bg-no-repeat">
        <span className="absolute right-3 top-2 rounded-[5px] border border-[#315f36] bg-[#18331d]/90 px-2 py-0.5 text-[11px] font-semibold text-[#80d47c]">
          +2,480
        </span>
      </div>
      <div className="mt-4 flex h-[100px] items-center gap-3 rounded-[8px] border border-[#39362f] bg-[#111412] p-2.5">
        <img
          alt="上一局牌桌"
          className="h-full w-[100px] rounded-[6px] object-cover"
          src={`${pokerAssetRoot}/table-green.webp`}
        />
        <div className="min-w-0 flex-1">
          <strong className="block text-[16px] text-[#e7dcc4]">继续上一局</strong>
          <span className="mt-1 block truncate text-[11px] text-[#8e8b82]">深筹常规桌 10 / 20</span>
          <span className="text-[11px] text-[#8e8b82]">6 / 9 人</span>
        </div>
        <button
          className="h-10 shrink-0 rounded-[7px] border border-[#dfbf7b] bg-[linear-gradient(180deg,#e8cf98,#c49b50)] px-4 text-[14px] font-bold text-[#17130c] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dca7]"
          onClick={onContinue}
          type="button"
        >
          继续游戏
        </button>
      </div>
    </section>
  );
}

function Metric({
  label,
  positive = false,
  unit,
  value,
}: Readonly<{ label: string; positive?: boolean; unit?: string; value: string }>) {
  return (
    <div className="px-4 text-center first:pl-1 last:pr-1">
      <strong
        className={`text-[28px] leading-none ${positive ? 'text-[#75cb73]' : 'text-[#ebdfc5]'}`}
      >
        {value}
      </strong>
      {unit ? <span className="ml-1 text-xs text-[#d6c7a7]">{unit}</span> : null}
      <span className="mt-1 block text-[11px] text-[#8c8980]">{label}</span>
    </div>
  );
}

function QuickTables({
  onJoin,
  onRotate,
  tables,
}: Readonly<{
  onJoin(value: string): void;
  onRotate(): void;
  tables: typeof pokerTables | ReadonlyArray<(typeof pokerTables)[number]>;
}>) {
  return (
    <section className="min-h-0 overflow-hidden rounded-[10px] border border-[#554322] bg-[linear-gradient(180deg,#111412,#0d100f)] px-3 pb-2.5 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex h-7 items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#dfc88d]">快速开局</h2>
        <button
          className="flex items-center gap-1.5 text-[11px] text-[#9f9a8c] transition hover:text-[#e1c784] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
          onClick={onRotate}
          type="button"
        >
          换一批 <RefreshCw className="size-3.5" />
        </button>
      </div>
      {tables.length > 0 ? (
        <div className="grid h-[calc(100%-28px)] grid-cols-4 gap-3">
          {tables.map((table) => (
            <button
              className="group relative min-h-0 overflow-hidden rounded-[9px] border border-[#514328] bg-[#121512] text-left transition hover:-translate-y-0.5 hover:border-[#b28d46] hover:shadow-[0_12px_28px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
              key={table.name}
              onClick={() => onJoin(`${table.name} · ${table.stakes}`)}
              type="button"
            >
              <img
                alt={`${table.name}牌桌`}
                className="absolute inset-x-0 top-0 h-[76%] w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                src={table.image}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,7,0.08)_0%,rgba(5,8,7,0.08)_42%,rgba(7,9,8,0.94)_76%,#0b0e0d_100%)]" />
              <span className="absolute right-3 top-2.5 text-[#99885e]">☆</span>
              <div className="relative flex h-full flex-col items-center px-3 pb-2 pt-3 text-center">
                <strong className="text-[14px] text-[#e8ddc4] [text-shadow:0_2px_7px_rgba(0,0,0,0.8)]">
                  {table.name}
                </strong>
                <span className="mt-1 text-[13px] font-semibold text-[#efe3c6]">
                  {table.stakes}
                </span>
                <div className="absolute bottom-[28px] left-3 flex -space-x-1.5">
                  {pokerFriends.slice(0, 5).map((friend) => (
                    <img
                      alt=""
                      className="size-[22px] rounded-full border border-[#c7ae79] object-cover shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
                      key={friend.id}
                      src={friend.avatar}
                    />
                  ))}
                </div>
                <span className="absolute bottom-[29px] right-3 rounded-full border border-[#424139] bg-black/50 px-2 py-0.5 text-[10px] text-[#bbb6aa]">
                  {table.occupancy}
                </span>
                <div className="mt-auto flex w-full items-end gap-2 text-left text-[11px] text-[#9a968d]">
                  <span>平均底池</span>
                  <span className="font-semibold text-[#c8bda5]">{table.averagePot}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex h-[calc(100%-28px)] items-center justify-center text-sm text-[#827f77]">
          没有找到匹配的牌桌
        </div>
      )}
    </section>
  );
}

function TournamentPanel({ onOpen }: Readonly<{ onOpen(): void }>) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-[#574724] bg-[#111412] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#ddc68d]">赛事预告</h2>
        <button
          className="text-[10px] text-[#8f8b81] hover:text-[#d7bc7b]"
          onClick={onOpen}
          type="button"
        >
          更多赛事 ›
        </button>
      </div>
      <button
        className="group relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[7px] border border-[#413a2c] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
        onClick={onOpen}
        type="button"
      >
        <img
          alt="深夜冠军赛奖杯"
          className="absolute inset-0 h-full w-full object-cover object-left transition duration-500 group-hover:scale-[1.02]"
          src={`${pokerAssetRoot}/tournament-trophy.webp`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,11,10,0.12),rgba(9,11,10,0.72)_44%,rgba(9,11,10,0.97)_100%)]" />
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
      </button>
    </section>
  );
}

function FriendsPanel({
  message,
  onInvite,
}: Readonly<{ message: string | null; onInvite(name: string): void }>) {
  return (
    <section className="min-h-0 overflow-hidden rounded-[10px] border border-[#574724] bg-[#111412] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#ddc68d]">好友在玩</h2>
        <span className="text-[10px] text-[#8f8b81]">查看全部 ›</span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {pokerFriends.map((friend) => (
          <button
            aria-label={`邀请 ${friend.name} 同桌`}
            className="group min-w-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
            key={friend.id}
            onClick={() => onInvite(friend.name)}
            type="button"
          >
            <span className="relative mx-auto block aspect-square w-[min(64px,100%)] overflow-hidden rounded-full border-2 border-[#8f713a] bg-[#1b1e1b] shadow-[0_7px_16px_rgba(0,0,0,0.32)] transition group-hover:-translate-y-1 group-hover:border-[#d3af62]">
              <img alt="" className="h-full w-full object-cover" src={friend.avatar} />
              <span className="absolute bottom-0 right-1 size-2.5 rounded-full border-2 border-[#171a18] bg-[#55c268]" />
            </span>
            <strong className="mt-1.5 block truncate text-[11px] text-[#e2d8c2]">
              {friend.name}
            </strong>
            <span className="block truncate text-[9px] text-[#85837c]">{friend.status}</span>
            <span className="mt-0.5 flex items-center justify-center gap-1 text-[9px] text-[#b9b1a0]">
              <span className="size-1.5 rounded-full bg-[#55b767]" /> {friend.stakes}
            </span>
          </button>
        ))}
      </div>
      {message ? (
        <p className="mt-2 truncate text-center text-[10px] text-[#76bd78]">{message}</p>
      ) : null}
    </section>
  );
}

function DailyTasks({
  onClaim,
  progress,
}: Readonly<{
  onClaim(id: string, label: string): void;
  progress: Record<string, number>;
}>) {
  return (
    <section className="relative min-h-0 overflow-hidden rounded-[10px] border border-[#574724] bg-[#111412] p-3 pr-[112px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <h2 className="text-[16px] font-bold text-[#ddc68d]">每日任务</h2>
      <div className="mt-2 space-y-2">
        {dailyTasks.map((task, index) => {
          const claimed = Boolean(progress[task.id]);
          const current = claimed ? task.target : task.current;
          const percent = Math.min(100, (current / task.target) * 100);

          return (
            <button
              aria-label={`${claimed ? '已领取' : '领取'} ${task.label}`}
              className="flex h-[42px] w-full items-center gap-2 rounded-[6px] border border-[#32342f] bg-[#0f1210] px-2 text-left transition hover:border-[#695736] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
              disabled={claimed}
              key={task.id}
              onClick={() => onClaim(task.id, task.label)}
              type="button"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-[#665230] bg-[#171b17] text-[#d0b36e]">
                {index === 0 ? (
                  <Spade className="size-4" />
                ) : index === 1 ? (
                  <Coins className="size-4" />
                ) : (
                  <HistoryIcon />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between gap-2 text-[10px] text-[#a9a59a]">
                  <span className="truncate">{task.label}</span>
                  <span>
                    {current.toLocaleString()} / {task.target.toLocaleString()}
                  </span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#2a2c27]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#9d7839,#e2c57c)] transition-[width] duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="absolute right-4 top-2 flex w-[82px] flex-col items-center">
        <img
          alt="每日任务等级 12"
          className="size-[74px] rounded-full object-cover ring-1 ring-[#6f542b]"
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

function HistoryIcon() {
  return <RefreshCw className="size-4" />;
}

function JoinDialog({
  onCancel,
  onConfirm,
  target,
}: Readonly<{ onCancel(): void; onConfirm(): void; target: string }>) {
  function stopPropagation(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div
      aria-label="确认入座"
      aria-modal="true"
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/64 backdrop-blur-[4px]"
      onClick={onCancel}
      role="dialog"
    >
      <div
        className="relative w-[420px] overflow-hidden rounded-[16px] border border-[#8d6e35] bg-[linear-gradient(160deg,#1d211d,#101310)] p-6 text-[#e9dfc9] shadow-[0_28px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)]"
        onClick={stopPropagation}
      >
        <button
          aria-label="关闭确认入座"
          className="absolute right-4 top-4 text-[#8f8c82] hover:text-[#e7dcc4]"
          onClick={onCancel}
          type="button"
        >
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-4">
          <img
            alt="牌桌徽章"
            className="size-16 rounded-[12px] object-cover ring-1 ring-[#8c6e35]"
            src={`${pokerAssetRoot}/brand-crest.webp`}
          />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#ad8d4d]">
              SEAT RESERVED
            </p>
            <h2 className="mt-1 text-[22px] font-bold">确认入座</h2>
          </div>
        </div>
        <div className="mt-5 rounded-[10px] border border-[#3e382d] bg-black/20 p-4">
          <strong className="block text-[16px] text-[#e6cb8d]">{target}</strong>
          <div className="mt-3 flex items-center gap-6 text-xs text-[#98958b]">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" /> 6 / 9
            </span>
            <span className="flex items-center gap-1.5">
              <LockKeyhole className="size-4" /> 公平牌局
            </span>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            className="h-11 flex-1 rounded-[8px] border border-[#514b3f] bg-[#181b18] text-sm font-semibold text-[#b3afa3] hover:border-[#796746]"
            onClick={onCancel}
            type="button"
          >
            稍后再说
          </button>
          <button
            className="h-11 flex-1 rounded-[8px] border border-[#e0bf77] bg-[linear-gradient(180deg,#e8ce91,#c59b4f)] text-sm font-bold text-[#16120b] hover:brightness-105"
            onClick={onConfirm}
            type="button"
          >
            进入牌桌
          </button>
        </div>
      </div>
    </div>
  );
}
