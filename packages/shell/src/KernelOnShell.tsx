'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useStore } from 'zustand';

import {
  KernelOnDesktopContextMenu,
  resolveDesktopContextMenuPosition,
  type DesktopContextMenuPosition,
} from './components/desktop-context-menu';
import { DesktopDock } from './components/desktop-dock';
import { AppWindowMount, DesktopItemMount } from './components/desktop-mounts';
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
  const desktopClickRippleIdRef = useRef(0);
  const apps = useShellSelector((state) => state.apps);
  const widgets = useShellSelector((state) => state.widgets);
  const currentScreenId = useShellSelector((state) => state.currentScreenId);
  const screens = useShellSelector((state) => state.screens);
  const windows = useShellSelector((state) => state.windows);
  const dockAppIds = useShellSelector((state) => state.dockAppIds);
  const launcherOpen = useShellSelector((state) => state.launcherOpen);
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
  const [desktopClickRipples, setDesktopClickRipples] = useState<DesktopClickRipple[]>([]);

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
    const nextRipple = {
      id: desktopClickRippleIdRef.current + 1,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    desktopClickRippleIdRef.current = nextRipple.id;
    setDesktopContextMenu(null);
    setDesktopClickRipples((ripples) => [...ripples.slice(-5), nextRipple]);
  }, []);

  const removeDesktopClickRipple = useCallback((rippleId: number) => {
    setDesktopClickRipples((ripples) => ripples.filter((ripple) => ripple.id !== rippleId));
  }, []);

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
        launcherOpen={launcherOpen}
        onToggleLauncher={toggleLauncher}
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
        <DesktopClickRippleLayer
          onRippleComplete={removeDesktopClickRipple}
          ripples={desktopClickRipples}
        />
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
                  onMinimize={minimizeWindow}
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
        onOpenApp={openApp}
        onToggleLauncher={toggleLauncher}
        onToggleSpotlight={toggleSpotlight}
      />
    </main>
  );
}

interface DesktopClickRipple {
  id: number;
  x: number;
  y: number;
}

function DesktopClickRippleLayer({
  onRippleComplete,
  ripples,
}: Readonly<{
  onRippleComplete(rippleId: number): void;
  ripples: DesktopClickRipple[];
}>) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[18] overflow-hidden"
      data-testid="kernelon-desktop-click-ripple-layer"
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            animate={{ opacity: [0.72, 0.58, 0.26, 0], scale: [0.04, 0.42, 0.86, 1.12] }}
            className="absolute block size-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
            data-testid="kernelon-desktop-click-ripple"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0.72, scale: 0.04 }}
            key={ripple.id}
            onAnimationComplete={() => onRippleComplete(ripple.id)}
            style={resolveDesktopClickRippleStyle(ripple)}
            transition={{
              duration: 1.08,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.24, 0.68, 1],
            }}
          >
            <span className="absolute inset-[30%] rounded-full border border-white/75 shadow-[0_0_22px_rgba(255,255,255,0.54)]" />
            <span className="absolute inset-[43%] rounded-full bg-white/46 blur-[1px]" />
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

function resolveDesktopClickRippleStyle(ripple: DesktopClickRipple): CSSProperties {
  return {
    background:
      'radial-gradient(circle, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.42) 12%, rgba(164,218,229,0.32) 30%, rgba(255,255,255,0) 66%)',
    boxShadow:
      '0 0 0 1px rgba(255,255,255,0.62), inset 0 0 28px rgba(255,255,255,0.42), 0 0 42px rgba(151,208,221,0.36)',
    left: ripple.x,
    top: ripple.y,
  };
}
