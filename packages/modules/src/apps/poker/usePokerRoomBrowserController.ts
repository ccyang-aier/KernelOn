'use client';

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  pokerRooms,
  type PokerMatchMode,
  type PokerMatchSeats,
  type PokerMatchStakes,
  type PokerRoom,
  type PokerRoomFilter,
} from './pokerRoomData';

type MatchStatus = 'idle' | 'matching' | 'ready';
type JoinedRoomState = { room: PokerRoom; status: 'waiting' | 'ready' } | null;

interface PokerRoomBrowserControllerOptions {
  announce(message: string): void;
  onEnterTable(target: string): void;
}

export function usePokerRoomBrowserController({
  announce,
  onEnterTable,
}: PokerRoomBrowserControllerOptions) {
  const [filter, setFilter] = useState<PokerRoomFilter>('all');
  const [joinTarget, setJoinTarget] = useState<PokerRoom | null>(null);
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoomState>(null);
  const [matchMode, setMatchMode] = useState<PokerMatchMode>('quick');
  const [matchPlayers, setMatchPlayers] = useState(0);
  const [matchSeats, setMatchSeats] = useState<PokerMatchSeats>(6);
  const [matchStakes, setMatchStakes] = useState<PokerMatchStakes>('5 / 10');
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [query, setQuery] = useState('');
  const [roomRotation, setRoomRotation] = useState(0);
  const [stakeFilter, setStakeFilter] = useState('all');
  const joinedRoomTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (joinedRoomTimerRef.current) {
        globalThis.clearTimeout(joinedRoomTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (matchStatus !== 'matching') {
      return undefined;
    }

    const timer = globalThis.setInterval(() => {
      setMatchPlayers((current) => {
        const next = Math.min(matchSeats, current + 1);
        if (next === matchSeats) {
          setMatchStatus('ready');
          announce('匹配完成，王冠深筹牌桌已经就绪');
        }
        return next;
      });
    }, 1100);

    return () => globalThis.clearInterval(timer);
  }, [announce, matchSeats, matchStatus]);

  const filteredRooms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const rotated = pokerRooms.map(
      (_, index) => pokerRooms[(index + roomRotation) % pokerRooms.length]!,
    );
    return rotated.filter((room) => {
      const matchesFilter = filter === 'all' || room.filterTags.includes(filter);
      const matchesStake = stakeFilter === 'all' || room.stakes === stakeFilter;
      const matchesQuery =
        !normalized ||
        room.name.toLocaleLowerCase().includes(normalized) ||
        room.host.toLocaleLowerCase().includes(normalized);
      return matchesFilter && matchesStake && matchesQuery;
    });
  }, [filter, query, roomRotation, stakeFilter]);

  const selectFilter = useCallback((value: PokerRoomFilter) => {
    startTransition(() => setFilter(value));
  }, []);

  const openJoin = useCallback(
    (room: PokerRoom) => {
      if (room.status !== 'forming') {
        announce(`${room.name}正在进行中，可先进入旁观席`);
        return;
      }
      setJoinTarget(room);
    },
    [announce],
  );

  const confirmJoin = useCallback(() => {
    if (!joinTarget) {
      return;
    }

    if (joinedRoomTimerRef.current) {
      globalThis.clearTimeout(joinedRoomTimerRef.current);
    }
    setMatchStatus('idle');
    setMatchPlayers(0);
    setJoinedRoom({ room: joinTarget, status: 'waiting' });
    announce(`已加入 ${joinTarget.name}，等待房间就绪`);
    setJoinTarget(null);
    joinedRoomTimerRef.current = globalThis.setTimeout(() => {
      setJoinedRoom((current) => (current ? { ...current, status: 'ready' } : current));
      announce('房间成员已就绪，可以进入牌桌');
      joinedRoomTimerRef.current = null;
    }, 2400);
  }, [announce, joinTarget]);

  const leaveJoinedRoom = useCallback(() => {
    if (joinedRoomTimerRef.current) {
      globalThis.clearTimeout(joinedRoomTimerRef.current);
      joinedRoomTimerRef.current = null;
    }
    setJoinedRoom(null);
    announce('已退出组队房间');
  }, [announce]);

  const startMatching = useCallback(() => {
    if (joinedRoomTimerRef.current) {
      globalThis.clearTimeout(joinedRoomTimerRef.current);
      joinedRoomTimerRef.current = null;
    }
    setJoinedRoom(null);
    setMatchPlayers(Math.min(4, matchSeats - 1));
    setMatchStatus('matching');
    announce('智能匹配已启动，正在寻找合适牌桌');
  }, [announce, matchSeats]);

  const cancelMatching = useCallback(() => {
    setMatchPlayers(0);
    setMatchStatus('idle');
    announce('已取消智能匹配');
  }, [announce]);

  const enterJoinedRoom = useCallback(() => {
    if (joinedRoom?.status !== 'ready') {
      return;
    }
    onEnterTable(`${joinedRoom.room.name} · ${joinedRoom.room.stakes}`);
  }, [joinedRoom, onEnterTable]);

  const enterMatchedRoom = useCallback(() => {
    if (matchStatus !== 'ready') {
      return;
    }
    onEnterTable(`智能匹配 · ${matchStakes}`);
  }, [matchStakes, matchStatus, onEnterTable]);

  const spectateRoom = useCallback(
    (room: PokerRoom) => {
      announce(`已为你保留 ${room.name} 旁观席，牌局画面将在下一手同步`);
    },
    [announce],
  );

  const refreshRooms = useCallback(() => {
    startTransition(() => {
      setRoomRotation((current) => (current + 1) % pokerRooms.length);
    });
    announce('房间状态已刷新');
  }, [announce]);

  return {
    cancelMatching,
    confirmJoin,
    enterJoinedRoom,
    enterMatchedRoom,
    filter,
    filteredRooms,
    joinedRoom,
    joinTarget,
    matchMode,
    matchPlayers,
    matchSeats,
    matchStakes,
    matchStatus,
    openJoin,
    query,
    refreshRooms,
    selectFilter,
    setJoinTarget,
    setMatchMode,
    setMatchSeats,
    setMatchStakes,
    setQuery,
    setStakeFilter,
    spectateRoom,
    stakeFilter,
    startMatching,
    leaveJoinedRoom,
  };
}

export type PokerRoomBrowserController = ReturnType<typeof usePokerRoomBrowserController>;
