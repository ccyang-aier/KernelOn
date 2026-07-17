'use client';

import { ChevronRight, Coins, Crown, Info, RefreshCw, Star, Users } from 'lucide-react';
import { motion } from 'motion/react';

import { pokerAssetRoot, pokerFriends, pokerTables } from './data';

export function HeroPanel({ onJoin }: Readonly<{ onJoin(): void }>) {
  return (
    <section className="group relative min-h-0 overflow-hidden rounded-[10px] border border-[#75592b]/85 bg-[#07100c] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <img
        alt="今晚主桌牌桌"
        className="absolute inset-0 h-full w-full object-cover object-[64%_center] transition duration-700 group-hover:scale-[1.015]"
        src={`${pokerAssetRoot}/lobby-hero.webp`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,9,7,0.97)_0%,rgba(4,9,7,0.86)_33%,rgba(4,9,7,0.28)_66%,rgba(4,9,7,0.04)_100%)]" />
      <div className="absolute inset-y-0 left-0 flex w-[52%] flex-col px-7 pb-[45px] pt-5">
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
        <motion.button
          className="mt-auto flex h-[56px] w-[232px] items-center justify-center gap-8 rounded-[8px] border border-[#e0bf77] bg-[linear-gradient(180deg,#e9ce91_0%,#cda357_100%)] text-[20px] font-black tracking-[0.08em] text-[#17130c] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_10px_24px_rgba(0,0,0,0.28)] transition-[filter,box-shadow] hover:brightness-105 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_14px_30px_rgba(0,0,0,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d79e]"
          onClick={onJoin}
          transition={{ damping: 22, stiffness: 360, type: 'spring' }}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.975 }}
        >
          立即入座 <ChevronRight className="size-5" strokeWidth={2.6} />
        </motion.button>
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

export function TodayPanel({ onContinue }: Readonly<{ onContinue(): void }>) {
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
        <motion.button
          className="h-10 shrink-0 rounded-[7px] border border-[#dfbf7b] bg-[linear-gradient(180deg,#e8cf98,#c49b50)] px-4 text-[14px] font-bold text-[#17130c] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1dca7]"
          onClick={onContinue}
          type="button"
          whileTap={{ scale: 0.96 }}
        >
          继续游戏
        </motion.button>
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

interface QuickTablesProps {
  onJoin(value: string): void;
  onRotate(): void;
  tables: typeof pokerTables | ReadonlyArray<(typeof pokerTables)[number]>;
}

export function QuickTables({ onJoin, onRotate, tables }: QuickTablesProps) {
  return (
    <section className="min-h-0 overflow-hidden rounded-[10px] border border-[#554322] bg-[linear-gradient(180deg,#111412,#0d100f)] px-3 pb-2.5 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex h-7 items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#dfc88d]">快速开局</h2>
        <motion.button
          className="flex items-center gap-1.5 text-[11px] text-[#9f9a8c] transition hover:text-[#e1c784] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
          onClick={onRotate}
          type="button"
          whileTap={{ scale: 0.95 }}
        >
          换一批 <RefreshCw className="size-3.5" />
        </motion.button>
      </div>
      {tables.length > 0 ? (
        <div className="grid h-[calc(100%-28px)] grid-cols-4 gap-3">
          {tables.map((table, tableIndex) => (
            <motion.button
              className="group relative min-h-0 overflow-hidden rounded-[9px] border border-[#514328] bg-[#121512] text-left transition-colors hover:border-[#b28d46] hover:shadow-[0_12px_28px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b369]/60"
              key={table.name}
              onClick={() => onJoin(`${table.name} · ${table.stakes}`)}
              transition={{ damping: 24, stiffness: 330, type: 'spring' }}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
            >
              <img
                alt={`${table.name}牌桌`}
                className="absolute inset-x-0 top-0 h-[76%] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                src={table.image}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,7,0.08)_0%,rgba(5,8,7,0.08)_42%,rgba(7,9,8,0.94)_76%,#0b0e0d_100%)]" />
              <span className="absolute right-3 top-2.5 text-[#99885e]">
                {tableIndex === 3 ? (
                  <Crown className="size-4" strokeWidth={1.5} />
                ) : (
                  <Star className="size-4" strokeWidth={1.5} />
                )}
              </span>
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
            </motion.button>
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
