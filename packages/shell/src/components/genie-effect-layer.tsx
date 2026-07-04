'use client';

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';

import {
  createGenieScanlineFrame,
  easeOutQuad,
  resolveGenieDockPoint,
  type GenieRect,
  type GenieScanlineFrame,
  type GenieTransitionDirection,
} from './genie-effect-geometry';

export type { GenieRect, GenieTransitionDirection };

export interface PlayGenieTransitionOptions {
  direction: GenieTransitionDirection;
  onAfterFirstFrame?(): void;
  onBeforeClear?(): void;
  snapshot: HTMLCanvasElement | null | undefined;
  sourceElement?: HTMLElement | null;
  sourceRect: GenieRect;
  targetElement: HTMLElement;
}

export interface GenieEffectLayerHandle {
  play(options: PlayGenieTransitionOptions): Promise<boolean>;
}

type GenieEffectLayerProps = object;

const GENIE_DURATION_MS = 350;
const DESTINATION_ROW_OVERDRAW = 0.75;
const MAX_DEVICE_PIXEL_RATIO = 2;
const MIN_DRAW_WIDTH = 0.8;

export const GenieEffectLayer = forwardRef<GenieEffectLayerHandle, GenieEffectLayerProps>(
  function GenieEffectLayer(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const context = getCanvasContext(canvas);

      if (!canvas || !context) {
        return;
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = '0';
    }, []);

    const play = useCallback(
      async ({
        direction,
        onAfterFirstFrame,
        onBeforeClear,
        snapshot,
        sourceElement,
        sourceRect,
        targetElement,
      }: PlayGenieTransitionOptions): Promise<boolean> => {
        const canvas = canvasRef.current;

        if (
          !canvas ||
          !snapshot ||
          shouldBypassGenieAnimation() ||
          !targetElement.isConnected
        ) {
          return false;
        }

        const context = setupCanvas(canvas);

        if (!context) {
          return false;
        }

        window.cancelAnimationFrame(animationFrameRef.current);

        const viewport = getViewportSize();
        const dockPoint = resolveGenieDockPoint(getElementRect(targetElement));

        if (direction === 'minimize' && sourceElement?.isConnected) {
          hideSourceElement(sourceElement);
        }

        canvas.style.opacity = '1';
        renderGenieFrame(context, snapshot, viewport, sourceRect, dockPoint, direction, 0);

        onAfterFirstFrame?.();

        return new Promise<boolean>((resolve) => {
          let startedAt: number | null = null;

          const step = (time: number) => {
            startedAt ??= time;
            const progress = Math.min((time - startedAt) / GENIE_DURATION_MS, 1);

            renderGenieFrame(
              context,
              snapshot,
              viewport,
              sourceRect,
              dockPoint,
              direction,
              progress,
            );

            if (progress < 1) {
              animationFrameRef.current = window.requestAnimationFrame(step);
              return;
            }

            onBeforeClear?.();
            clearCanvas();
            resolve(true);
          };

          animationFrameRef.current = window.requestAnimationFrame(step);
        });
      },
      [clearCanvas],
    );

    useImperativeHandle(ref, () => ({ play }), [play]);

    return (
      <canvas
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] opacity-0"
        data-testid="kernelon-genie-effect-layer"
        ref={canvasRef}
        style={{ height: '100vh', width: '100vw' }}
      />
    );
  },
);

function renderGenieFrame(
  context: CanvasRenderingContext2D,
  snapshot: HTMLCanvasElement,
  viewport: { height: number; width: number },
  sourceRect: GenieRect,
  dockPoint: { x: number; y: number },
  direction: GenieTransitionDirection,
  rawProgress: number,
) {
  const frame = createGenieScanlineFrame({
    direction,
    dockPoint,
    progress: rawProgress,
    sourceRect,
  });

  context.clearRect(0, 0, viewport.width, viewport.height);
  context.save();
  drawScanlines(context, snapshot, sourceRect, frame);
  drawDockGlow(context, viewport, dockPoint, direction, rawProgress);
  context.restore();
}

function drawScanlines(
  context: CanvasRenderingContext2D,
  snapshot: HTMLCanvasElement,
  sourceRect: GenieRect,
  frame: GenieScanlineFrame,
) {
  const safeSourceHeight = Math.max(1, sourceRect.height);
  const sourceScaleY = snapshot.height / safeSourceHeight;

  for (const row of frame.rows) {
    if (row.width < MIN_DRAW_WIDTH) {
      continue;
    }

    const sourceY = Math.floor(row.sourceY * sourceScaleY);
    const sourceHeight = Math.max(1, Math.ceil(row.sourceHeight * sourceScaleY));

    context.drawImage(
      snapshot,
      0,
      sourceY,
      snapshot.width,
      Math.min(sourceHeight, snapshot.height - sourceY),
      row.left,
      row.y,
      row.width,
      row.sourceHeight + DESTINATION_ROW_OVERDRAW,
    );
  }
}

function drawDockGlow(
  context: CanvasRenderingContext2D,
  viewport: { height: number; width: number },
  dockPoint: { x: number; y: number },
  direction: GenieTransitionDirection,
  rawProgress: number,
) {
  const glowProgress = direction === 'minimize' ? rawProgress : 1 - rawProgress;

  if (glowProgress <= 0.75) {
    return;
  }

  const alpha = easeOutQuad((glowProgress - 0.75) / 0.25) * 0.3;
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  const gradient = context.createRadialGradient(
    dockPoint.x,
    dockPoint.y,
    0,
    dockPoint.x,
    dockPoint.y,
    55,
  );

  gradient.addColorStop(0, `#ffffff${alphaHex}`);
  gradient.addColorStop(1, 'transparent');
  context.fillStyle = gradient;
  context.fillRect(0, 0, viewport.width, viewport.height);
}

function hideSourceElement(element: HTMLElement): void {
  element.style.opacity = '0';
  element.style.pointerEvents = 'none';
}

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = getCanvasContext(canvas);

  if (!context) {
    return null;
  }

  const viewport = getViewportSize();
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);

  canvas.width = Math.round(viewport.width * dpr);
  canvas.height = Math.round(viewport.height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  return context;
}

function getCanvasContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  try {
    return canvas?.getContext('2d') ?? null;
  } catch {
    return null;
  }
}

function getElementRect(element: HTMLElement): GenieRect {
  const rect = element.getBoundingClientRect();

  return {
    height: rect.height,
    width: rect.width,
    x: rect.left,
    y: rect.top,
  };
}

function getViewportSize() {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
}

function shouldBypassGenieAnimation(): boolean {
  return (
    navigator.userAgent.includes('jsdom') ||
    (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );
}
