'use client';

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
  type GenieVertex,
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
const GENIE_COLUMNS = 18;
const GENIE_ROWS = 14;

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
        const snapshot = (await captureElementCanvas(sourceElement, sourceRect)) ??
          createFallbackSnapshot(sourceRect);

        canvas.style.opacity = '1';
        renderGenieFrame(context, snapshot, sourceRect, targetRect, direction, 0);
        const restoreSourceVisibility = hideSourceElement(sourceElement);

        return new Promise<boolean>((resolve) => {
          const startedAt = performance.now();

          const step = (time: number) => {
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
        className="pointer-events-none fixed inset-0 z-[60] opacity-0 transition-opacity duration-75"
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
    columns: GENIE_COLUMNS,
    progress: collapseProgress,
    rows: GENIE_ROWS,
    sourceRect,
    targetRect,
  });
  const viewport = getViewportSize();

  context.clearRect(0, 0, viewport.width, viewport.height);
  context.save();
  context.globalAlpha =
    direction === 'minimize' ? 1 - progress * 0.08 : 0.92 + progress * 0.08;
  drawTexturedMesh(context, snapshot, frame.vertices, frame.columns, frame.rows);
  context.restore();
}

function drawTexturedMesh(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  vertices: GenieVertex[],
  columns: number,
  rows: number,
) {
  const vertexAt = (row: number, column: number) => vertices[row * (columns + 1) + column];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = vertexAt(row, column);
      const topRight = vertexAt(row, column + 1);
      const bottomLeft = vertexAt(row + 1, column);
      const bottomRight = vertexAt(row + 1, column + 1);

      drawTexturedTriangle(context, image, topLeft, topRight, bottomRight);
      drawTexturedTriangle(context, image, topLeft, bottomRight, bottomLeft);
    }
  }
}

function drawTexturedTriangle(
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  pointA: GenieVertex,
  pointB: GenieVertex,
  pointC: GenieVertex,
) {
  const sourceA = toImagePoint(pointA, image);
  const sourceB = toImagePoint(pointB, image);
  const sourceC = toImagePoint(pointC, image);
  const transform = resolveTriangleTransform(sourceA, sourceB, sourceC, pointA, pointB, pointC);

  if (!transform) {
    return;
  }

  context.save();
  context.beginPath();
  context.moveTo(pointA.x, pointA.y);
  context.lineTo(pointB.x, pointB.y);
  context.lineTo(pointC.x, pointC.y);
  context.closePath();
  context.clip();
  context.transform(
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f,
  );
  context.drawImage(image, 0, 0);
  context.restore();
}

function resolveTriangleTransform(
  sourceA: GenieRect,
  sourceB: GenieRect,
  sourceC: GenieRect,
  targetA: GenieVertex,
  targetB: GenieVertex,
  targetC: GenieVertex,
) {
  const denominator =
    sourceA.x * (sourceB.y - sourceC.y) +
    sourceB.x * (sourceC.y - sourceA.y) +
    sourceC.x * (sourceA.y - sourceB.y);

  if (Math.abs(denominator) < 0.0001) {
    return null;
  }

  return {
    a:
      (targetA.x * (sourceB.y - sourceC.y) +
        targetB.x * (sourceC.y - sourceA.y) +
        targetC.x * (sourceA.y - sourceB.y)) /
      denominator,
    b:
      (targetA.y * (sourceB.y - sourceC.y) +
        targetB.y * (sourceC.y - sourceA.y) +
        targetC.y * (sourceA.y - sourceB.y)) /
      denominator,
    c:
      (targetA.x * (sourceC.x - sourceB.x) +
        targetB.x * (sourceA.x - sourceC.x) +
        targetC.x * (sourceB.x - sourceA.x)) /
      denominator,
    d:
      (targetA.y * (sourceC.x - sourceB.x) +
        targetB.y * (sourceA.x - sourceC.x) +
        targetC.y * (sourceB.x - sourceA.x)) /
      denominator,
    e:
      (targetA.x * (sourceB.x * sourceC.y - sourceC.x * sourceB.y) +
        targetB.x * (sourceC.x * sourceA.y - sourceA.x * sourceC.y) +
        targetC.x * (sourceA.x * sourceB.y - sourceB.x * sourceA.y)) /
      denominator,
    f:
      (targetA.y * (sourceB.x * sourceC.y - sourceC.x * sourceB.y) +
        targetB.y * (sourceC.x * sourceA.y - sourceA.x * sourceC.y) +
        targetC.y * (sourceA.x * sourceB.y - sourceB.x * sourceA.y)) /
      denominator,
  };
}

function toImagePoint(vertex: GenieVertex, image: HTMLCanvasElement): GenieRect {
  return {
    height: 0,
    width: 0,
    x: vertex.u * image.width,
    y: vertex.v * image.height,
  };
}

async function captureElementCanvas(
  element: HTMLElement,
  sourceRect: GenieRect,
): Promise<HTMLCanvasElement | null> {
  try {
    const { toCanvas } = await import('html-to-image');

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
    typeof window.CanvasRenderingContext2D === 'undefined' ||
    (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
