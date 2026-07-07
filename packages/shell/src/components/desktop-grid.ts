import type { CSSProperties } from 'react';

import type { DesktopGridArea } from '@kernelon/core';

const desktopGridBaseMetrics = {
  columnWidth: 104,
  rowHeight: 104,
  gap: 14,
  offsetX: 48,
  offsetY: 76,
} as const;

export const desktopGridMetrics = {
  ...desktopGridBaseMetrics,
  columnStride: desktopGridBaseMetrics.columnWidth + desktopGridBaseMetrics.gap,
  rowStride: desktopGridBaseMetrics.rowHeight + desktopGridBaseMetrics.gap,
} as const;

export type DesktopGridMetrics = typeof desktopGridMetrics;

export interface DesktopGridBounds {
  height: number;
  width: number;
}

function resolveVisibleTrackCount({
  cellSize,
  offset,
  size,
  stride,
}: {
  cellSize: number;
  offset: number;
  size: number;
  stride: number;
}): number {
  const availableSize = size - offset - cellSize;

  if (availableSize < 0) {
    return 0;
  }

  return Math.floor(availableSize / stride) + 1;
}

export function createDesktopGridCells(
  bounds: DesktopGridBounds,
  metrics: DesktopGridMetrics = desktopGridMetrics,
) {
  const columns = resolveVisibleTrackCount({
    cellSize: metrics.columnWidth,
    offset: metrics.offsetX,
    size: bounds.width,
    stride: metrics.columnStride,
  });
  const rows = resolveVisibleTrackCount({
    cellSize: metrics.rowHeight,
    offset: metrics.offsetY,
    size: bounds.height,
    stride: metrics.rowStride,
  });

  return Array.from({ length: columns }, (_, x) =>
    Array.from({ length: rows }, (_, y) => ({ x, y })),
  ).flat();
}

export function resolveDesktopGridAreaStyle(grid: DesktopGridArea): CSSProperties {
  return {
    height: grid.height * desktopGridMetrics.rowHeight + (grid.height - 1) * desktopGridMetrics.gap,
    left: desktopGridMetrics.offsetX + grid.x * desktopGridMetrics.columnStride,
    top: desktopGridMetrics.offsetY + grid.y * desktopGridMetrics.rowStride,
    width: grid.width * desktopGridMetrics.columnWidth + (grid.width - 1) * desktopGridMetrics.gap,
  };
}

export function snapPointerToDesktopGrid({
  bounds,
  metrics = desktopGridMetrics,
  pointer,
  size,
}: {
  bounds?: DesktopGridBounds;
  metrics?: DesktopGridMetrics;
  pointer: { x: number; y: number };
  size: Pick<DesktopGridArea, 'height' | 'width'>;
}): DesktopGridArea {
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);
  const itemWidth = width * metrics.columnWidth + (width - 1) * metrics.gap;
  const itemHeight = height * metrics.rowHeight + (height - 1) * metrics.gap;
  const maxX =
    bounds && bounds.width > 0
      ? Math.max(0, Math.floor((bounds.width - metrics.offsetX - itemWidth) / metrics.columnStride))
      : Number.POSITIVE_INFINITY;
  const maxY =
    bounds && bounds.height > 0
      ? Math.max(0, Math.floor((bounds.height - metrics.offsetY - itemHeight) / metrics.rowStride))
      : Number.POSITIVE_INFINITY;
  const x = Math.min(
    maxX,
    Math.max(0, Math.round((pointer.x - metrics.offsetX - itemWidth / 2) / metrics.columnStride)),
  );
  const y = Math.min(
    maxY,
    Math.max(0, Math.round((pointer.y - metrics.offsetY - itemHeight / 2) / metrics.rowStride)),
  );

  return { height, width, x, y };
}
