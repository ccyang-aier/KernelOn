'use client';

import { motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import type {
  AppHeaderDescriptor,
  AppFrameOwner,
  KernelAppManifest,
  WindowBounds,
  WindowDescriptor,
} from '@kernelon/core';
import { cn } from '@kernelon/ui';

import type { AppHeaderCommandPayload } from '../app-header';
import { AppFrame } from '../app-frame';
import { AppFrameWindowContext, type AppFrameWindowContextValue } from './app-frame-context';

const MIN_WINDOW_WIDTH = 520;
const MIN_WINDOW_HEIGHT = 360;
const DESKTOP_MARGIN = 12;
const STATUS_BAR_CLEARANCE = 46;
const DOCK_SAFE_AREA_CLEARANCE = 88;
const WINDOW_CHROME_RADIUS = 26;
const FULLSCREEN_CHROME_RADIUS = 0;
const WINDOW_BOUNDS_TRANSITION_MS = 320;
const HYDRATION_VIEWPORT_SIZE = {
  height: 900,
  width: 1440,
};

type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
type WindowVisualMode = NonNullable<WindowDescriptor['mode']>;

interface WindowVisualFrame {
  bounds: WindowBounds;
  mode: WindowVisualMode;
}

interface WindowVisualFrameInput {
  bounds: WindowBounds;
  constrainToWorkspace?: boolean;
  mode?: WindowDescriptor['mode'];
  reserveDockArea?: boolean;
}

interface ViewportSize {
  height: number;
  width: number;
}

interface WindowInteractionState {
  kind: 'move' | 'resize';
  direction?: ResizeDirection;
  startBounds: WindowBounds;
  startPointer: {
    x: number;
    y: number;
  };
}

export interface AppWindowContainerProps {
  app: KernelAppManifest;
  window: WindowDescriptor;
  children: ReactNode;
  constrainToWorkspace?: boolean;
  genieHidden?: boolean;
  frameOwner?: AppFrameOwner;
  header?: AppHeaderDescriptor;
  headerSlots?: Readonly<Record<string, ReactNode>>;
  onClose(windowId: string): void;
  onFocus(windowId: string): void;
  onHeaderCommand?(payload: AppHeaderCommandPayload): void;
  onMinimize(windowId: string, sourceElement: HTMLElement | null): void;
  onResize(windowId: string, bounds: WindowBounds): void;
  onToggleFullscreen(windowId: string, bounds: WindowBounds): void;
  topLayer?: boolean;
}

export function AppWindowContainer({
  app,
  children,
  constrainToWorkspace = true,
  genieHidden = false,
  frameOwner = 'container',
  header,
  headerSlots,
  onClose,
  onFocus,
  onHeaderCommand,
  onMinimize,
  onResize,
  onToggleFullscreen,
  topLayer = false,
  window: descriptor,
}: AppWindowContainerProps) {
  const interactionRef = useRef<WindowInteractionState | null>(null);
  const frameRef = useRef<HTMLElement | null>(null);
  const isTopLayer = topLayer;
  const previousFrameRef = useRef<WindowVisualFrame>(
    resolveWindowVisualFrame(
      { ...descriptor, constrainToWorkspace, reserveDockArea: !isTopLayer },
      HYDRATION_VIEWPORT_SIZE,
    ),
  );
  const [visualFrame, setVisualFrame] = useState<WindowVisualFrame>(() =>
    resolveWindowVisualFrame(
      { ...descriptor, constrainToWorkspace, reserveDockArea: !isTopLayer },
      HYDRATION_VIEWPORT_SIZE,
    ),
  );
  const [isFrameTransitioning, setIsFrameTransitioning] = useState(false);
  const {
    height: descriptorHeight,
    width: descriptorWidth,
    x: descriptorX,
    y: descriptorY,
  } = descriptor.bounds;
  const descriptorMode = descriptor.mode;
  const isFullscreen = descriptor.mode === 'fullscreen';

  useEffect(() => {
    const nextFrame = resolveWindowVisualFrame({
      bounds: {
        height: descriptorHeight,
        width: descriptorWidth,
        x: descriptorX,
        y: descriptorY,
      },
      constrainToWorkspace,
      mode: descriptorMode,
      reserveDockArea: !isTopLayer,
    });
    const previousFrame = previousFrameRef.current;
    const modeChanged = previousFrame.mode !== nextFrame.mode;

    previousFrameRef.current = nextFrame;

    if (!modeChanged) {
      setIsFrameTransitioning(false);
      setVisualFrame(nextFrame);
      return undefined;
    }

    setIsFrameTransitioning(true);
    const animationFrame = requestAnimationFrame(() => {
      setVisualFrame(nextFrame);
    });
    const transitionTimer = window.setTimeout(() => {
      setIsFrameTransitioning(false);
    }, WINDOW_BOUNDS_TRANSITION_MS + 80);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(transitionTimer);
    };
  }, [
    descriptorHeight,
    descriptorMode,
    descriptorWidth,
    descriptorX,
    descriptorY,
    constrainToWorkspace,
    isTopLayer,
  ]);

  useEffect(() => {
    if (!globalThis.window) {
      return undefined;
    }

    const syncWindowFrameToViewport = () => {
      const nextFrame = resolveWindowVisualFrame({
        bounds: {
          height: descriptorHeight,
          width: descriptorWidth,
          x: descriptorX,
          y: descriptorY,
        },
        constrainToWorkspace,
        mode: descriptorMode,
        reserveDockArea: !isTopLayer,
      });

      previousFrameRef.current = nextFrame;
      setVisualFrame(nextFrame);
    };

    syncWindowFrameToViewport();
    globalThis.window.addEventListener('resize', syncWindowFrameToViewport);

    return () => {
      globalThis.window.removeEventListener('resize', syncWindowFrameToViewport);
    };
  }, [
    descriptorHeight,
    descriptorMode,
    descriptorWidth,
    descriptorX,
    descriptorY,
    constrainToWorkspace,
    isTopLayer,
  ]);

  const beginMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || isFullscreen) {
        return;
      }

      onFocus(descriptor.id);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = {
        kind: 'move',
        startBounds: descriptor.bounds,
        startPointer: { x: event.clientX, y: event.clientY },
      };
      event.preventDefault();
    },
    [descriptor.bounds, descriptor.id, isFullscreen, onFocus],
  );

  const beginResize = useCallback(
    (direction: ResizeDirection, event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || isFullscreen) {
        return;
      }

      onFocus(descriptor.id);
      event.stopPropagation();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      interactionRef.current = {
        kind: 'resize',
        direction,
        startBounds: descriptor.bounds,
        startPointer: { x: event.clientX, y: event.clientY },
      };
      event.preventDefault();
    },
    [descriptor.bounds, descriptor.id, isFullscreen, onFocus],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const interaction = interactionRef.current;

      if (!interaction) {
        return;
      }

      const deltaX = event.clientX - interaction.startPointer.x;
      const deltaY = event.clientY - interaction.startPointer.y;
      const nextBounds =
        interaction.kind === 'move'
          ? resolveMovedBounds(interaction.startBounds, deltaX, deltaY)
          : resolveResizedBounds(
              interaction.startBounds,
              interaction.direction ?? 'se',
              deltaX,
              deltaY,
            );

      onResize(descriptor.id, nextBounds);
      event.preventDefault();
    },
    [descriptor.id, onResize],
  );

  const endInteraction = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!interactionRef.current) {
      return;
    }

    interactionRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    onToggleFullscreen(descriptor.id, resolveFullscreenWindowBounds());
  }, [descriptor.id, onToggleFullscreen]);
  const getSourceElement = useCallback(() => frameRef.current, []);
  const frameContext = useMemo<AppFrameWindowContextValue>(
    () => ({
      getSourceElement,
      isFullscreen,
      onBeginMove: beginMove,
      onClose: () => onClose(descriptor.id),
      onHeaderCommand: onHeaderCommand ?? ignoreHeaderCommand,
      onMinimize: (sourceElement) => onMinimize(descriptor.id, sourceElement),
      onToggleFullscreen: handleFullscreenToggle,
      topLayer: isTopLayer,
      windowId: descriptor.id,
      windowTitle: descriptor.title,
    }),
    [
      beginMove,
      descriptor.id,
      descriptor.title,
      getSourceElement,
      handleFullscreenToggle,
      isFullscreen,
      isTopLayer,
      onClose,
      onHeaderCommand,
      onMinimize,
    ],
  );

  return (
    <motion.section
      animate={{
        filter: 'blur(0px)',
        opacity: genieHidden ? 0 : descriptor.status === 'active' ? 1 : 0.92,
        scale: 1,
        y: 0,
      }}
      aria-label={`${descriptor.title} app window`}
      className={cn(
        'absolute flex min-h-[360px] min-w-[520px] flex-col overflow-hidden border text-[var(--ko-ink)] outline-none backdrop-blur-[28px] will-change-transform',
        isFrameTransitioning
          ? 'transition-[left,top,width,height,border-radius,box-shadow] duration-[320ms] ease-[cubic-bezier(0.25,0.9,0.25,1)]'
          : '',
        isFullscreen
          ? 'rounded-none border-transparent'
          : isTopLayer
            ? 'rounded-[26px] border-white/15'
            : 'rounded-[26px] border-white/60',
      )}
      data-app-id={app.id}
      data-genie-effect-hidden={genieHidden ? 'true' : undefined}
      data-genie-effect-source={descriptor.id}
      data-testid={`kernelon-app-container-${descriptor.id}`}
      data-window-layer={isTopLayer ? 'top' : 'workspace'}
      data-window-mode={descriptor.mode ?? 'windowed'}
      data-window-status={descriptor.status}
      data-window-transition-mode="genie-managed"
      data-window-transitioning={isFrameTransitioning ? 'true' : 'false'}
      exit={{ opacity: 0, transition: { duration: 0.01 } }}
      initial={false}
      onPointerCancel={endInteraction}
      onPointerDown={() => onFocus(descriptor.id)}
      onPointerMove={handlePointerMove}
      onPointerUp={endInteraction}
      ref={frameRef}
      style={{
        ...resolveWindowStyle(descriptor, visualFrame, isTopLayer),
        display: descriptor.status === 'minimized' ? 'none' : undefined,
        pointerEvents: genieHidden || descriptor.status === 'minimized' ? 'none' : undefined,
      }}
      transition={{
        filter: { duration: 0.18, ease: 'easeOut' },
        opacity: { duration: genieHidden ? 0 : 0.18, ease: 'easeOut' },
        scale: { damping: 30, mass: 0.86, stiffness: 310, type: 'spring' },
        y: { damping: 30, mass: 0.86, stiffness: 310, type: 'spring' },
      }}
    >
      <AppFrameWindowContext.Provider value={frameContext}>
        {frameOwner === 'app' ? (
          children
        ) : (
          <AppFrame header={header} headerSlots={headerSlots}>
            {children}
          </AppFrame>
        )}
      </AppFrameWindowContext.Provider>
      {!isFullscreen
        ? resizeHandles.map((handle) => (
            <div
              aria-hidden="true"
              className={cn('absolute z-20', handle.className)}
              data-testid={`kernelon-app-window-resize-${handle.direction}-${descriptor.id}`}
              key={handle.direction}
              onPointerDown={(event) => beginResize(handle.direction, event)}
            />
          ))
        : null}
    </motion.section>
  );
}

