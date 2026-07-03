'use client';

import {
  Suspense,
  createElement,
  lazy,
  useMemo,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';

import type { DesktopItem, KernelAppManifest, WidgetManifest } from '@kernelon/core';

import type { AppWindowSurfaceProps, ShellRuntimeRegistry, WidgetSurfaceProps } from '../runtime';
import { AppWindowContainer } from './app-window-container';

interface DesktopItemMountProps {
  item: DesktopItem;
  runtime: ShellRuntimeRegistry;
  widgets: WidgetManifest[];
}

export function DesktopItemMount({ item, runtime, widgets }: DesktopItemMountProps) {
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

export function AppWindowMount({
  app,
  genieHidden,
  onClose,
  onFocus,
  onMinimize,
  onResize,
  onToggleFullscreen,
  runtime,
  window,
}: Readonly<{
  app: KernelAppManifest;
  genieHidden?: boolean;
  onClose: AppWindowContainerAction;
  onFocus: AppWindowContainerAction;
  onMinimize: AppWindowContainerMinimizeAction;
  onResize: AppWindowContainerResizeAction;
  onToggleFullscreen: AppWindowContainerResizeAction;
  runtime: ShellRuntimeRegistry;
  window: AppWindowSurfaceProps['window'];
}>) {
  const AppWindowComponent = useAppWindowComponent(runtime, app.runtime.window.loaderKey);

  return (
    <AppWindowContainer
      app={app}
      genieHidden={genieHidden}
      onClose={onClose}
      onFocus={onFocus}
      onMinimize={onMinimize}
      onResize={onResize}
      onToggleFullscreen={onToggleFullscreen}
      window={window}
    >
      <Suspense fallback={null}>{createElement(AppWindowComponent, { app, window })}</Suspense>
    </AppWindowContainer>
  );
}

type AppWindowContainerAction = (windowId: string) => void;
type AppWindowContainerMinimizeAction = (
  windowId: string,
  sourceElement: HTMLElement | null,
) => void;
type AppWindowContainerResizeAction = (
  windowId: string,
  bounds: AppWindowSurfaceProps['window']['bounds'],
) => void;

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
