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
import { useStore } from 'zustand';

import type { DesktopItem, KernelAppManifest, WidgetManifest } from '@kernelon/core';

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
  const screens = useShellSelector((state) => state.screens);
  const windows = useShellSelector((state) => state.windows);
  const currentScreen = screens.find((screen) => screen.id === currentScreenId) ?? screens[0];
  const desktopItems = currentScreen?.items ?? [];

  return (
    <main
      aria-label="KernelOn shell"
      className="min-h-screen bg-[var(--ko-bg)] text-[var(--ko-ink)]"
      data-testid="kernelon-shell"
    >
      {desktopItems.map((item) => (
        <DesktopItemMount item={item} key={item.id} runtime={runtime} widgets={widgets} />
      ))}
      {windows.map((window) => {
        const app = apps.find((item) => item.id === window.appId);

        return app ? (
          <AppWindowMount app={app} key={window.id} runtime={runtime} window={window} />
        ) : null;
      })}
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
