'use client';

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { pokerTables } from './data';

export type PokerToolbarMenu = 'notifications' | 'wallet' | null;
export type PokerNotice = { id: number; message: string } | null;

const POKER_REFERENCE_CONTENT_HEIGHT = 908;
const MINIMUM_DENSITY_SCALE = 0.84;

export function usePokerLobbyController() {
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [joinTarget, setJoinTarget] = useState<string | null>(null);
  const [menu, setMenu] = useState<PokerToolbarMenu>(null);
  const [notice, setNotice] = useState<PokerNotice>(null);
  const [query, setQuery] = useState('');
  const [rotation, setRotation] = useState(0);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const noticeTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) {
        globalThis.clearTimeout(noticeTimerRef.current);
      }
    },
    [],
  );

  const announce = useCallback((message: string) => {
    if (noticeTimerRef.current) {
      globalThis.clearTimeout(noticeTimerRef.current);
    }

    const id = Date.now();
    setNotice({ id, message });
    noticeTimerRef.current = globalThis.setTimeout(() => {
      setNotice((current) => (current?.id === id ? null : current));
      noticeTimerRef.current = null;
    }, 2400);
  }, []);

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

  const selectNavigation = useCallback(
    (id: string, label: string) => {
      announce(id === 'lobby' ? '当前已在大厅' : `${label}将在后续界面继续实现`);
    },
    [announce],
  );

  const inviteFriend = useCallback(
    (name: string) => {
      setFriendMessage(`已向 ${name} 发送同桌邀请`);
      announce(`邀请已发送给 ${name}`);
    },
    [announce],
  );

  const claimTask = useCallback(
    (id: string, label: string) => {
      setTaskProgress((current) => ({ ...current, [id]: 1 }));
      announce(`${label}奖励已领取`);
    },
    [announce],
  );

  const rotateTables = useCallback(() => {
    startTransition(() => {
      setRotation((value) => (value + 1) % pokerTables.length);
    });
    announce('已为你更新一批牌桌');
  }, [announce]);

  const confirmJoin = useCallback(() => {
    if (!joinTarget) {
      return;
    }

    announce(`正在进入 ${joinTarget}`);
    setJoinTarget(null);
  }, [announce, joinTarget]);

  return {
    activeNav: 'lobby',
    announce,
    claimTask,
    confirmJoin,
    filteredTables,
    friendMessage,
    inviteFriend,
    joinTarget,
    menu,
    notice,
    openJoin: setJoinTarget,
    query,
    rotateTables,
    selectNavigation,
    setJoinTarget,
    setMenu,
    setQuery,
    taskProgress,
  };
}

export function usePokerDensityScale() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const surface = surfaceRef.current;

    if (!surface) {
      return undefined;
    }

    const syncScale = () => {
      const height = surface.clientHeight;
      const width = surface.clientWidth;
      const heightScale = height > 0 ? height / POKER_REFERENCE_CONTENT_HEIGHT : 1;
      const aspectRatio = height > 0 ? width / height : 1;
      const aspectScale = Math.max(
        MINIMUM_DENSITY_SCALE,
        1 - Math.max(0, aspectRatio - 1.68) * 0.7,
      );
      const nextScale = Math.min(
        1,
        Math.max(MINIMUM_DENSITY_SCALE, Math.min(heightScale, aspectScale)),
      );
      const normalizedScale = Math.round(nextScale * 1000) / 1000;

      setScale((current) =>
        Math.abs(current - normalizedScale) < 0.005 ? current : normalizedScale,
      );
    };

    syncScale();

    const ResizeObserverConstructor = globalThis.ResizeObserver;
    const resizeObserver = ResizeObserverConstructor
      ? new ResizeObserverConstructor(syncScale)
      : null;

    resizeObserver?.observe(surface);
    globalThis.window?.addEventListener('resize', syncScale, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      globalThis.window?.removeEventListener('resize', syncScale);
    };
  }, []);

  const inverseScale = 100 / scale;
  const canvasStyle = {
    '--poker-density': scale,
    gridTemplateColumns: `${200 / scale}px minmax(0, 1fr)`,
    height: `${inverseScale}%`,
    minHeight: `${800 / scale}px`,
    minWidth: `${1220 / scale}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'left top',
    width: `${inverseScale}%`,
  } as CSSProperties & { '--poker-density': number };

  const workspaceStyle = {
    gridTemplateRows: `${64 / scale}px minmax(0, 1fr)`,
  } satisfies CSSProperties;

  const contentStyle = {
    gridTemplateRows: `${339 / scale}px ${203 / scale}px ${238 / scale}px`,
    minHeight: `${740 / scale}px`,
  } satisfies CSSProperties;

  return {
    canvasStyle,
    compactChrome: scale < 0.92,
    contentStyle,
    scale,
    surfaceRef,
    workspaceStyle,
  };
}
