export type GenieTransitionDirection = 'minimize' | 'open';

export interface GeniePoint {
  x: number;
  y: number;
}

export interface GenieRect extends GeniePoint {
  height: number;
  width: number;
}

export interface GenieScanlineRow {
  left: number;
  right: number;
  sourceHeight: number;
  sourceY: number;
  width: number;
  y: number;
}

export interface GenieScanlineFrame {
  direction: GenieTransitionDirection;
  rows: GenieScanlineRow[];
}

export interface CreateGenieScanlineFrameOptions {
  direction: GenieTransitionDirection;
  dockPoint: GeniePoint;
  progress: number;
  rowStep?: number;
  sourceRect: GenieRect;
}

const DEFAULT_ROW_STEP = 1;
const X_STAGGER = 0.65;
const Y_STAGGER = 0.2;

export function resolveGenieDockPoint(dockRect: GenieRect): GeniePoint {
  return {
    x: dockRect.x + dockRect.width / 2,
    y: dockRect.y + dockRect.height / 2,
  };
}

export function createGenieScanlineFrame({
  direction,
  dockPoint,
  progress,
  rowStep = DEFAULT_ROW_STEP,
  sourceRect,
}: CreateGenieScanlineFrameOptions): GenieScanlineFrame {
  const normalizedProgress = clamp(progress, 0, 1);
  const safeHeight = Math.max(1, Math.round(sourceRect.height));
  const safeRowStep = Math.max(1, Math.round(rowStep));
  const rows: GenieScanlineRow[] = [];

  for (let sourceY = 0; sourceY < safeHeight; sourceY += safeRowStep) {
    const sourceHeight = Math.min(safeRowStep, safeHeight - sourceY);
    const rowRatio = sourceY / safeHeight;
    const rowXStart =
      direction === 'minimize' ? (1 - rowRatio) * X_STAGGER : rowRatio * X_STAGGER;
    const xProgress = clamp(
      (normalizedProgress - rowXStart) / Math.max(1 - rowXStart, Number.EPSILON),
      0,
      1,
    );
    const xEase = easeInOutCubic(xProgress);
    const rowYStart =
      direction === 'minimize' ? (1 - rowRatio) * Y_STAGGER : rowRatio * Y_STAGGER;
    const yProgress = clamp(
      (normalizedProgress - rowYStart) / Math.max(1 - rowYStart, Number.EPSILON),
      0,
      1,
    );
    const yEase = easeInQuad(yProgress);
    const left =
      direction === 'minimize'
        ? lerp(sourceRect.x, dockPoint.x, xEase)
        : lerp(dockPoint.x, sourceRect.x, xEase);
    const right =
      direction === 'minimize'
        ? lerp(sourceRect.x + sourceRect.width, dockPoint.x, xEase)
        : lerp(dockPoint.x, sourceRect.x + sourceRect.width, xEase);
    const y =
      direction === 'minimize'
        ? lerp(sourceRect.y + sourceY, dockPoint.y, yEase)
        : lerp(dockPoint.y, sourceRect.y + sourceY, yEase);

    rows.push({
      left,
      right,
      sourceHeight,
      sourceY,
      width: right - left,
      y,
    });
  }

  return {
    direction,
    rows,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function easeOutQuad(value: number): number {
  return 1 - (1 - value) * (1 - value);
}

function easeInQuad(value: number): number {
  return value * value;
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}
