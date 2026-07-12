'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { useStore } from 'zustand';

import type { WindowBounds, WindowMode } from '@kernelon/core';

import { DesktopClickRippleLayer, useDesktopClickRipple } from './components/desktop-click-ripple';
import {
  KernelOnDesktopContextMenu,
  resolveDesktopContextMenuPosition,
  type DesktopContextMenuPosition,
} from './components/desktop-context-menu';
import { DesktopDock } from './components/desktop-dock';
import { AppWindowMount, DesktopItemMount } from './components/desktop-mounts';
import {
  createDesktopGridCells,
  resolveDesktopGridAreaStyle,
  snapPointerToDesktopGrid,
} from './components/desktop-grid';
import { resolveWindowDisplayBounds } from './components/app-window-container';
import {
  GenieEffectLayer,
  type GenieRect,
  type GenieEffectLayerHandle,
} from './components/genie-effect-layer';
import { hideGenieWindow, revealGenieWindow } from './components/genie-hidden-windows';
import { GenieSnapshotStage } from './components/genie-snapshot-stage';
import { KernelOnStatusBar } from './components/status-bar';
import { ShellLockScreen, type ShellCredentialUser } from './components/shell-lock-screen';
import type { ShellRuntimeRegistry } from './runtime';
import {
  createShellStore,
  defaultDesktopLockIdleMinutes,
  normalizeDesktopLockIdleMinutes,
  type ShellInitialState,
  type ShellState,
  type ShellStore,
} from './shell-store';

export interface KernelOnShellProps {
  currentUser?: ShellCredentialUser;
  initialState: ShellInitialState;
  runtime: ShellRuntimeRegistry;
}

const ShellStoreContext = createContext<ShellStore | null>(null);

function ShellStoreProvider({
  children,
  initialState,
}: Readonly<{ children: ReactNode; initialState: ShellInitialState }>) {
  const store = useMemo(() => createShellStore(initialState), [initialState]);

  return <ShellStoreContext.Provider value={store}>{children}</ShellStoreContext.Provider>;
}

export function useShellSelector<T>(selector: (state: ShellState) => T): T {
  const store = useContext(ShellStoreContext);

  if (!store) {
    throw new Error('KernelOnShell must be rendered inside ShellStoreProvider');
  }

  return useStore(store, selector);
}

export function KernelOnShell({ currentUser, initialState, runtime }: KernelOnShellProps) {
  return (
    <ShellStoreProvider initialState={initialState}>
      <KernelOnShellView currentUser={currentUser} runtime={runtime} />
    </ShellStoreProvider>
  );
}

