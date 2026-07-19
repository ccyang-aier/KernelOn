'use client';

import { useCallback, useState, type CSSProperties } from 'react';

import { AppFrame, type AppFrameProps, type AppWindowSurfaceProps } from '@kernelon/shell';

import { DailyTasks, FriendsPanel, TournamentPanel } from './PokerLobbyCommunity';
import { PokerLobbyFeedbackLayer } from './PokerLobbyFeedback';
import { PokerSidebar, PokerToolbar } from './PokerLobbyChrome';
import { HeroPanel, QuickTables, TodayPanel } from './PokerLobbyTables';
import { PokerTableWindow } from './PokerTableWindow';
import { usePokerDensityScale, usePokerLobbyController } from './usePokerLobbyController';

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

const compactChromeClassName = [
  '[&_[data-app-window-controls=true]]:origin-left',
  '[&_[data-app-window-controls=true]]:scale-[0.84]',
].join(' ');

export default function PokerLobbyWindow(props: AppWindowSurfaceProps) {
  void props;
  const [surface, setSurface] = useState<'lobby' | 'table'>('lobby');
  const enterTable = useCallback(() => setSurface('table'), []);
  const controller = usePokerLobbyController(enterTable);
  const { canvasStyle, compactChrome, contentStyle, scale, surfaceRef, workspaceStyle } =
    usePokerDensityScale();

  if (surface === 'table') {
    return <PokerTableWindow onExit={() => setSurface('lobby')} />;
  }

  return (
    <AppFrame
      className={`[&_[data-kernelon-app-header=true]]:border-[#2a2e2e] [&_[data-kernelon-app-header=true]]:bg-[#171a1b] [&_[data-kernelon-app-header=true]]:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] ${
        compactChrome ? compactChromeClassName : ''
      }`}
      contentClassName="!bg-[#090c0c]"
      header={pokerHeader}
      scroll="hidden"
      style={pokerFrameStyle}
    >
      <div
        className="h-full min-h-0 overflow-hidden bg-[#090c0c] text-[#e9dfc7]"
        data-density-scale={scale}
        data-testid="poker-lobby-window"
        ref={surfaceRef}
      >
        <div className="relative grid h-full" style={canvasStyle}>
          <PokerSidebar
            activeNav={controller.activeNav}
            onMembership={() => controller.announce('黑桃会员权益面板已准备就绪')}
            onSelect={controller.selectNavigation}
          />
          <div
            className="grid min-h-0 overflow-hidden border-l border-[#2f2b23] bg-[#0b0e0d]"
            style={workspaceStyle}
          >
            <PokerToolbar
              menu={controller.menu}
              onAnnounce={controller.announce}
              onMenuChange={controller.setMenu}
              onSearch={controller.setQuery}
              query={controller.query}
            />
            <main className="min-h-0 overflow-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid h-full gap-2" style={contentStyle}>
                <div className="grid min-h-0 grid-cols-[minmax(0,1.74fr)_minmax(350px,1fr)] gap-2">
                  <HeroPanel onJoin={() => controller.openJoin('今晚主桌 · 10 / 20')} />
                  <TodayPanel onContinue={() => controller.openJoin('深筹常规桌 · 10 / 20')} />
                </div>
                <QuickTables
                  onJoin={controller.openJoin}
                  onRotate={controller.rotateTables}
                  tables={controller.filteredTables}
                />
                <div className="grid min-h-0 grid-cols-[0.9fr_1.08fr_1.08fr] gap-2">
                  <TournamentPanel onOpen={() => controller.announce('已打开深夜冠军赛报名详情')} />
                  <FriendsPanel
                    message={controller.friendMessage}
                    onInvite={controller.inviteFriend}
                    onViewAll={() => controller.announce('已展示全部在线牌友')}
                  />
                  <DailyTasks onClaim={controller.claimTask} progress={controller.taskProgress} />
                </div>
              </div>
            </main>
          </div>
          <PokerLobbyFeedbackLayer
            joinTarget={controller.joinTarget}
            notice={controller.notice}
            onCancelJoin={() => controller.setJoinTarget(null)}
            onConfirmJoin={controller.confirmJoin}
          />
        </div>
      </div>
    </AppFrame>
  );
}
