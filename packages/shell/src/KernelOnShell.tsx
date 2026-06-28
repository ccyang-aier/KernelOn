'use client';

import { Bell, LayoutGrid, Search, SlidersHorizontal } from 'lucide-react';
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
  type SVGProps,
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
import {
  kernelOnDesktopWallpaper,
  kernelOnStatusAvatar,
  resolveDockIconAsset,
} from './visual-assets';

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
  const launcherOpen = useShellSelector((state) => state.launcherOpen);
  const spotlightOpen = useShellSelector((state) => state.spotlightOpen);
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
      <KernelOnStatusBar
        launcherOpen={launcherOpen}
        onToggleLauncher={toggleLauncher}
        onToggleSpotlight={toggleSpotlight}
        spotlightOpen={spotlightOpen}
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

interface KernelOnStatusBarProps {
  launcherOpen: boolean;
  spotlightOpen: boolean;
  onToggleLauncher(): void;
  onToggleSpotlight(): void;
}

function KernelOnStatusBar({
  launcherOpen,
  spotlightOpen,
  onToggleLauncher,
  onToggleSpotlight,
}: KernelOnStatusBarProps) {
  return (
    <header
      aria-label="KernelOn status bar"
      className="pointer-events-none fixed top-[2px] right-0 z-30 w-full"
      data-testid="kernelon-status-bar"
      style={statusBarShellStyle}
    >
      <div
        className="pointer-events-auto absolute top-0 right-0 flex h-[38px] w-[320px] origin-top-right items-center justify-end gap-[18px] pr-[10px]"
        style={statusBarFrameStyle}
      >
        <StatusBarIconButton
          Icon={LayoutGrid}
          iconClassName="h-[21px] w-[21px]"
          label="Launchpad"
          onClick={onToggleLauncher}
          pressed={launcherOpen}
        />
        <StatusBarIconButton
          Icon={StatusSyncIcon}
          iconClassName="h-[24px] w-[25px]"
          iconVariant="material-symbols-light:cloud-done-outline-rounded"
          label="Sync status"
        />
        <StatusBarIconButton
          Icon={Search}
          iconClassName="h-[24px] w-[24px]"
          label="AI Spotlight"
          onClick={onToggleSpotlight}
          pressed={spotlightOpen}
        />
        <StatusBarIconButton
          Icon={Bell}
          badge={
            <span
              className="absolute top-[2px] right-[-2px] size-[7px] rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.96),0_1px_2px_rgba(64,112,131,0.22)]"
              data-testid="kernelon-notification-dot"
            />
          }
          iconClassName="h-[23px] w-[23px]"
          label="Notifications"
        />
        <StatusBarIconButton
          Icon={SlidersHorizontal}
          iconClassName="h-[24px] w-[24px]"
          label="Control Center"
        />
        <StatusBarProfileButton />
      </div>
    </header>
  );
}

type StatusIconProps = SVGProps<SVGSVGElement>;
type StatusBarIconComponent = ComponentType<StatusIconProps>;

interface StatusBarIconButtonProps {
  Icon: StatusBarIconComponent;
  label: string;
  iconClassName?: string;
  iconVariant?: string;
  badge?: ReactNode;
  pressed?: boolean;
  onClick?: () => void;
}

function StatusBarIconButton({
  Icon,
  label,
  iconClassName = 'h-[23px] w-[23px]',
  iconVariant,
  badge,
  pressed,
  onClick,
}: StatusBarIconButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={typeof pressed === 'boolean' ? pressed : undefined}
      className="relative flex h-[30px] w-[27px] shrink-0 items-center justify-center rounded-full text-white/95 outline-none transition duration-150 ease-out hover:scale-[1.025] focus-visible:ring-2 focus-visible:ring-white/80"
      data-icon-variant={iconVariant}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={iconClassName}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.38}
        style={statusGlyphStyle}
      />
      {badge}
    </button>
  );
}

function StatusSyncIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.344 14.875L8.56 13.091q-.147-.147-.345-.156t-.363.155q-.165.166-.165.357q0 .192.165.357l1.933 1.938q.242.243.565.243t.566-.243l4.032-4.032q.146-.146.156-.35t-.156-.37t-.36-.165t-.36.166zM6.5 19q-1.871 0-3.185-1.306Q2 16.39 2 14.517q0-1.719 1.175-3.051t2.921-1.431q.337-2.185 2.01-3.61T12 5q2.502 0 4.251 1.749T18 11v1h.616q1.436.046 2.41 1.055T22 15.5q0 1.471-1.014 2.486Q19.97 19 18.5 19zm0-1h12q1.05 0 1.775-.725T21 15.5t-.725-1.775T18.5 13H17v-2q0-2.075-1.463-3.538T12 6T8.463 7.463T7 11h-.5q-1.45 0-2.475 1.025T3 14.5t1.025 2.475T6.5 18m5.5-6" />
    </svg>
  );
}

function StatusBarProfileButton() {
  return (
    <button
      aria-label="KernelOn profile"
      className="relative flex size-[32px] shrink-0 items-center justify-center rounded-full outline-none transition duration-150 ease-out hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/80"
      title="KernelOn profile"
      type="button"
    >
      <span className="absolute inset-0 rounded-full bg-white/82 shadow-[0_0_5px_rgba(255,255,255,0.88),0_1px_3px_rgba(39,84,103,0.24)]" />
      <span className="relative block size-[28px] overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.74)]">
        <img
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          src={kernelOnStatusAvatar}
        />
      </span>
    </button>
  );
}

const statusBarShellStyle = {
  '--status-bar-scale': 'min(1, calc(100vw / 320px))',
  height: 'calc(38px * var(--status-bar-scale))',
} as CSSProperties;

const statusBarFrameStyle = {
  transform: 'scale(var(--status-bar-scale))',
} as CSSProperties;

const statusGlyphStyle = {
  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.74)) drop-shadow(0 2px 2px rgba(45,92,111,0.24))',
} as CSSProperties;

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
      className="fixed bottom-[clamp(12px,2.2vh,24px)] left-1/2 z-20 flex max-w-[calc(100vw-20px)] -translate-x-1/2 items-center gap-[var(--dock-gap)] overflow-x-auto rounded-[clamp(20px,2.2vw,32px)] border border-white/50 px-[var(--dock-pad-x)] py-[var(--dock-pad-y)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
      <div
        aria-hidden="true"
        className="mx-[1px] h-[calc(var(--dock-icon-size)*0.78)] w-px bg-white/55 shadow-[1px_0_0_rgba(18,35,18,0.20)]"
      />
      <DockIconButton assetKey="folder-stack" label="资源文件夹" />
      <DockIconButton assetKey="document" label="最近文档" />
      <DockIconButton assetKey="trash" label="废纸篓" />
    </nav>
  );
}

const dockStyle = {
  '--dock-gap': 'clamp(7px, 0.6vw, 11px)',
  '--dock-icon-size': 'clamp(32px, 3.7vw, 66px)',
  '--dock-pad-x': 'clamp(13px, 1vw, 18px)',
  '--dock-pad-y': 'clamp(7px, 0.75vw, 10px)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.36) 0%, rgba(221,232,214,0.22) 48%, rgba(141,162,121,0.22) 100%)',
  backdropFilter: 'blur(22px) saturate(150%)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,0.18), 0 18px 48px rgba(5,24,9,0.30), 0 3px 10px rgba(255,255,255,0.18)',
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
      className="group relative flex size-[var(--dock-icon-size)] shrink-0 items-center justify-center rounded-[clamp(12px,1.1vw,16px)] outline-none transition duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.05] focus-visible:ring-2 focus-visible:ring-white/80"
      onClick={onClick}
      title={label}
      type="button"
    >
      <img
        alt=""
        className="pointer-events-none h-full w-full select-none object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.24)] transition duration-200 ease-out group-hover:drop-shadow-[0_14px_16px_rgba(0,0,0,0.28)]"
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
