'use client';

import { Maximize2, Minus, X, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import type { KernelAppManifest, WindowBounds, WindowDescriptor } from '@kernelon/core';
import { cn } from '@kernelon/ui';

const MIN_WINDOW_WIDTH = 520;
const MIN_WINDOW_HEIGHT = 360;
const DESKTOP_MARGIN = 12;
const STATUS_BAR_CLEARANCE = 46;
const WINDOW_CHROME_RADIUS = 26;
const FULLSCREEN_CHROME_RADIUS = 0;
const WINDOW_BOUNDS_TRANSITION_MS = 460;

type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
type WindowVisualMode = NonNullable<WindowDescriptor['mode']>;

interface WindowVisualFrame {
  bounds: WindowBounds;
  mode: WindowVisualMode;
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
  onClose(windowId: string): void;
  onFocus(windowId: string): void;
  onMinimize(windowId: string): void;
  onResize(windowId: string, bounds: WindowBounds): void;
  onToggleFullscreen(windowId: string, bounds: WindowBounds): void;
}

export function AppWindowContainer({
  app,
  children,
  onClose,
  onFocus,
  onMinimize,
  onResize,
  onToggleFullscreen,
  window: descriptor,
}: AppWindowContainerProps) {
  const interactionRef = useRef<WindowInteractionState | null>(null);
  const previousFrameRef = useRef<WindowVisualFrame>(resolveWindowVisualFrame(descriptor));
  const [visualFrame, setVisualFrame] = useState<WindowVisualFrame>(() =>
    resolveWindowVisualFrame(descriptor),
  );
  const [isFrameTransitioning, setIsFrameTransitioning] = useState(false);
  const isFullscreen = descriptor.mode === 'fullscreen';

  useEffect(() => {
    const nextFrame = resolveWindowVisualFrame(descriptor);
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
    descriptor.bounds.height,
    descriptor.bounds.width,
    descriptor.bounds.x,
    descriptor.bounds.y,
    descriptor.mode,
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

  return (
    <motion.section
      animate={{
        filter: 'blur(0px)',
        opacity: descriptor.status === 'active' ? 1 : 0.92,
        scale: 1,
        y: 0,
      }}
      aria-label={`${descriptor.title} app window`}
      className={cn(
        'absolute flex min-h-[360px] min-w-[520px] flex-col overflow-hidden border text-[var(--ko-ink)] outline-none backdrop-blur-[28px] will-change-transform',
        isFrameTransitioning
          ? 'transition-[left,top,width,height,border-radius,box-shadow] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
          : '',
        isFullscreen ? 'rounded-none border-transparent' : 'rounded-[26px] border-white/60',
      )}
      data-app-id={app.id}
      data-testid={`kernelon-app-container-${descriptor.id}`}
      data-window-mode={descriptor.mode ?? 'windowed'}
      data-window-status={descriptor.status}
      data-window-transitioning={isFrameTransitioning ? 'true' : 'false'}
      exit={{
        filter: 'blur(24px)',
        opacity: 0,
        scale: 0.52,
        transition: { duration: 0.3, ease: [0.36, 0, 0.66, -0.56] },
        y: 340,
      }}
      initial={{
        filter: 'blur(24px)',
        opacity: 0,
        scale: 0.52,
        y: 340,
      }}
      onPointerCancel={endInteraction}
      onPointerDown={() => onFocus(descriptor.id)}
      onPointerMove={handlePointerMove}
      onPointerUp={endInteraction}
      style={resolveWindowStyle(descriptor, visualFrame)}
      transition={{
        filter: { duration: 0.18, ease: 'easeOut' },
        opacity: { duration: 0.18, ease: 'easeOut' },
        scale: { damping: 30, mass: 0.86, stiffness: 310, type: 'spring' },
        y: { damping: 30, mass: 0.86, stiffness: 310, type: 'spring' },
      }}
    >
      <header className="relative flex h-11 shrink-0 items-center border-b border-white/42 bg-white/44 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
        <div
          className="group absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2.5"
          data-testid={`kernelon-app-window-traffic-lights-${descriptor.id}`}
        >
          <TrafficLightButton
            className="bg-[#ff5f57] shadow-[0_0_0_0.5px_rgba(120,28,22,0.38),inset_0_1px_0_rgba(255,255,255,0.46)]"
            icon={X}
            label={`关闭 ${descriptor.title}`}
            onClick={() => onClose(descriptor.id)}
          />
          <TrafficLightButton
            className="bg-[#febc2e] shadow-[0_0_0_0.5px_rgba(126,78,0,0.36),inset_0_1px_0_rgba(255,255,255,0.48)]"
            icon={Minus}
            label={`最小化 ${descriptor.title}`}
            onClick={() => onMinimize(descriptor.id)}
          />
          <TrafficLightButton
            className="bg-[#28c840] shadow-[0_0_0_0.5px_rgba(20,96,30,0.36),inset_0_1px_0_rgba(255,255,255,0.48)]"
            icon={Maximize2}
            label={`${isFullscreen ? '退出全屏' : '进入全屏'} ${descriptor.title}`}
            onClick={handleFullscreenToggle}
          />
        </div>
        <div
          className="flex h-full flex-1 cursor-default select-none items-center justify-center px-28 text-[13px] font-semibold text-[#1f2937]/82"
          onDoubleClick={handleFullscreenToggle}
          onPointerDown={beginMove}
        >
          <span className="truncate">{descriptor.title}</span>
        </div>
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.70),rgba(246,250,255,0.48))]">
        <div className="h-full overflow-auto">{children}</div>
      </div>
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

function TrafficLightButton({
  className,
  icon: Icon,
  label,
  onClick,
}: Readonly<{
  className: string;
  icon: LucideIcon;
  label: string;
  onClick(): void;
}>) {
  return (
    <button
      aria-label={label}
      className={cn(
        'flex size-3.5 origin-center items-center justify-center rounded-full text-black/82 outline-none transition-[transform,box-shadow,filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.24] group-hover:brightness-[1.03] hover:scale-[1.32] focus-visible:ring-2 focus-visible:ring-white/90',
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className="size-2.5 opacity-0 transition duration-150 ease-out group-hover:opacity-90"
        strokeWidth={3}
      />
    </button>
  );
}

export function resolveFullscreenWindowBounds(): WindowBounds {
  const viewport = getViewportSize();

  return {
    x: 0,
    y: 0,
    width: viewport.width,
    height: viewport.height,
  };
}

function resolveWindowStyle(
  descriptor: WindowDescriptor,
  visualFrame: WindowVisualFrame,
): CSSProperties {
  return {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.76), rgba(245,249,252,0.56)), radial-gradient(120% 160% at 12% -18%, rgba(255,255,255,0.72), rgba(255,255,255,0) 58%), radial-gradient(100% 120% at 82% 112%, rgba(107,147,178,0.18), rgba(107,147,178,0) 64%)',
    borderRadius:
      visualFrame.mode === 'fullscreen' ? FULLSCREEN_CHROME_RADIUS : WINDOW_CHROME_RADIUS,
    boxShadow: resolveWindowShadow(descriptor, visualFrame.mode),
    height: visualFrame.bounds.height,
    left: visualFrame.bounds.x,
    minHeight: descriptor.mode === 'fullscreen' ? 0 : MIN_WINDOW_HEIGHT,
    minWidth: descriptor.mode === 'fullscreen' ? 0 : MIN_WINDOW_WIDTH,
    top: visualFrame.bounds.y,
    transformOrigin: '50% calc(100% + 148px)',
    width: visualFrame.bounds.width,
    zIndex: 40 + descriptor.zIndex,
  };
}

function resolveWindowVisualFrame(descriptor: WindowDescriptor): WindowVisualFrame {
  return {
    bounds: descriptor.bounds,
    mode: descriptor.mode ?? 'windowed',
  };
}

function resolveWindowShadow(descriptor: WindowDescriptor, visualMode: WindowVisualMode): string {
  if (visualMode === 'fullscreen') {
    return 'none';
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

  return keepBoundsInsideWorkspace({
    height: nextHeight,
    width: nextWidth,
    x: nextX,
    y: nextY,
  });
}

function keepBoundsInsideWorkspace(bounds: WindowBounds): WindowBounds {
  const viewport = getViewportSize();
  const maxWidth = Math.max(MIN_WINDOW_WIDTH, viewport.width - bounds.x - DESKTOP_MARGIN);
  const maxHeight = Math.max(MIN_WINDOW_HEIGHT, viewport.height - bounds.y - DESKTOP_MARGIN);
  const width = Math.min(bounds.width, maxWidth);
  const height = Math.min(bounds.height, maxHeight);
  const x = clamp(
    bounds.x,
    DESKTOP_MARGIN,
    Math.max(DESKTOP_MARGIN, viewport.width - MIN_WINDOW_WIDTH),
  );
  const y = clamp(
    bounds.y,
    STATUS_BAR_CLEARANCE,
    Math.max(STATUS_BAR_CLEARANCE, viewport.height - MIN_WINDOW_HEIGHT),
  );

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
