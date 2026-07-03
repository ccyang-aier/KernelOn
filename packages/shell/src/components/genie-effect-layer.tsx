'use client';

import { toCanvas } from 'html-to-image';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';

import {
  createGenieMeshFrame,
  resolveGenieTargetRect,
  type GenieRect,
} from './genie-effect-geometry';

export type GenieTransitionDirection = 'minimize' | 'open';

export interface PlayGenieTransitionOptions {
  direction: GenieTransitionDirection;
  sourceElement: HTMLElement;
  targetElement: HTMLElement;
}

export interface GenieEffectLayerHandle {
  play(options: PlayGenieTransitionOptions): Promise<boolean>;
}

type GenieEffectLayerProps = object;

const GENIE_DURATION_MS = 560;
const GENIE_STRIP_ROWS = 96;

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
        sourceElement,
        targetElement,
      }: PlayGenieTransitionOptions): Promise<boolean> => {
        const canvas = canvasRef.current;

        if (
          !canvas ||
          shouldBypassGenieAnimation() ||
          !sourceElement.isConnected ||
          !targetElement.isConnected
        ) {
          return false;
        }

        const context = setupCanvas(canvas);

        if (!context) {
          return false;
        }

        window.cancelAnimationFrame(animationFrameRef.current);

        const sourceRect = getElementRect(sourceElement);
        const targetRect = resolveGenieTargetRect(getElementRect(targetElement));
        const fallbackSnapshot = createFallbackSnapshot(sourceRect);
        canvas.style.opacity = '1';
        renderGenieFrame(context, fallbackSnapshot, sourceRect, targetRect, direction, 0);
        const restoreSourceVisibility = hideSourceElement(sourceElement);
        const snapshot = (await captureElementCanvas(sourceElement, sourceRect)) ??
          fallbackSnapshot;

        renderGenieFrame(context, snapshot, sourceRect, targetRect, direction, 0);

        return new Promise<boolean>((resolve) => {
          let startedAt: number | null = null;

          const step = (time: number) => {
            startedAt ??= time;
            const progress = Math.min((time - startedAt) / GENIE_DURATION_MS, 1);

            renderGenieFrame(context, snapshot, sourceRect, targetRect, direction, progress);

            if (progress < 1) {
              animationFrameRef.current = window.requestAnimationFrame(step);
              return;
            }

            if (direction === 'open') {
              restoreSourceVisibility();
            }
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
  sourceRect: GenieRect,
  targetRect: GenieRect,
  direction: GenieTransitionDirection,
  rawProgress: number,
) {
  const progress = easeInOutCubic(rawProgress);
  const collapseProgress = direction === 'minimize' ? progress : 1 - progress;
  const frame = createGenieMeshFrame({
    columns: 1,
    progress: collapseProgress,
    rows: GENIE_STRIP_ROWS,
    sourceRect,
    targetRect,
  });
  const viewport = getViewportSize();

  context.clearRect(0, 0, viewport.width, viewport.height);
  context.save();
  context.globalAlpha =
    direction === 'minimize' ? 1 - progress * 0.08 : 0.92 + progress * 0.08;
  drawTexturedStrips(context, snapshot, frame.vertices, frame.rows);
  context.restore();
}

function drawTexturedStrips(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  vertices: ReturnType<typeof createGenieMeshFrame>['vertices'],
  rows: number,
) {
  for (let row = 0; row < rows; row += 1) {
    const topLeft = vertices[row * 2];
    const topRight = vertices[row * 2 + 1];
    const bottomLeft = vertices[(row + 1) * 2];
    const bottomRight = vertices[(row + 1) * 2 + 1];
    const topWidth = topRight.x - topLeft.x;
    const bottomWidth = bottomRight.x - bottomLeft.x;
    const drawWidth = Math.max(1, (topWidth + bottomWidth) / 2);
    const drawX = (topLeft.x + topRight.x + bottomLeft.x + bottomRight.x) / 4 - drawWidth / 2;
    const drawY = (topLeft.y + topRight.y) / 2;
    const drawHeight = Math.max(0.75, (bottomLeft.y + bottomRight.y) / 2 - drawY);
    const sourceY = Math.floor((row / rows) * image.height);
    const sourceHeight = Math.ceil(image.height / rows) + 1;

    context.drawImage(
      image,
      0,
      sourceY,
      image.width,
      sourceHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight + 1,
    );
  }
}

async function captureElementCanvas(
  element: HTMLElement,
  sourceRect: GenieRect,
): Promise<HTMLCanvasElement | null> {
  try {
    return await toCanvas(element, {
      cacheBust: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      style: {
        opacity: '1',
        transform: 'none',
      },
      width: sourceRect.width,
      height: sourceRect.height,
    });
  } catch {
    return null;
  }
}

function createFallbackSnapshot(sourceRect: GenieRect): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = Math.max(1, Math.round(sourceRect.width));
  canvas.height = Math.max(1, Math.round(sourceRect.height));

  if (context) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);

    gradient.addColorStop(0, 'rgba(255,255,255,0.92)');
    gradient.addColorStop(0.52, 'rgba(238,246,255,0.86)');
    gradient.addColorStop(1, 'rgba(206,224,235,0.74)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

function hideSourceElement(element: HTMLElement): () => void {
  const previousOpacity = element.style.opacity;
  const previousPointerEvents = element.style.pointerEvents;

  element.style.opacity = '0';
  element.style.pointerEvents = 'none';

  return () => {
    element.style.opacity = previousOpacity;
    element.style.pointerEvents = previousPointerEvents;
  };
}

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = getCanvasContext(canvas);

  if (!context) {
    return null;
  }

  const viewport = getViewportSize();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
