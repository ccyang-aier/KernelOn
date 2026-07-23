'use client';

import { PokerMatchConcierge } from './PokerMatchConcierge';
import { PokerRoomList } from './PokerRoomList';
import type { PokerRoomBrowserController } from './usePokerRoomBrowserController';

export function PokerRoomBrowser({
  controller,
}: Readonly<{ controller: PokerRoomBrowserController }>) {
  return (
    <main
      className="grid min-h-0 grid-cols-[minmax(720px,1fr)_440px] gap-2 overflow-hidden p-3"
      data-testid="poker-room-browser"
    >
      <PokerRoomList
        filter={controller.filter}
        onFilterChange={controller.selectFilter}
        onJoin={controller.openJoin}
        onRefresh={controller.refreshRooms}
        onSpectate={controller.spectateRoom}
        onStakeFilterChange={controller.setStakeFilter}
        rooms={controller.filteredRooms}
        stakeFilter={controller.stakeFilter}
      />
      <PokerMatchConcierge controller={controller} />
    </main>
  );
}
