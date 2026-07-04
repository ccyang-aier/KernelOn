'use client';

import { AnimatePresence } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
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
import { resolveWindowDisplayBounds } from './components/app-window-container';
import {
  GenieEffectLayer,
  type GenieRect,
  type GenieEffectLayerHandle,
} from './components/genie-effect-layer';
import { hideGenieWindow, revealGenieWindow } from './components/genie-hidden-windows';
import { GenieSnapshotStage } from './components/genie-snapshot-stage';
import { KernelOnStatusBar } from './components/status-bar';
import type { ShellRuntimeRegistry } from './runtime';
import {
  createShellStore,
  type ShellInitialState,
  type ShellState,
  type ShellStore,
} from './shell-store';
import { kernelOnDesktopWallpaper } from './visual-assets';

export interface KernelOnShellProps {
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

function useShellSelector<T>(selector: (state: ShellState) => T): T {
  const store = useContext(ShellStoreContext);

  if (!store) {
    throw new Error('KernelOnShell must be rendered inside ShellStoreProvider');
  }

  return useStore(store, selector);
}

export function KernelOnShell({ initialState, runtime }: KernelOnShellProps) {
  return (
    <ShellStoreProvider initialState={initialState}>
      <KernelOnShellView runtime={runtime} />
    </ShellStoreProvider>
  );
}

function KernelOnShellView({ runtime }: Readonly<{ runtime: ShellRuntimeRegistry }>) {
  const liquidGlassContextContainerRef = useRef<HTMLElement>(null);
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
  const dockAppIds = useShellSelector((state) => state.dockAppIds);
  const spotlightOpen = useShellSelector((state) => state.spotlightOpen);
  const closeWindow = useShellSelector((state) => state.closeWindow);
  const focusWindow = useShellSelector((state) => state.focusWindow);
  const minimizeWindow = useShellSelector((state) => state.minimizeWindow);
  const openApp = useShellSelector((state) => state.openApp);
  const resizeWindow = useShellSelector((state) => state.resizeWindow);
  const toggleWindowFullscreen = useShellSelector((state) => state.toggleWindowFullscreen);
  const toggleLauncher = useShellSelector((state) => state.toggleLauncher);
  const toggleSpotlight = useShellSelector((state) => state.toggleSpotlight);
  const currentScreen = screens.find((screen) => screen.id === currentScreenId) ?? screens[0];
  const desktopItems = currentScreen?.items ?? [];
  const [desktopContextMenu, setDesktopContextMenu] = useState<DesktopContextMenuPosition | null>(
    null,
  );
  const [genieHiddenWindowIds, setGenieHiddenWindowIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const closeDesktopContextMenu = useCallback(() => {
    setDesktopContextMenu(null);
  }, []);

  const handleDesktopContextMenu = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    setDesktopContextMenu(resolveDesktopContextMenuPosition(event.clientX, event.clientY));
  }, []);

  const handleDesktopPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    playDesktopClickRipple({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    setDesktopContextMenu(null);
  }, [playDesktopClickRipple]);

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

    return Array.from(
      shellRoot.querySelectorAll<HTMLElement>('[data-kernelon-dock-target]'),
    ).find((element) => element.dataset.kernelonDockTarget === appId) ?? null;
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
        src={kernelOnDesktopWallpaper}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(255,255,255,0.20),transparent_34%),linear-gradient(180deg,rgba(4,19,12,0.02),rgba(4,19,12,0.08))]"
      />
      <KernelOnStatusBar
        onToggleSpotlight={toggleSpotlight}
        spotlightOpen={spotlightOpen}
      />
      <section
        aria-label="KernelOn desktop"
        className="relative min-h-screen"
        data-testid="kernelon-desktop-surface"
        onContextMenu={handleDesktopContextMenu}
        onPointerDown={handleDesktopPointerDown}
      >
        <DesktopClickRippleLayer layerRef={desktopClickRippleLayerRef} />
        {desktopItems.map((item) => (
          <DesktopItemMount item={item} key={item.id} runtime={runtime} widgets={widgets} />
        ))}
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
