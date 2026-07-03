export interface GeniePoint {
  x: number;
  y: number;
}

export interface GenieRect extends GeniePoint {
  height: number;
  width: number;
}

export interface GenieVertex extends GeniePoint {
  column: number;
  offsetX: number;
  row: number;
  u: number;
  v: number;
}

export interface GenieMeshFrame {
  columns: number;
  rowCenters: GeniePoint[];
  rowWidths: number[];
  rows: number;
  vertices: GenieVertex[];
}

export interface CreateGenieMeshFrameOptions {
  columns?: number;
  progress: number;
  rows?: number;
  sourceRect: GenieRect;
  targetRect: GenieRect;
}

const DEFAULT_COLUMNS = 18;
const DEFAULT_ROWS = 14;
const DEFAULT_DOCK_LANDING_SIZE = 44;

export function resolveGenieTargetRect(
  dockRect: GenieRect,
  landingSize = DEFAULT_DOCK_LANDING_SIZE,
): GenieRect {
  const size = Math.min(landingSize, dockRect.width, dockRect.height);

  return {
    height: size,
    width: size,
    x: dockRect.x + (dockRect.width - size) / 2,
    y: dockRect.y + (dockRect.height - size) / 2,
  };
}

export function createGenieMeshFrame({
  columns = DEFAULT_COLUMNS,
  progress,
  rows = DEFAULT_ROWS,
  sourceRect,
  targetRect,
}: CreateGenieMeshFrameOptions): GenieMeshFrame {
  const normalizedProgress = clamp(progress, 0, 1);
  const sourceCenterX = sourceRect.x + sourceRect.width / 2;
  const targetCenterX = targetRect.x + targetRect.width / 2;
  const motionAmplitude = Math.sin(normalizedProgress * Math.PI);
  const vertices: GenieVertex[] = [];
  const rowCenters: GeniePoint[] = [];
  const rowWidths: number[] = [];

  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    const sourceY = sourceRect.y + sourceRect.height * v;
    const targetY = targetRect.y + targetRect.height * v;
    const rowProgress = resolveRowProgress(normalizedProgress, v);
    const rowEase = easeInOutCubic(rowProgress);
    const wave =
      Math.sin((v * 2.75 + normalizedProgress * 1.35) * Math.PI) *
      motionAmplitude *
      sourceRect.width *
      0.028 *
      (0.32 + v * 0.68);
    const rowCenterX = lerp(sourceCenterX, targetCenterX, rowEase) + wave;
    const rowCenterY = lerp(sourceY, targetY, rowEase);
    const rowWidth = lerp(sourceRect.width, targetRect.width, rowEase);

    rowCenters.push({ x: rowCenterX, y: rowCenterY });
    rowWidths.push(rowWidth);

    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const edgeCurl =
        Math.sin((u - 0.5) * Math.PI) *
        Math.sin((v + normalizedProgress) * Math.PI * 1.55) *
        motionAmplitude *
        sourceRect.width *
        0.01 *
        (0.25 + v * 0.75);
      const offsetX = wave + edgeCurl;

      vertices.push({
        column,
        offsetX,
        row,
        u,
        v,
        x: rowCenterX + (u - 0.5) * rowWidth + edgeCurl,
        y: rowCenterY,
      });
    }
  }

  return {
    columns,
    rowCenters,
    rowWidths,
    rows,
    vertices,
  };
}

function resolveRowProgress(progress: number, rowRatio: number): number {
  if (progress <= 0 || progress >= 1) {
    return progress;
  }

  return clamp(progress * 1.12 + rowRatio * 0.24 - 0.08, 0, 1);
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
