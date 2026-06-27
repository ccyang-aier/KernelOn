'use client';

import {
  Suspense,
  createContext,
  createElement,
  lazy,
  useContext,
  useMemo,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import { motion } from 'motion/react';
import { AppWindow, Command, Grid3X3, Search, Wifi } from 'lucide-react';
import { useStore } from 'zustand';

import { Button, IconButton, Surface, WindowFrame } from '@kernelon/ui';
import type {
  DesktopItem,
  KernelAppManifest,
  WidgetManifest,
  WindowDescriptor,
} from '@kernelon/core';

import { AppIcon } from './app-icons';
import type { AppWindowSurfaceProps, ShellRuntimeRegistry, WidgetSurfaceProps } from './runtime';
import {
  createShellStore,
  type ShellInitialState,
  type ShellState,
  type ShellStore,
} from './shell-store';

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
  const dockAppIds = useShellSelector((state) => state.dockAppIds);
  const windows = useShellSelector((state) => state.windows);
  const launcherOpen = useShellSelector((state) => state.launcherOpen);
  const spotlightOpen = useShellSelector((state) => state.spotlightOpen);
  const commands = useShellSelector((state) => state.commands);
  const screens = useShellSelector((state) => state.screens);
  const openApp = useShellSelector((state) => state.openApp);
  const focusWindow = useShellSelector((state) => state.focusWindow);
  const closeWindow = useShellSelector((state) => state.closeWindow);
  const toggleLauncher = useShellSelector((state) => state.toggleLauncher);
  const toggleSpotlight = useShellSelector((state) => state.toggleSpotlight);
  const dockApps = apps.filter((app) => dockAppIds.includes(app.id));
  const currentScreen = screens.find((screen) => screen.id === currentScreenId) ?? screens[0];
  const desktopItems = currentScreen?.items ?? [];

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--ko-bg)] text-[var(--ko-ink)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[var(--ko-border)] bg-white/78 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-[var(--ko-ink)] text-sm font-semibold text-white">
              KO
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">KernelOn</h1>
              <p className="mt-1 text-xs text-[var(--ko-muted)]">Desktop Shell</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button size="sm" variant="ghost" onClick={toggleSpotlight}>
              <Search className="mr-2 size-4" />
              AI Spotlight
            </Button>
            <div className="flex items-center gap-2 rounded-md border border-[var(--ko-border)] bg-white/70 px-3 py-1.5 text-xs text-[var(--ko-muted)]">
              <Wifi className="size-3.5 text-[var(--ko-accent)]" />
              Next-first
            </div>
          </div>
        </header>

        <section className="relative flex flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(20,31,48,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(20,31,48,0.045)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative z-10 grid flex-1 grid-rows-[1fr_auto] p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <Surface className="rounded-lg p-5" tone="glass">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ko-muted)]">
                      Workspace
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">新员工运作工作台</h2>
                  </div>
                  <Button variant="primary" onClick={toggleLauncher}>
                    <Grid3X3 className="mr-2 size-4" />
                    启动台
                  </Button>
                </div>

                <div className="grid auto-rows-[112px] grid-cols-4 gap-3 xl:grid-cols-6">
                  {desktopItems.map((item) => (
                    <DesktopItemSurface
                      apps={apps}
                      item={item}
                      key={item.id}
                      runtime={runtime}
                      widgets={widgets}
                      onOpenApp={openApp}
                    />
                  ))}
                </div>
              </Surface>

              <Surface className="rounded-lg p-5" tone="glass">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-[var(--ko-warning-soft)] text-[var(--ko-warning)]">
                    <Command className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Core Services</h2>
                    <p className="mt-1 text-xs text-[var(--ko-muted)]">
                      Window Manager / Desktop Layout / Command Model
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ['窗口状态', `${windows.length} active model item(s)`],
                    [
                      '桌面屏幕',
                      `${screens.length} screen(s), ${desktopItems.length} rendered item(s)`,
                    ],
                    ['命令中心', `${commands.length} command(s) indexed`],
                  ].map(([label, value]) => (
                    <div
                      className="rounded-md border border-[var(--ko-border)] bg-white/70 px-4 py-3"
                      key={label}
                    >
                      <div className="text-xs text-[var(--ko-muted)]">{label}</div>
                      <div className="mt-1 text-sm font-medium text-[var(--ko-ink)]">{value}</div>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>

            <nav className="mx-auto mt-5 flex max-w-full items-center gap-2 rounded-lg border border-[var(--ko-border)] bg-white/82 p-2 shadow-[0_20px_60px_rgba(17,24,39,0.08)] backdrop-blur-xl">
              <IconButton aria-label="打开启动台" selected={launcherOpen} onClick={toggleLauncher}>
                <Grid3X3 className="size-5" />
              </IconButton>
              {dockApps.map((app) => (
                <IconButton
                  aria-label={`打开${app.name}`}
                  key={app.id}
                  onClick={() => openApp(app.id)}
                >
                  <AppIcon className="size-5" name={app.icon} />
                </IconButton>
              ))}
            </nav>
          </div>

          {launcherOpen ? (
            <Surface
              className="absolute bottom-24 left-1/2 z-30 grid w-[min(720px,calc(100vw-32px))] -translate-x-1/2 gap-3 rounded-lg p-4 sm:grid-cols-2 md:grid-cols-3"
              tone="glass"
            >
              {apps.map((app) => (
                <Button className="justify-start" key={app.id} onClick={() => openApp(app.id)}>
                  {app.name}
                </Button>
              ))}
            </Surface>
          ) : null}

          {spotlightOpen ? (
            <Surface
              className="absolute left-1/2 top-20 z-30 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 rounded-lg p-4"
              tone="glass"
            >
              <div className="flex items-center gap-3 rounded-md border border-[var(--ko-border)] bg-white px-4 py-3">
                <Search className="size-5 text-[var(--ko-muted)]" />
                <span className="text-sm text-[var(--ko-muted)]">
                  搜索 App，或输入“匹配导师张三和新人李四”
                </span>
              </div>
            </Surface>
          ) : null}

          {windows.map((window) => {
            const app = apps.find((item) => item.id === window.appId);

            return (
              <FloatingAppWindow
                app={app}
                closeWindow={closeWindow}
                focusWindow={focusWindow}
                key={window.id}
                runtime={runtime}
                window={window}
              />
            );
          })}
        </section>
      </div>
    </main>
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

interface DesktopItemSurfaceProps {
  apps: KernelAppManifest[];
  item: DesktopItem;
  runtime: ShellRuntimeRegistry;
  widgets: WidgetManifest[];
  onOpenApp(appId: string): void;
}

function DesktopItemSurface({ apps, item, runtime, widgets, onOpenApp }: DesktopItemSurfaceProps) {
  const style = {
    gridColumn: `span ${item.grid.width}`,
    gridRow: `span ${item.grid.height}`,
  };

  if (item.kind === 'app') {
    const app = apps.find((candidate) => candidate.id === item.targetId);

    if (!app) {
      return <MissingDesktopItem label="应用不存在" style={style} />;
    }

    return <DesktopAppItemSurface app={app} onOpenApp={onOpenApp} style={style} />;
  }

  const widget = widgets.find((candidate) => candidate.id === item.targetId);

  if (!widget) {
    return <MissingDesktopItem label="小组件不存在" style={style} />;
  }

  return <DesktopWidgetItemSurface item={item} runtime={runtime} style={style} widget={widget} />;
}

function DesktopAppItemSurface({
  app,
  onOpenApp,
  style,
}: Readonly<{
  app: KernelAppManifest;
  onOpenApp(appId: string): void;
  style: { gridColumn: string; gridRow: string };
}>) {
  return (
    <motion.button
      className="group flex h-full flex-col items-start rounded-lg border border-[var(--ko-border)] bg-white/78 p-4 text-left shadow-[0_12px_32px_rgba(17,24,39,0.06)] transition hover:border-[var(--ko-accent)] hover:bg-white"
      style={style}
      type="button"
      whileHover={{ y: -2 }}
      onClick={() => onOpenApp(app.id)}
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-[var(--ko-accent-soft)] text-[var(--ko-accent)]">
        <AppIcon className="size-5" name={app.icon} />
      </div>
      <div className="text-sm font-semibold text-[var(--ko-ink)]">{app.name}</div>
      <p className="mt-1 text-xs leading-5 text-[var(--ko-muted)]">{app.description}</p>
    </motion.button>
  );
}

function DesktopWidgetItemSurface({
  item,
  runtime,
  style,
  widget,
}: Readonly<{
  item: DesktopItem;
  runtime: ShellRuntimeRegistry;
  style: { gridColumn: string; gridRow: string };
  widget: WidgetManifest;
}>) {
  const WidgetComponent = useWidgetComponent(runtime, widget.runtime.widget.loaderKey);

  return (
    <Surface className="h-full overflow-hidden rounded-lg p-4" style={style} tone="glass">
      <Suspense fallback={<RuntimeFallback label="正在加载小组件" />}>
        {createElement(WidgetComponent, { item, widget })}
      </Suspense>
    </Surface>
  );
}

function FloatingAppWindow({
  app,
  closeWindow,
  focusWindow,
  runtime,
  window,
}: Readonly<{
  app: KernelAppManifest | undefined;
  closeWindow(windowId: string): void;
  focusWindow(windowId: string): void;
  runtime: ShellRuntimeRegistry;
  window: WindowDescriptor;
}>) {
  const loaderKey = app?.runtime.window.loaderKey ?? '__missing_app_window__';
  const AppWindowComponent = useAppWindowComponent(runtime, loaderKey);

  return (
    <div
      className="absolute z-20 w-[min(520px,calc(100vw-40px))]"
      style={{
        left: Math.min(window.bounds.x, 280),
        top: Math.min(window.bounds.y, 160),
        zIndex: window.zIndex + 20,
      }}
      onMouseDown={() => focusWindow(window.id)}
    >
      <WindowFrame
        actions={
          <Button size="sm" variant="ghost" onClick={() => closeWindow(window.id)}>
            关闭
          </Button>
        }
        title={window.title}
      >
        {app ? (
          <Suspense fallback={<RuntimeFallback label="正在加载应用" />}>
            {createElement(AppWindowComponent, { app, window })}
          </Suspense>
        ) : (
          <MissingRuntimeSurface label="应用未注册" />
        )}
      </WindowFrame>
    </div>
  );
}

function RuntimeFallback({ label }: Readonly<{ label: string }>) {
  return <div className="text-xs text-[var(--ko-muted)]">{label}</div>;
}

function MissingRuntimeSurface({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--ko-accent-soft)] text-[var(--ko-accent)]">
        <AppWindow className="size-5" />
      </div>
      <p className="text-xs leading-5 text-[var(--ko-muted)]">{label}</p>
    </div>
  );
}

function MissingDesktopItem({
  label,
  style,
}: Readonly<{ label: string; style: { gridColumn: string; gridRow: string } }>) {
  return (
    <div
      className="grid h-full place-items-center rounded-lg border border-dashed border-[var(--ko-border)] bg-white/45 text-xs text-[var(--ko-muted)]"
      style={style}
    >
      {label}
    </div>
  );
}
