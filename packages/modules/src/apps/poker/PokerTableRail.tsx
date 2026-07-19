'use client';

import {
  Brain,
  ChevronDown,
  Flame,
  Hand,
  MessageCircle,
  Sparkles,
  Spade,
  ThumbsUp,
  Users,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { cn } from '@kernelon/ui';

import {
  getActivePlayer,
  getPlayer,
  type PokerGameState,
  type PokerHandValue,
} from './pokerGameEngine';
import { pokerAssetRoot, reactionOptions } from './pokerTableData';
import type { PokerRailTab } from './usePokerTableController';

type PokerTableRailProps = {
  activeTab: PokerRailTab;
  callAmount: number;
  estimatedEquity: number;
  game: PokerGameState;
  heroHand: PokerHandValue;
  onReact(index: number, label: string): void;
  onTabChange(tab: PokerRailTab): void;
  potOdds: string;
  reactionCounts: number[];
};

const reactionIcons: Array<ComponentType<SVGProps<SVGSVGElement>>> = [
  Flame,
  ThumbsUp,
  Sparkles,
  Hand,
  Brain,
];

export function PokerTableRail({
  activeTab,
  callAmount,
  estimatedEquity,
  game,
  heroHand,
  onReact,
  onTabChange,
  potOdds,
  reactionCounts,
}: Readonly<PokerTableRailProps>) {
  const activePlayer = getActivePlayer(game);
  return (
    <aside className="relative z-20 h-[calc(100%+38px)] min-h-0 overflow-hidden border-b border-[#343635] bg-[linear-gradient(180deg,#151818_0%,#101313_100%)] text-[#d7d4ca]">
      <section className="px-[18px] pt-5">
        <div className="flex items-center justify-between border-b border-white/[.07] pb-3">
          <h2 className="text-[16px] font-semibold tracking-[.08em] text-[#e9d9b7]">牌局动态</h2>
          <ChevronDown className="size-4 text-[#bcbcb7]" />
        </div>

        <div className="grid grid-cols-[72px_92px_60px_1fr_48px_50px] border-b border-white/[.07] py-2 text-[11px] text-[#777b79]">
          <span>时间</span>
          <span>玩家</span>
          <span>位置</span>
          <span>行动</span>
          <span>筹码</span>
          <span className="text-right">底池</span>
        </div>
        <div>
          {game.logs.slice(-5).map((entry) => (
            <div
              className="grid grid-cols-[72px_92px_60px_1fr_48px_50px] items-center border-b border-white/[.035] py-[9px] text-[11px] tabular-nums text-[#888b89]"
              key={entry.id}
            >
              <span>{entry.time}</span>
              <span className="truncate">{entry.player}</span>
              <span>{entry.position || '–'}</span>
              <span
                className={cn(
                  'truncate',
                  entry.emphasis === 'raise' && 'font-medium text-[#e26158]',
                  entry.emphasis === 'hero' && 'font-medium text-[#e1bd76]',
                  entry.emphasis === 'result' && 'font-semibold text-[#69d283]',
                  entry.emphasis === 'street' && 'text-[#d0ae68]',
                )}
              >
                {entry.action}
              </span>
              <span>{entry.amount === null ? '–' : entry.amount.toLocaleString('zh-CN')}</span>
              <span className="text-right">{entry.pot.toLocaleString('zh-CN')}</span>
            </div>
          ))}
          <div
            className={cn(
              'grid grid-cols-[72px_92px_60px_1fr_48px_50px] items-center py-[10px] text-[11px] tabular-nums',
              activePlayer?.id === 'hero' ? 'text-[#e1bd76]' : 'text-[#8da394]',
            )}
          >
            <span>实时</span>
            <span className="truncate font-semibold">{activePlayer?.name ?? '本手结束'}</span>
            <span>{activePlayer?.position ?? '–'}</span>
            <span>{activePlayer ? '思考中' : '等待下一手'}</span>
            <span>–</span>
            <span className="text-right">
              {game.result?.totalPot.toLocaleString('zh-CN') ?? '–'}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <MetricCard
            label="底池赔率"
            note={
              callAmount > 0 ? `需要跟注 ${callAmount.toLocaleString('zh-CN')}` : '当前可以过牌'
            }
            value={potOdds}
          />
          <MetricCard
            label="胜率估算"
            note={`当前牌力：${heroHand.label}`}
            value={`${estimatedEquity}%`}
          />
        </div>

        <OpponentAnalysis game={game} />
      </section>

      <div className="absolute inset-x-0 bottom-0 border-t border-[#3a3b39] bg-[#111414]/95 backdrop-blur-xl">
        <nav aria-label="牌桌侧栏" className="grid h-12 grid-cols-3 border-b border-white/[.06]">
          <RailTab
            active={activeTab === 'activity'}
            label="动态"
            onClick={() => onTabChange('activity')}
          />
          <RailTab active={activeTab === 'chat'} label="聊天" onClick={() => onTabChange('chat')} />
          <RailTab
            active={activeTab === 'range'}
            label="牌谱"
            onClick={() => onTabChange('range')}
          />
        </nav>
        <div className="h-[95px] px-4 py-3">
          {activeTab === 'activity' ? (
            <>
              <div className="mb-2 flex items-center justify-between text-[11px] text-[#8f9290]">
                <span>观战反应</span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  18
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {reactionOptions.map((reaction, index) => {
                  const Icon = reactionIcons[index]!;
                  return (
                    <button
                      aria-label={`${reaction.label} ${reactionCounts[index] ?? reaction.count}`}
                      className="group flex h-9 items-center justify-center gap-1.5 rounded border border-white/[.08] bg-[#1c1f1f] text-[11px] tabular-nums text-[#aaa9a3] transition duration-200 hover:-translate-y-0.5 hover:border-[#b48c4d]/45 hover:bg-[#27241e] hover:text-[#e8cf9a] active:translate-y-0"
                      key={reaction.label}
                      onClick={() => onReact(index, reaction.label)}
                      type="button"
                    >
                      <Icon className="size-4 text-[#d5a552] transition group-hover:scale-110" />
                      {reactionCounts[index] ?? reaction.count}
                    </button>
                  );
                })}
              </div>
            </>
          ) : activeTab === 'chat' ? (
            <div className="flex h-full items-center gap-3 rounded border border-white/[.06] bg-white/[.02] px-3 text-[12px] text-[#9a9d9a]">
              <MessageCircle className="size-5 text-[#c99f59]" />
              观战聊天已同步，最新消息：这一手翻牌很有意思。
            </div>
          ) : (
            <div className="flex h-full items-center gap-3 rounded border border-white/[.06] bg-white/[.02] px-3 text-[12px] text-[#9a9d9a]">
              <Spade className="size-5 text-[#c99f59]" />
              {game.result
                ? `第 ${game.handNumber.toLocaleString('zh-CN')} 手已归档：${game.result.summary}`
                : `第 ${game.handNumber.toLocaleString('zh-CN')} 手进行中，结算后将自动归档。`}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  note,
  value,
}: Readonly<{ label: string; note: string; value: string }>) {
  return (
    <div className="rounded-md border border-[#575142]/45 bg-[linear-gradient(145deg,#1b1e1e,#151818)] px-3 py-[22px] text-center shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
      <p className="text-[11px] text-[#7f8582]">{label}</p>
      <p className="my-1 font-serif text-[29px] font-semibold tracking-[.06em] text-[#ddc18c]">
        {value}
      </p>
      <p className="text-[10px] text-[#767a77]">{note}</p>
    </div>
  );
}

function OpponentAnalysis({ game }: Readonly<{ game: PokerGameState }>) {
  const focusPlayer =
    [...game.seats]
      .reverse()
      .find((seat) => seat.id !== 'hero' && seat.lastAction.includes('加注')) ??
    getPlayer(game, 'eagle')!;
  const profileId =
    focusPlayer.id === 'bear' ? 'bear' : focusPlayer.id === 'lion' ? 'lion' : 'eagle';
  return (
    <section className="mt-2 rounded-md border border-[#4f493d]/55 bg-[linear-gradient(145deg,#1b1e1e,#141717)] px-3 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
      <h3 className="mb-2 text-[12px] font-semibold tracking-[.08em] text-[#dcc69a]">对手分析</h3>
      <div className="flex items-center gap-2.5">
        <img
          alt={`${focusPlayer.name}头像`}
          className="size-12 rounded-full border-2 border-[#827358] object-cover"
          src={`${pokerAssetRoot}/avatar-${profileId}.webp`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-[#d7d1c4]">
            {focusPlayer.name}（{focusPlayer.position}）
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {['激进型', '高频率', '大额下注倾向'].map((tag) => (
              <span
                className="rounded bg-[#4b4231]/75 px-1.5 py-0.5 text-[9px] text-[#c9b186]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <img
          alt="北极熊先生头像"
          className="size-10 rounded-full border-2 border-[#6f6250] object-cover"
          src={`${pokerAssetRoot}/avatar-bear.webp`}
        />
      </div>
      <p className="mt-2 text-[10px] leading-[1.65] text-[#858a87]">
        该玩家本手投入 {focusPlayer.totalCommitted.toLocaleString('zh-CN')}{' '}
        筹码，系统会根据牌面、下注压力与剩余筹码动态选择跟注、加注或弃牌。
      </p>
    </section>
  );
}

function RailTab({
  active,
  label,
  onClick,
}: Readonly<{ active: boolean; label: string; onClick(): void }>) {
  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative border-r border-white/[.06] text-[13px] text-[#777c79] transition hover:bg-white/[.025] hover:text-[#d5c5a7]',
        active ? 'font-semibold text-[#e4c98f]' : '',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      {active ? (
        <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[linear-gradient(90deg,transparent,#e0bb73,transparent)]" />
      ) : null}
    </button>
  );
}