export function resolveFullscreenWindowBounds(viewport = getViewportSize()): WindowBounds {
  return {
    x: 0,
    y: 0,
    width: viewport.width,
    height: viewport.height,
  };
}

export function resolveWindowDisplayBounds(
  bounds: WindowBounds,
  mode?: WindowDescriptor['mode'],
  options: {
    constrainToWorkspace?: boolean;
    reserveDockArea?: boolean;
    viewport?: ViewportSize;
  } = {},
): WindowBounds {
  if (mode === 'fullscreen') {
    return resolveFullscreenWindowBounds(options.viewport);
  }

  if (options.constrainToWorkspace === false) {
    return bounds;
  }

  if (options.reserveDockArea === false) {
    return fitWindowBoundsInsideTopLayer(bounds, options.viewport);
  }

  return fitWindowBoundsInsideWorkspace(bounds, options.viewport);
}

function resolveWindowStyle(
  descriptor: WindowDescriptor,
  visualFrame: WindowVisualFrame,
  isTopLayer: boolean,
): CSSProperties {
  return {
    background: isTopLayer
      ? 'linear-gradient(180deg, rgba(9,11,14,0.78), rgba(5,7,10,0.72)), radial-gradient(120% 160% at 12% -18%, rgba(255,255,255,0.12), rgba(255,255,255,0) 58%), radial-gradient(100% 120% at 82% 112%, rgba(120,150,168,0.12), rgba(120,150,168,0) 64%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.76), rgba(245,249,252,0.56)), radial-gradient(120% 160% at 12% -18%, rgba(255,255,255,0.72), rgba(255,255,255,0) 58%), radial-gradient(100% 120% at 82% 112%, rgba(107,147,178,0.18), rgba(107,147,178,0) 64%)',
    borderRadius:
      visualFrame.mode === 'fullscreen' ? FULLSCREEN_CHROME_RADIUS : WINDOW_CHROME_RADIUS,
    boxShadow: resolveWindowShadow(descriptor, visualFrame.mode, isTopLayer),
    height: visualFrame.bounds.height,
    left: visualFrame.bounds.x,
    minHeight: descriptor.mode === 'fullscreen' ? 0 : MIN_WINDOW_HEIGHT,
    minWidth: descriptor.mode === 'fullscreen' ? 0 : MIN_WINDOW_WIDTH,
    top: visualFrame.bounds.y,
    transformOrigin: '50% calc(100% + 148px)',
    width: visualFrame.bounds.width,
    zIndex: (isTopLayer ? 90 : 40) + descriptor.zIndex,
  };
}

