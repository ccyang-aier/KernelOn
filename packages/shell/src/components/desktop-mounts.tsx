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
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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
import { AppWindowContainer } from './app-window-container';
import { resolveDesktopGridAreaStyle, snapPointerToDesktopGrid } from './desktop-grid';

interface DesktopItemMountProps {
  item: DesktopItem;
  onDragStateChange?(itemId: string | null): void;
  onMoveItem?(itemId: string, grid: DesktopItem['grid']): void;
  onRemoveItem?(itemId: string): void;
  runtime: ShellRuntimeRegistry;
  widgets: WidgetManifest[];
}

export function DesktopItemMount({
  item,
  onDragStateChange,
  onMoveItem,
  onRemoveItem,
  runtime,
  widgets,
}: DesktopItemMountProps) {
  if (item.kind === 'widget') {
    const widget = widgets.find((candidate) => candidate.id === item.targetId);

    return widget ? (
      <WidgetMount
        item={item}
        onDragStateChange={onDragStateChange}
        onMoveItem={onMoveItem}
        onRemoveItem={onRemoveItem}
        runtime={runtime}
        widget={widget}
      />
    ) : null;
  }

  return null;
}

function WidgetMount({
  item,
  onDragStateChange,
  onMoveItem,
  onRemoveItem,
  runtime,
  widget,
}: Readonly<{
  item: DesktopItem;
  onDragStateChange?(itemId: string | null): void;
  onMoveItem?(itemId: string, grid: DesktopItem['grid']): void;
  onRemoveItem?(itemId: string): void;
  runtime: ShellRuntimeRegistry;
  widget: WidgetManifest;
}>) {
  const WidgetComponent = useWidgetComponent(runtime, widget.runtime.widget.loaderKey);
  const gridStyle = resolveDesktopGridAreaStyle(item.grid);
  const width = Number(gridStyle.width);
  const height = Number(gridStyle.height);
  const initialLeft = Number(gridStyle.left);
  const initialTop = Number(gridStyle.top);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snapGrid, setSnapGrid] = useState(item.grid);
  const dragStartRef = useRef({
    elementX: initialLeft,
    elementY: initialTop,
    pointerX: 0,
    pointerY: 0,
  });

  const finishDragging = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, commitMove: boolean) => {
      if (!isDragging) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      onDragStateChange?.(null);

      if (commitMove) {
        onMoveItem?.(item.id, snapGrid);
      }
    },
    [isDragging, item.id, onDragStateChange, onMoveItem, snapGrid],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || isInteractiveWidgetTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStartRef.current = {
        elementX: initialLeft,
        elementY: initialTop,
        pointerX: event.clientX,
        pointerY: event.clientY,
      };
      setSnapGrid(item.grid);
      setIsDragging(true);
      onDragStateChange?.(item.id);
    },
    [initialLeft, initialTop, item.grid, item.id, onDragStateChange],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }

      const dx = event.clientX - dragStartRef.current.pointerX;
      const dy = event.clientY - dragStartRef.current.pointerY;
      const nextLeft = dragStartRef.current.elementX + dx;
      const nextTop = dragStartRef.current.elementY + dy;
      const bounds = event.currentTarget.parentElement?.getBoundingClientRect();

      setDragOffset({ x: dx, y: dy });
      setSnapGrid(
        snapPointerToDesktopGrid({
          bounds: bounds ? { height: bounds.height, width: bounds.width } : undefined,
          pointer: { x: nextLeft + width / 2, y: nextTop + height / 2 },
          size: item.grid,
        }),
      );
    },
    [height, isDragging, item.grid, width],
  );

  const currentLeft = initialLeft + dragOffset.x;
  const currentTop = initialTop + dragOffset.y;
  const snapStyle = resolveDesktopGridAreaStyle(snapGrid);

  return (
    <>
      <AnimatePresence>
        {isDragging ? (
          <motion.div
            animate={{ opacity: 0.34, scale: 1 }}
            className="pointer-events-none absolute z-10 rounded-[24px] border-2 border-dashed border-white/90 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, scale: 0.95 }}
            style={snapStyle}
          />
        ) : null}
      </AnimatePresence>
      <motion.div
        animate={{
          boxShadow: isDragging
            ? '0 24px 48px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)'
            : '0 8px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.2)',
          left: currentLeft,
          opacity: 1,
          scale: isDragging ? 1.03 : 1,
          top: currentTop,
          zIndex: isDragging ? 50 : 20,
        }}
        className="group absolute cursor-grab select-none rounded-[24px] active:cursor-grabbing"
        data-testid={`kernelon-desktop-widget-${item.id}`}
        initial={{ left: currentLeft, opacity: 0, scale: 0.9, top: currentTop }}
        onPointerCancel={(event) => finishDragging(event, false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishDragging(event, true)}
        style={{ height, width }}
        transition={isDragging ? { duration: 0 } : { damping: 25, stiffness: 220, type: 'spring' }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[24px] border border-white/55 bg-white/44 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-[16px] saturate-[140%]" />
        <div className="relative h-full w-full overflow-hidden rounded-[24px] p-4">
          <Suspense fallback={null}>{createElement(WidgetComponent, { item, widget })}</Suspense>
        </div>
        <button
          aria-label={`移除${widget.name}`}
          className="absolute -right-2 -top-2 z-30 flex size-6 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black/48 text-white opacity-0 shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-all duration-200 hover:scale-110 hover:bg-black/64 group-hover:opacity-100"
          data-widget-delete-btn
          onClick={() => onRemoveItem?.(item.id)}
          title="移除小组件"
          type="button"
        >
          <X className="size-3.5" />
        </button>
      </motion.div>
    </>
  );
}

function isInteractiveWidgetTarget(target: EventTarget): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'button, input, select, textarea, a, [role="button"], [data-widget-delete-btn], [data-widget-interactive]',
      ),
    )
  );
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
  const frameOwner = app.runtime.window.frameOwner ?? 'container';
  const isTopLayerWindow = (app.runtime.window.layer ?? 'workspace') === 'top';
  const suspendsWholeWindow = frameOwner === 'app' || isTopLayerWindow;

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

  const windowSurface = (
    <AppWindowContainer
      app={app}
      frameOwner={frameOwner}
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
        {suspendsWholeWindow ? (
          createElement(AppWindowComponent, { app, window })
        ) : (
          <Suspense fallback={null}>{createElement(AppWindowComponent, { app, window })}</Suspense>
        )}
      </AppHeaderContext.Provider>
    </AppWindowContainer>
  );

  return suspendsWholeWindow ? <Suspense fallback={null}>{windowSurface}</Suspense> : windowSurface;
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
