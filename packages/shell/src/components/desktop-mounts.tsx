'use client';

import {
  Suspense,
  createElement,
  lazy,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';

import type {
  AppHeaderDescriptor,
  DesktopItem,
  KernelAppManifest,
  WidgetManifest,
} from '@kernelon/core';

import {
  AppHeaderContext,
  type AppHeaderCommandHandler,
  type AppHeaderCommandPayload,
} from '../app-header';
import type { AppWindowSurfaceProps, ShellRuntimeRegistry, WidgetSurfaceProps } from '../runtime';
import { kernelOnDesktopWallpaper } from '../visual-assets';
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
  const commandHandlersRef = useRef<Map<string, AppHeaderCommandHandler>>(new Map());
  const [runtimeHeader, setRuntimeHeader] = useState<AppHeaderDescriptor | undefined>();
  const [headerSlots, setHeaderSlots] = useState<Record<string, ReactNode>>({});
  const effectiveHeader = runtimeHeader ?? window.header ?? app.defaultWindow.header;
  const isTopLayerWindow = app.id === 'wallpaper';
  const appFallback = isTopLayerWindow ? <WallpaperWindowFallback /> : null;

  const clearHeader = useCallback(() => {
    setRuntimeHeader(undefined);
  }, []);

  const setSlot = useCallback((slotId: string, children: ReactNode) => {
    setHeaderSlots((currentSlots) => ({
      ...currentSlots,
      [slotId]: children,
    }));
  }, []);

  const clearSlot = useCallback((slotId: string) => {
    setHeaderSlots((currentSlots) => {
      if (!(slotId in currentSlots)) {
        return currentSlots;
      }

      const nextSlots = { ...currentSlots };

      delete nextSlots[slotId];

      return nextSlots;
    });
  }, []);

  const registerCommand = useCallback((commandId: string, handler: AppHeaderCommandHandler) => {
    commandHandlersRef.current.set(commandId, handler);

    return () => {
      if (commandHandlersRef.current.get(commandId) === handler) {
        commandHandlersRef.current.delete(commandId);
      }
    };
  }, []);

  const handleHeaderCommand = useCallback((payload: AppHeaderCommandPayload) => {
    commandHandlersRef.current.get(payload.commandId)?.(payload);
  }, []);

  const headerController = useMemo(
    () => ({
      clearHeader,
      clearSlot,
      registerCommand,
      setHeader: setRuntimeHeader,
      setSlot,
      windowId: window.id,
    }),
    [clearHeader, clearSlot, registerCommand, setSlot, window.id],
  );

  return (
    <AppWindowContainer
      app={app}
      genieHidden={genieHidden}
      header={effectiveHeader}
      headerSlots={headerSlots}
      onClose={onClose}
      onFocus={onFocus}
      onHeaderCommand={handleHeaderCommand}
      onMinimize={onMinimize}
      onResize={onResize}
      onToggleFullscreen={onToggleFullscreen}
      topLayer={isTopLayerWindow}
      window={window}
    >
      <AppHeaderContext.Provider value={headerController}>
        <Suspense fallback={appFallback}>
          {createElement(AppWindowComponent, { app, window })}
        </Suspense>
      </AppHeaderContext.Provider>
    </AppWindowContainer>
  );
}

function WallpaperWindowFallback() {
  return (
    <div
      className="relative h-full overflow-hidden bg-[#07090c]"
      data-testid="kernelon-wallpaper-window-fallback"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-70 blur-3xl"
        style={{ backgroundImage: `url(${kernelOnDesktopWallpaper})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_78%_86%,rgba(90,180,205,0.18),transparent_36%),linear-gradient(180deg,rgba(7,10,14,0.60),rgba(2,4,7,0.84))]"
      />
    </div>
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