function resolveWindowVisualFrame(
  { bounds, constrainToWorkspace, mode, reserveDockArea }: WindowVisualFrameInput,
  viewport?: ViewportSize,
): WindowVisualFrame {
  return {
    bounds: resolveWindowDisplayBounds(bounds, mode, {
      constrainToWorkspace,
      reserveDockArea,
      viewport,
    }),
    mode: mode ?? 'windowed',
  };
}

function resolveWindowShadow(
  descriptor: WindowDescriptor,
  visualMode: WindowVisualMode,
  isTopLayer: boolean,
): string {
  if (visualMode === 'fullscreen') {
    return 'none';
  }

  if (isTopLayer) {
    return descriptor.status === 'active'
      ? 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.06), 0 34px 92px rgba(0,0,0,0.42)'
      : 'inset 0 1px 0 rgba(255,255,255,0.10), 0 24px 64px rgba(0,0,0,0.34)';
  }

  return descriptor.status === 'active'
    ? 'inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(255,255,255,0.48), 0 34px 86px rgba(24,40,55,0.26), 0 9px 28px rgba(24,40,55,0.16)'
    : 'inset 0 1px 0 rgba(255,255,255,0.72), 0 24px 56px rgba(24,40,55,0.18)';
}

function resolveMovedBounds(bounds: WindowBounds, deltaX: number, deltaY: number): WindowBounds {
  const viewport = getViewportSize();
  const maxX = Math.max(DESKTOP_MARGIN, viewport.width - 160);
  const maxY = Math.max(STATUS_BAR_CLEARANCE, viewport.height - 120);

  return {
    ...bounds,
    x: clamp(bounds.x + deltaX, DESKTOP_MARGIN, maxX),
    y: clamp(bounds.y + deltaY, STATUS_BAR_CLEARANCE, maxY),
  };
}

