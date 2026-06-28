'use client';

import {
  Suspense,
  createContext,
  createElement,
  lazy,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import { useStore } from 'zustand';

import type { DesktopItem, KernelAppManifest, WidgetManifest } from '@kernelon/core';

import type { AppWindowSurfaceProps, ShellRuntimeRegistry, WidgetSurfaceProps } from './runtime';
import {
  createShellStore,
  type ShellInitialState,
  type ShellState,
  type ShellStore,
} from './shell-store';
import { kernelOnDesktopWallpaper, resolveDockIconAsset } from './visual-assets';

export interface KernelOnShellProps {
  initialState: ShellInitialState;
  runtime: ShellRuntimeRegistry;
}

const ShellStoreContext = createContext<ShellStore | null>(null);

function ShellStoreProvider({
  children,
  initialState,
}: Readonly<{ children: ReactNode; initialState: ShellInitialState }>) {
  const [store] = useState(() => createShellStore(initialState));

  return <ShellStoreContext.Provider value={store}>{children}</ShellStoreContext.Provider>;
}

function useShellSelector<T>(selector: (state: ShellState) => T): T {
  const store = useContext(ShellStoreContext);

  if (!store) {
    throw new Error('useShellSelector must be used inside KernelOnShell.');
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
  const apps = useShellSelector((state) => state.apps);
  const widgets = useShellSelector((state) => state.widgets);
  const currentScreenId = useShellSelector((state) => state.currentScreenId);
  const screens = useShellSelector((state) => state.screens);
  const windows = useShellSelector((state) => state.windows);
  const dockAppIds = useShellSelector((state) => state.dockAppIds);
  const openApp = useShellSelector((state) => state.openApp);
  const toggleLauncher = useShellSelector((state) => state.toggleLauncher);
  const toggleSpotlight = useShellSelector((state) => state.toggleSpotlight);
  const currentScreen = screens.find((screen) => screen.id === currentScreenId) ?? screens[0];
  const desktopItems = currentScreen?.items ?? [];

  return (
    <main
      aria-label="KernelOn shell"
      className="relative min-h-screen overflow-hidden bg-[var(--ko-bg)] text-[var(--ko-ink)]"
      data-testid="kernelon-shell"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${kernelOnDesktopWallpaper})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(255,255,255,0.20),transparent_34%),linear-gradient(180deg,rgba(4,19,12,0.02),rgba(4,19,12,0.08))]"
      />
      <div className="relative z-10 min-h-screen">
        {desktopItems.map((item) => (
          <DesktopItemMount item={item} key={item.id} runtime={runtime} widgets={widgets} />
        ))}
        {windows.map((window) => {
          const app = apps.find((item) => item.id === window.appId);

          return app ? (
            <AppWindowMount app={app} key={window.id} runtime={runtime} window={window} />
          ) : null;
        })}
      </div>
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

interface DesktopDockProps {
  apps: KernelAppManifest[];
  dockAppIds: string[];
  onOpenApp(appId: string): void;
  onToggleLauncher(): void;
  onToggleSpotlight(): void;
}

function DesktopDock({
  apps,
  dockAppIds,
  onOpenApp,
  onToggleLauncher,
  onToggleSpotlight,
}: DesktopDockProps) {
  const dockApps = dockAppIds
    .map((appId) => apps.find((app) => app.id === appId))
    .filter((app): app is KernelAppManifest => Boolean(app));

  return (
    <nav
      aria-label="KernelOn Dock"
      className="fixed bottom-[clamp(24px,5vh,56px)] left-1/2 z-20 flex max-w-[calc(100vw-20px)] -translate-x-1/2 items-center gap-[var(--dock-gap)] overflow-x-auto rounded-[clamp(34px,4.2vw,58px)] border border-white/45 px-[var(--dock-pad-x)] py-[var(--dock-pad-y)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="kernelon-dock"
      style={dockStyle}
    >
      <DockIconButton assetKey="launchpad" label="启动台" onClick={onToggleLauncher} />
      {dockApps.map((app) => (
        <DockIconButton
          assetKey={app.id}
          key={app.id}
          label={app.name}
          onClick={() => onOpenApp(app.id)}
        />
      ))}
      <DockIconButton assetKey="ai-spotlight" label="AI Spotlight" onClick={onToggleSpotlight} />
      <div aria-hidden="true" className="mx-[2px] h-[calc(var(--dock-icon-size)*0.86)] w-px bg-white/55 shadow-[1px_0_0_rgba(18,35,18,0.20)]" />
      <DockIconButton assetKey="folder-stack" label="资源文件夹" />
      <DockIconButton assetKey="document" label="最近文档" />
      <DockIconButton assetKey="trash" label="废纸篓" />
    </nav>
  );
}

const dockStyle = {
  '--dock-gap': 'clamp(8px, 1.2vw, 20px)',
  '--dock-icon-size': 'clamp(40px, 6.55vw, 110px)',
  '--dock-pad-x': 'clamp(18px, 2.15vw, 36px)',
  '--dock-pad-y': 'clamp(16px, 1.65vw, 28px)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.36) 0%, rgba(221,232,214,0.22) 48%, rgba(141,162,121,0.22) 100%)',
  backdropFilter: 'blur(22px) saturate(150%)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(49,68,38,0.28), 0 22px 60px rgba(5,24,9,0.34), 0 4px 12px rgba(255,255,255,0.22)',
} as CSSProperties;

interface DockIconButtonProps {
  assetKey: string;
  label: string;
  onClick?: () => void;
}

function DockIconButton({ assetKey, label, onClick }: DockIconButtonProps) {
  return (
    <button
      aria-label={label}
      className="group relative flex size-[var(--dock-icon-size)] shrink-0 items-center justify-center rounded-[24px] outline-none transition duration-200 ease-out hover:-translate-y-3 hover:scale-[1.08] focus-visible:ring-2 focus-visible:ring-white/80"
      onClick={onClick}
      title={label}
      type="button"
    >
      <img
        alt=""
        className="pointer-events-none h-full w-full select-none object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.26)] transition duration-200 ease-out group-hover:drop-shadow-[0_20px_22px_rgba(0,0,0,0.30)]"
        draggable={false}
        src={resolveDockIconAsset(assetKey)}
      />
    </button>
  );
}

function useAppWindowComponent(
  runtime: ShellRuntimeRegistry,
  loaderKey: string,
): LazyExoticComponent<ComponentType<AppWindowSurfaceProps>> {
  return useMemo(() => lazy(() => runtime.loadAppWindow(loaderKey)), [loaderKey, runtime]);
}

function useWidgetComponent(
  runtime: ShellRuntimeRegistry,
  loaderKey: string,
): LazyExoticComponent<ComponentType<WidgetSurfaceProps>> {
  return useMemo(() => lazy(() => runtime.loadWidget(loaderKey)), [loaderKey, runtime]);
}

interface DesktopItemMountProps {
  item: DesktopItem;
  runtime: ShellRuntimeRegistry;
  widgets: WidgetManifest[];
}

function DesktopItemMount({ item, runtime, widgets }: DesktopItemMountProps) {
  if (item.kind === 'widget') {
    const widget = widgets.find((candidate) => candidate.id === item.targetId);

    return widget ? <WidgetMount item={item} runtime={runtime} widget={widget} /> : null;
  }

  return null;
}

function WidgetMount({
  item,
  runtime,
  widget,
}: Readonly<{
  item: DesktopItem;
  runtime: ShellRuntimeRegistry;
  widget: WidgetManifest;
}>) {
  const WidgetComponent = useWidgetComponent(runtime, widget.runtime.widget.loaderKey);

  return <Suspense fallback={null}>{createElement(WidgetComponent, { item, widget })}</Suspense>;
}

function AppWindowMount({
  app,
  runtime,
  window,
}: Readonly<{
  app: KernelAppManifest;
  runtime: ShellRuntimeRegistry;
  window: AppWindowSurfaceProps['window'];
}>) {
  const AppWindowComponent = useAppWindowComponent(runtime, app.runtime.window.loaderKey);

  return <Suspense fallback={null}>{createElement(AppWindowComponent, { app, window })}</Suspense>;
}
