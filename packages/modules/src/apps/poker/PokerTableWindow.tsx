'use client';

import { ArrowLeft, DoorOpen, Hash, Settings, Users, Volume2, VolumeX, Wifi } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';

import { AppFrame, type AppFrameProps } from '@kernelon/shell';

import { PokerTableActions } from './PokerTableActions';
import { PokerTableRail } from './PokerTableRail';
import { PokerTableStage } from './PokerTableStage';
import { usePokerTableController } from './usePokerTableController';

const tableFrameStyle = {
  '--ko-app-header-border': 'rgba(98, 101, 99, 0.34)',
  '--ko-app-header-inset-shadow': 'inset 0 1px 0 rgba(255,255,255,0.045)',
  '--ko-app-header-surface': 'linear-gradient(180deg, #171a1b 0%, #111414 100%)',
  colorScheme: 'dark',
  fontFamily:
    'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
} as CSSProperties;

const tableHeader: AppFrameProps['header'] = {
  center: [{ id: 'poker-table-title', type: 'slot' }],
  density: 'comfortable',
  identity: { title: '' },
  leading: [{ id: 'poker-table-leading', type: 'slot' }],
  mode: 'composable',
  preset: 'plain',
  trailing: [{ id: 'poker-table-metrics', type: 'slot' }],
};

export function PokerTableWindow({ onExit }: Readonly<{ onExit(): void }>) {
  const controller = usePokerTableController();
  const reduceMotion = useReducedMotion();

  const headerSlots = {
    'poker-table-leading': (
      <div className="flex items-center gap-1.5">
        <HeaderButton label="返回大厅" onClick={onExit}>
          <ArrowLeft className="size-[18px]" />
        </HeaderButton>
        <HeaderButton
          label="离开牌桌"
          onClick={() => controller.announce('离桌确认已取消，你仍在牌局中')}
        >
          <DoorOpen className="size-[18px]" />
        </HeaderButton>
      </div>
    ),
    'poker-table-metrics': (
      <div className="flex h-9 items-center divide-x divide-white/[.09] text-[12px] text-[#a8aaa6]">
        <span className="flex items-center gap-1.5 px-4 tabular-nums">
          <Hash className="size-3.5" />
          08421
        </span>
        <span className="flex items-center gap-1.5 px-4">
          <Users className="size-4" />
          18
        </span>
        <span className="flex items-center gap-1.5 px-4 text-[#51d375]">
          <Wifi className="size-4" />
          32ms
        </span>
        <button
          aria-label={controller.isMuted ? '开启牌桌声音' : '静音牌桌声音'}
          className="grid h-9 w-12 place-items-center px-4 text-[#d1d3cf] transition hover:bg-white/[.045] hover:text-[#f0d29a]"
          onClick={() => controller.setIsMuted(!controller.isMuted)}
          type="button"
        >
          {controller.isMuted ? (
            <VolumeX className="size-[18px]" />
          ) : (
            <Volume2 className="size-[18px]" />
          )}
        </button>
        <button
          aria-expanded={controller.settingsOpen}
          aria-label="牌桌设置"
          className="grid h-9 w-12 place-items-center px-4 text-[#d1d3cf] transition hover:rotate-6 hover:bg-white/[.045] hover:text-[#f0d29a]"
          onClick={() => controller.setSettingsOpen(!controller.settingsOpen)}
          type="button"
        >
          <Settings className="size-[19px]" />
        </button>
      </div>
    ),
    'poker-table-title': (
      <div className="flex items-center gap-3 whitespace-nowrap text-[18px] font-semibold tracking-[.06em] text-[#eadfc8]">
        <span>王冠深筹 · 10/20</span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[.08em] text-[#ef5a54]">
          <i className="size-2 rounded-full bg-[#ef5a54] shadow-[0_0_8px_rgba(239,90,84,.7)]" />
          LIVE
        </span>
      </div>
    ),
  };

  return (
    <AppFrame
      className="[&_[data-app-header-row=primary]]:!min-h-[58px] [&_[data-app-window-controls=true]]:!top-[29px] [&_[data-kernelon-app-header=true]]:!min-h-[58px]"
      contentClassName="!bg-[#0c0f10]"
      header={tableHeader}
      headerSlots={headerSlots}
      scroll="hidden"
      style={tableFrameStyle}
    >
      <div
        className="relative h-full min-h-0 overflow-hidden bg-[#0b0e0f] text-[#ded9cd]"
        data-testid="poker-table-window"
      >
        <div className="grid h-full min-h-[760px] min-w-[1320px] grid-cols-[72.3%_27.7%] grid-rows-[minmax(0,1fr)_206px]">
          <PokerTableStage />
          <PokerTableRail
            activeTab={controller.railTab}
            onReact={controller.react}
            onTabChange={controller.setRailTab}
            reactionCounts={controller.reactionCounts}
          />
          <PokerTableActions
            betAmount={controller.betAmount}
            betPercent={controller.betPercent}
            chatValue={controller.chatValue}
            onAction={controller.act}
            onBetChange={controller.setBetAmount}
            onChatChange={controller.setChatValue}
            onChoosePreset={controller.choosePreset}
            onSendChat={controller.sendChat}
          />
        </div>

        <AnimatePresence>
          {controller.settingsOpen ? (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-4 top-3 z-50 w-56 origin-top-right rounded-xl border border-[#8f754b]/45 bg-[#181b1b]/95 p-3 shadow-[0_24px_50px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl"
              exit={{ opacity: 0, scale: 0.97, y: -5 }}
              initial={{ opacity: 0, scale: 0.97, y: -5 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            >
              <p className="mb-2 text-[12px] font-semibold text-[#dfc38d]">牌桌设置</p>
              {['四花色牌面', '快捷下注确认', '高光行动提示'].map((label) => (
                <label
                  className="flex items-center justify-between border-t border-white/[.055] py-2 text-[11px] text-[#aaa9a3]"
                  key={label}
                >
                  {label}
                  <input className="accent-[#cfa75d]" defaultChecked type="checkbox" />
                </label>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {controller.notice ? (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="pointer-events-none absolute bottom-[222px] left-1/2 z-[70] -translate-x-1/2 rounded-full border border-[#c49a50]/55 bg-[#171a19]/92 px-5 py-2.5 text-[12px] font-medium text-[#ead2a4] shadow-[0_15px_30px_rgba(0,0,0,.48),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl"
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              key={controller.notice.id}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              {controller.notice.message}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </AppFrame>
  );
}

function HeaderButton({
  children,
  label,
  onClick,
}: Readonly<{ children: ReactNode; label: string; onClick(): void }>) {
  return (
    <button
      aria-label={label}
      className="grid size-9 place-items-center rounded-md border border-white/[.08] bg-[linear-gradient(145deg,#292c2d,#1b1e1f)] text-[#d1d3cf] shadow-[inset_0_1px_0_rgba(255,255,255,.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9f8250]/55 hover:text-[#f0d19a] active:translate-y-0"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