function resolveResizedBounds(
  bounds: WindowBounds,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
): WindowBounds {
  let nextX = bounds.x;
  let nextY = bounds.y;
  let nextWidth = bounds.width;
  let nextHeight = bounds.height;

  if (direction.includes('e')) {
    nextWidth = bounds.width + deltaX;
  }

  if (direction.includes('s')) {
    nextHeight = bounds.height + deltaY;
  }

  if (direction.includes('w')) {
    nextWidth = bounds.width - deltaX;
    nextX = bounds.x + deltaX;

    if (nextWidth < MIN_WINDOW_WIDTH) {
      nextX = bounds.x + bounds.width - MIN_WINDOW_WIDTH;
    }
  }

  if (direction.includes('n')) {
    nextHeight = bounds.height - deltaY;
    nextY = bounds.y + deltaY;

    if (nextHeight < MIN_WINDOW_HEIGHT) {
      nextY = bounds.y + bounds.height - MIN_WINDOW_HEIGHT;
    }
  }

  nextWidth = Math.max(MIN_WINDOW_WIDTH, nextWidth);
  nextHeight = Math.max(MIN_WINDOW_HEIGHT, nextHeight);

  return fitWindowBoundsInsideWorkspace({
    height: nextHeight,
    width: nextWidth,
    x: nextX,
    y: nextY,
  });
}