function KernelOnShellView({
  currentUser,
  runtime,
}: Readonly<{ currentUser?: ShellCredentialUser; runtime: ShellRuntimeRegistry }>) {
  const liquidGlassContextContainerRef = useRef<HTMLElement>(null);
  const desktopSurfaceRef = useRef<HTMLElement>(null);
  const genieEffectLayerRef = useRef<GenieEffectLayerHandle>(null);
  const genieSnapshotsRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const genieTransitioningAppIdRef = useRef<string | null>(null);
  const { layerRef: desktopClickRippleLayerRef, playRipple: playDesktopClickRipple } =
    useDesktopClickRipple();
  const apps = useShellSelector((state) => state.apps);
  const widgets = useShellSelector((state) => state.widgets);
  const currentScreenId = useShellSelector((state) => state.currentScreenId);
  const screens = useShellSelector((state) => state.screens);
  const windows = useShellSelector((state) => state.windows);
  const desktopWallpaper = useShellSelector((state) => state.desktopWallpaper);
  const isDesktopLocked = useShellSelector((state) => state.isDesktopLocked);
  const desktopLockPassword = useShellSelector((state) => state.desktopLockPassword);
  const desktopLockIdleMinutes = useShellSelector((state) => state.desktopLockIdleMinutes);
  const activateDesktopLock = useShellSelector((state) => state.activateDesktopLock);
  const restoreDesktopLock = useShellSelector((state) => state.restoreDesktopLock);
  const unlockDesktop = useShellSelector((state) => state.unlockDesktop);
  const dockAppIds = useShellSelector((state) => state.dockAppIds);
  const spotlightOpen = useShellSelector((state) => state.spotlightOpen);
  const activeDraggedDesktopItemId = useShellSelector((state) => state.activeDraggedDesktopItemId);
  const pendingWidgetPlacement = useShellSelector((state) => state.pendingWidgetPlacement);
  const addWidgetToScreen = useShellSelector((state) => state.addWidgetToScreen);
  const closeWindow = useShellSelector((state) => state.closeWindow);
  const focusWindow = useShellSelector((state) => state.focusWindow);
  const minimizeWindow = useShellSelector((state) => state.minimizeWindow);
  const moveDesktopItem = useShellSelector((state) => state.moveDesktopItem);
  const openApp = useShellSelector((state) => state.openApp);
  const removeDesktopItem = useShellSelector((state) => state.removeDesktopItem);
  const resizeWindow = useShellSelector((state) => state.resizeWindow);
  const setActiveDraggedDesktopItemId = useShellSelector(
    (state) => state.setActiveDraggedDesktopItemId,
  );
  const setPendingWidgetPlacement = useShellSelector((state) => state.setPendingWidgetPlacement);
  const toggleWindowFullscreen = useShellSelector((state) => state.toggleWindowFullscreen);
  const toggleLauncher = useShellSelector((state) => state.toggleLauncher);
  const toggleSpotlight = useShellSelector((state) => state.toggleSpotlight);
  const currentScreen = screens.find((screen) => screen.id === currentScreenId) ?? screens[0];
  const desktopItems = currentScreen?.items ?? [];
  const [desktopContextMenu, setDesktopContextMenu] = useState<DesktopContextMenuPosition | null>(
    null,
  );
  const [pendingPlacementPointer, setPendingPlacementPointer] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [desktopSurfaceSize, setDesktopSurfaceSize] = useState({ height: 0, width: 0 });
  const [genieHiddenWindowIds, setGenieHiddenWindowIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const closeDesktopContextMenu = useCallback(() => {
    setDesktopContextMenu(null);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kernelon_wallpaper_lock_screen');

      if (!saved) {
        return;
      }

      const config = JSON.parse(saved) as {
        enabled?: boolean;
        idleMinutes?: number;
        password?: string;
      };

      if (config.enabled && config.password) {
        restoreDesktopLock(
          config.password,
          normalizeDesktopLockIdleMinutes(config.idleMinutes ?? defaultDesktopLockIdleMinutes),
        );
      }
    } catch {
      // Ignore invalid legacy lock-screen settings and keep the desktop available.
    }
  }, [restoreDesktopLock]);

  useEffect(() => {
    if (!desktopLockPassword || isDesktopLocked) {
      return undefined;
    }

    let idleTimer = window.setTimeout(activateDesktopLock, desktopLockIdleMinutes * 60_000);
    const restartIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(activateDesktopLock, desktopLockIdleMinutes * 60_000);
    };
    const activityEvents = [
      'pointerdown',
      'pointermove',
      'keydown',
      'wheel',
      'touchstart',
    ] as const;

    activityEvents.forEach((eventName) => window.addEventListener(eventName, restartIdleTimer));

    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, restartIdleTimer),
      );
    };
  }, [activateDesktopLock, desktopLockIdleMinutes, desktopLockPassword, isDesktopLocked]);

  useEffect(() => {
    const element = desktopSurfaceRef.current;

    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const width = element.clientWidth || rect.width || window.innerWidth;
      const height = element.clientHeight || rect.height || window.innerHeight;

      setDesktopSurfaceSize((currentSize) =>
        currentSize.width === width && currentSize.height === height
          ? currentSize
          : { height, width },
      );
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const handleDesktopContextMenu = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    setDesktopContextMenu(resolveDesktopContextMenuPosition(event.clientX, event.clientY));
  }, []);

  const handleDesktopPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (pendingWidgetPlacement && event.button === 0 && event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        const pointer = {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        };
        const grid = snapPointerToDesktopGrid({
          bounds: { height: bounds.height, width: bounds.width },
          pointer,
          size: pendingWidgetPlacement,
        });

        addWidgetToScreen(currentScreenId, pendingWidgetPlacement.widgetId, grid);
        setPendingWidgetPlacement(null);
        setPendingPlacementPointer(null);
        setDesktopContextMenu(null);
        return;
      }

      if (event.button !== 0 || event.target !== event.currentTarget) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      playDesktopClickRipple({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      setDesktopContextMenu(null);
    },
    [
      addWidgetToScreen,
      currentScreenId,
      pendingWidgetPlacement,
      playDesktopClickRipple,
      setPendingWidgetPlacement,
    ],
  );

  const handleDesktopPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!pendingWidgetPlacement) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();

      setPendingPlacementPointer({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    },
    [pendingWidgetPlacement],
  );

  const handleGenieSnapshotReady = useCallback((appId: string, snapshot: HTMLCanvasElement) => {
    genieSnapshotsRef.current.set(appId, snapshot);
  }, []);

  const beginGenieTransition = useCallback((appId: string): boolean => {
    if (genieTransitioningAppIdRef.current) {
      return false;
    }

    genieTransitioningAppIdRef.current = appId;
    return true;
  }, []);

  const endGenieTransition = useCallback((appId: string) => {
    if (genieTransitioningAppIdRef.current === appId) {
      genieTransitioningAppIdRef.current = null;
    }
  }, []);

  const findDockTarget = useCallback((appId: string): HTMLElement | null => {
    const shellRoot = liquidGlassContextContainerRef.current;

    if (!shellRoot) {
      return null;
    }

    return (
      Array.from(shellRoot.querySelectorAll<HTMLElement>('[data-kernelon-dock-target]')).find(
        (element) => element.dataset.kernelonDockTarget === appId,
      ) ?? null
    );
  }, []);

  const handleOpenAppFromDock = useCallback(
    (appId: string, dockElement?: HTMLElement) => {
      const existingWindow = windows.find((window) => window.appId === appId);
      const app = apps.find((candidate) => candidate.id === appId);
      const shouldPlayGenie = Boolean(
        dockElement && (!existingWindow || existingWindow.status === 'minimized'),
      );
      const snapshot = genieSnapshotsRef.current.get(appId);
      const sourceBounds = existingWindow?.bounds ?? app?.defaultWindow.bounds;
      const sourceMode = existingWindow?.mode;

      if (!shouldPlayGenie || !dockElement || !snapshot || !sourceBounds) {
        flushSync(() => {
          setGenieHiddenWindowIds((hiddenWindowIds) =>
            revealGenieWindow(hiddenWindowIds, existingWindow?.id),
          );
          openApp(appId);
        });
        return;
      }

      if (!beginGenieTransition(appId)) {
        return;
      }

      void (async () => {
        try {
          const played =
            (await genieEffectLayerRef.current?.play({
              direction: 'open',
              onBeforeClear: () => {
                flushSync(() => {
                  setGenieHiddenWindowIds((hiddenWindowIds) =>
                    revealGenieWindow(hiddenWindowIds, existingWindow?.id),
                  );
                  openApp(appId);
                });
              },
              snapshot,
              sourceRect: windowBoundsToGenieRect(sourceBounds, sourceMode),
              targetElement: dockElement,
            })) ?? false;

          if (!played) {
            flushSync(() => {
              setGenieHiddenWindowIds((hiddenWindowIds) =>
                revealGenieWindow(hiddenWindowIds, existingWindow?.id),
              );
              openApp(appId);
            });
          }
        } finally {
          endGenieTransition(appId);
        }
      })();
    },
    [apps, beginGenieTransition, endGenieTransition, openApp, windows],
  );

  const handleMinimizeWindow = useCallback(
    (windowId: string, sourceElement: HTMLElement | null) => {
      const descriptor = windows.find((window) => window.id === windowId);
      const dockElement = descriptor ? findDockTarget(descriptor.appId) : null;
      const snapshot = descriptor ? genieSnapshotsRef.current.get(descriptor.appId) : null;

      if (!descriptor || !sourceElement || !dockElement || !snapshot) {
        minimizeWindow(windowId);
        return;
      }

      if (!beginGenieTransition(descriptor.appId)) {
        return;
      }

      void (async () => {
        try {
          const played =
            (await genieEffectLayerRef.current?.play({
              direction: 'minimize',
              onAfterFirstFrame: () => {
                flushSync(() => {
                  setGenieHiddenWindowIds((hiddenWindowIds) =>
                    hideGenieWindow(hiddenWindowIds, windowId),
                  );
                });
              },
              onBeforeClear: () => {
                flushSync(() => {
                  minimizeWindow(windowId);
                });
              },
              snapshot,
              sourceElement,
              sourceRect: getElementRect(sourceElement),
              targetElement: dockElement,
            })) ?? false;

          if (!played) {
            setGenieHiddenWindowIds((hiddenWindowIds) =>
              revealGenieWindow(hiddenWindowIds, windowId),
            );
            minimizeWindow(windowId);
          }
        } finally {
          endGenieTransition(descriptor.appId);
        }
      })();
    },
    [beginGenieTransition, endGenieTransition, findDockTarget, minimizeWindow, windows],
  );

  const pendingPlacementGrid =
    pendingWidgetPlacement && pendingPlacementPointer
      ? snapPointerToDesktopGrid({
          bounds: desktopSurfaceSize,
          pointer: pendingPlacementPointer,
          size: pendingWidgetPlacement,
        })
      : null;
  const pendingPlacementStyle = pendingPlacementGrid
    ? resolveDesktopGridAreaStyle(pendingPlacementGrid)
    : null;
  const desktopGridCells = useMemo(
    () => createDesktopGridCells(desktopSurfaceSize),
    [desktopSurfaceSize],
  );

  if (isDesktopLocked) {
    return (
      <main
        aria-label="KernelOn shell"
        className="relative min-h-screen overflow-hidden bg-[#5f8789] text-white"
        data-testid="kernelon-shell"
      >
        <ShellLockScreen onUnlock={unlockDesktop} user={currentUser} wallpaper={desktopWallpaper} />
      </main>
    );
  }

  return (
    <main
      ref={liquidGlassContextContainerRef}
      aria-label="KernelOn shell"
      className="relative min-h-screen overflow-hidden bg-[var(--ko-bg)] text-[var(--ko-ink)]"
      data-kernelon-cursor-scope="true"
      data-testid="kernelon-shell"
    >
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        data-testid="kernelon-desktop-wallpaper"
        draggable={false}
        src={desktopWallpaper}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(255,255,255,0.20),transparent_34%),linear-gradient(180deg,rgba(4,19,12,0.02),rgba(4,19,12,0.08))]"
      />
      <KernelOnStatusBar
        currentUser={currentUser}
        onToggleSpotlight={toggleSpotlight}
        spotlightOpen={spotlightOpen}
      />
      <section
        ref={desktopSurfaceRef}
        aria-label="KernelOn desktop"
        className="relative min-h-screen"
        data-testid="kernelon-desktop-surface"
        onContextMenu={handleDesktopContextMenu}
        onPointerDown={handleDesktopPointerDown}
        onPointerMove={handleDesktopPointerMove}
      >
        <AnimatePresence>
          {pendingWidgetPlacement || activeDraggedDesktopItemId ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="pointer-events-none absolute inset-0 z-0"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
            >
              {desktopGridCells.map((cell) => (
                <div
                  className="absolute rounded-[18px] border border-dashed border-white/18 bg-white/[0.035] shadow-[inset_0_0_8px_rgba(255,255,255,0.03)]"
                  key={`${cell.x}-${cell.y}`}
                  style={resolveDesktopGridAreaStyle({
                    height: 1,
                    width: 1,
                    x: cell.x,
                    y: cell.y,
                  })}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <DesktopClickRippleLayer layerRef={desktopClickRippleLayerRef} />
        {desktopItems.map((item) => (
          <DesktopItemMount
            item={item}
            key={item.id}
            onDragStateChange={setActiveDraggedDesktopItemId}
            onMoveItem={(itemId, grid) => moveDesktopItem(currentScreenId, itemId, grid)}
            onRemoveItem={(itemId) => removeDesktopItem(currentScreenId, itemId)}
            runtime={runtime}
            widgets={widgets}
          />
        ))}
        {pendingWidgetPlacement && pendingPlacementStyle ? (
          <div
            className="pointer-events-none absolute z-10 rounded-[22px] border-2 border-dashed border-ko-ring bg-ko-ring/10 shadow-[0_0_20px_rgba(84,179,153,0.15)]"
            style={pendingPlacementStyle}
          />
        ) : null}
        {pendingWidgetPlacement && pendingPlacementPointer ? (
          <div
            className="pointer-events-none absolute z-50 flex items-center justify-center rounded-[22px] border border-white/60 bg-white/40 font-semibold text-ko-ink/90 shadow-[0_12px_28px_rgba(0,0,0,0.15)] backdrop-blur-[8px]"
            style={{
              height: pendingPlacementStyle?.height,
              left: pendingPlacementPointer.x - Number(pendingPlacementStyle?.width ?? 0) / 2,
              top: pendingPlacementPointer.y - Number(pendingPlacementStyle?.height ?? 0) / 2,
              width: pendingPlacementStyle?.width,
            }}
          >
            <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/20 bg-black/48 px-4 py-2.5 text-white shadow-lg backdrop-blur-md">
              <span className="text-[12px] font-bold">放置小组件</span>
              <span className="text-[10px] text-white/70">点击桌面确认位置</span>
            </div>
          </div>
        ) : null}
        <AnimatePresence>
          {windows
            .filter((window) => window.status !== 'minimized')
            .map((window) => {
              const app = apps.find((item) => item.id === window.appId);

              return app ? (
                <AppWindowMount
                  app={app}
                  key={window.id}
                  onClose={closeWindow}
                  onFocus={focusWindow}
                  genieHidden={genieHiddenWindowIds.has(window.id)}
                  onMinimize={handleMinimizeWindow}
                  onResize={resizeWindow}
                  onToggleFullscreen={toggleWindowFullscreen}
                  runtime={runtime}
                  window={window}
                />
              ) : null;
            })}
        </AnimatePresence>
      </section>
      <AnimatePresence>
        {desktopContextMenu ? (
          <KernelOnDesktopContextMenu
            key={`${desktopContextMenu.x}-${desktopContextMenu.y}`}
            mouseContainer={liquidGlassContextContainerRef}
            onClose={closeDesktopContextMenu}
            onOpenWallpaper={() => openApp('wallpaper')}
            onOpenWidgetManager={() => {
              openApp('widget-manager');
              closeDesktopContextMenu();
            }}
            onOpenSpotlight={toggleSpotlight}
            position={desktopContextMenu}
          />
        ) : null}
      </AnimatePresence>
      <DesktopDock
        apps={apps}
        dockAppIds={dockAppIds}
        onOpenApp={handleOpenAppFromDock}
        onToggleLauncher={toggleLauncher}
        onToggleSpotlight={toggleSpotlight}
      />
      <GenieSnapshotStage
        appIds={dockAppIds}
        apps={apps}
        onSnapshotReady={handleGenieSnapshotReady}
        runtime={runtime}
      />
      <GenieEffectLayer ref={genieEffectLayerRef} />
    </main>
  );
}

function windowBoundsToGenieRect(bounds: WindowBounds, mode?: WindowMode): GenieRect {
  const displayBounds = resolveWindowDisplayBounds(bounds, mode);

  return {
    height: displayBounds.height,
    width: displayBounds.width,
    x: displayBounds.x,
    y: displayBounds.y,
  };
}

function getElementRect(element: HTMLElement): GenieRect {
  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
    x: rect.left,
    y: rect.top,
  };
}
