import type { CSSProperties } from 'react';

import type { DesktopGridArea } from '@kernelon/core';

const desktopGridBaseMetrics = {
  columnWidth: 120,
  rowHeight: 120,
  gap: 20,
  offsetX: 64,
  offsetY: 88,
  columns: 8,
  rows: 5,
} as const;

export const desktopGridMetrics = {
  ...desktopGridBaseMetrics,
  columnStride: desktopGridBaseMetrics.columnWidth + desktopGridBaseMetrics.gap,
  rowStride: desktopGridBaseMetrics.rowHeight + desktopGridBaseMetrics.gap,
} as const;

export type DesktopGridMetrics = typeof desktopGridMetrics;

export const desktopGridCells = Array.from({ length: desktopGridMetrics.columns }, (_, x) =>
  Array.from({ length: desktopGridMetrics.rows }, (_, y) => ({ x, y })),
).flat();

export function resolveDesktopGridAreaStyle(grid: DesktopGridArea): CSSProperties {
  return {
    height: grid.height * desktopGridMetrics.rowHeight + (grid.height - 1) * desktopGridMetrics.gap,
    left: desktopGridMetrics.offsetX + grid.x * desktopGridMetrics.columnStride,
    top: desktopGridMetrics.offsetY + grid.y * desktopGridMetrics.rowStride,
    width: grid.width * desktopGridMetrics.columnWidth + (grid.width - 1) * desktopGridMetrics.gap,
  };
}

export function snapPointerToDesktopGrid({
  metrics = desktopGridMetrics,
  pointer,
  size,
}: {
  metrics?: DesktopGridMetrics;
  pointer: { x: number; y: number };
  size: Pick<DesktopGridArea, 'height' | 'width'>;
}): DesktopGridArea {
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);
  const itemWidth = width * metrics.columnWidth + (width - 1) * metrics.gap;
  const itemHeight = height * metrics.rowHeight + (height - 1) * metrics.gap;
  const x = Math.max(
    0,
    Math.round((pointer.x - metrics.offsetX - itemWidth / 2) / metrics.columnStride),
  );
  const y = Math.max(
    0,
    Math.round((pointer.y - metrics.offsetY - itemHeight / 2) / metrics.rowStride),
  );

  return { height, width, x, y };
}