function fitWindowBoundsInsideWorkspace(
  bounds: WindowBounds,
  viewport = getViewportSize(),
): WindowBounds {
  const width = Math.min(
    bounds.width,
    Math.max(MIN_WINDOW_WIDTH, viewport.width - DESKTOP_MARGIN * 2),
  );
  const height = Math.min(
    bounds.height,
    Math.max(MIN_WINDOW_HEIGHT, viewport.height - STATUS_BAR_CLEARANCE - DOCK_SAFE_AREA_CLEARANCE),
  );
  const maxX = Math.max(DESKTOP_MARGIN, viewport.width - width - DESKTOP_MARGIN);
  const maxY = Math.max(STATUS_BAR_CLEARANCE, viewport.height - height - DOCK_SAFE_AREA_CLEARANCE);
  const x = clamp(bounds.x, DESKTOP_MARGIN, maxX);
  const y = clamp(bounds.y, STATUS_BAR_CLEARANCE, maxY);

  return { height, width, x, y };
}

function fitWindowBoundsInsideTopLayer(
  bounds: WindowBounds,
  viewport = getViewportSize(),
): WindowBounds {
  const width = Math.min(
    bounds.width,
    Math.max(MIN_WINDOW_WIDTH, viewport.width - DESKTOP_MARGIN * 2),
  );
  const height = Math.min(
    bounds.height,
    Math.max(MIN_WINDOW_HEIGHT, viewport.height - DESKTOP_MARGIN * 2),
  );
  const maxX = Math.max(DESKTOP_MARGIN, viewport.width - width - DESKTOP_MARGIN);
  const maxY = Math.max(DESKTOP_MARGIN, viewport.height - height - DESKTOP_MARGIN);
  const x = clamp(bounds.x, DESKTOP_MARGIN, maxX);
  const y = clamp(bounds.y, DESKTOP_MARGIN, maxY);

  return { height, width, x, y };
}

function getViewportSize() {
  return {
    height: globalThis.window?.innerHeight ?? 900,
    width: globalThis.window?.innerWidth ?? 1440,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function ignoreHeaderCommand() {
  // App header commands are optional. Static descriptors can render before handlers exist.
}

const resizeHandles: Array<{
  className: string;
  direction: ResizeDirection;
}> = [
  { direction: 'n', className: 'left-5 right-5 top-[-4px] h-2 cursor-ns-resize' },
  { direction: 'e', className: 'bottom-5 right-[-4px] top-5 w-2 cursor-ew-resize' },
  { direction: 's', className: 'bottom-[-4px] left-5 right-5 h-2 cursor-ns-resize' },
  { direction: 'w', className: 'bottom-5 left-[-4px] top-5 w-2 cursor-ew-resize' },
  { direction: 'ne', className: 'right-[-4px] top-[-4px] size-6 cursor-nesw-resize' },
  { direction: 'nw', className: 'left-[-4px] top-[-4px] size-6 cursor-nwse-resize' },
  { direction: 'se', className: 'bottom-[-4px] right-[-4px] size-7 cursor-nwse-resize' },
  { direction: 'sw', className: 'bottom-[-4px] left-[-4px] size-6 cursor-nesw-resize' },
];
