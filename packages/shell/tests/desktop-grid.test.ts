import { describe, expect, it } from 'vitest';

import {
  createDesktopGridCells,
  desktopGridMetrics,
  resolveDesktopGridAreaStyle,
  snapPointerToDesktopGrid,
} from '../src/components/desktop-grid';

describe('desktop grid helpers', () => {
  it('resolves a widget grid area into stable pixel bounds', () => {
    expect(
      resolveDesktopGridAreaStyle({
        height: 2,
        width: 4,
        x: 1,
        y: 3,
      }),
    ).toMatchObject({
      height: 222,
      left: 166,
      top: 430,
      width: 458,
    });
  });

  it('snaps pointer coordinates using row height for vertical placement', () => {
    expect(
      snapPointerToDesktopGrid({
        pointer: {
          x: desktopGridMetrics.offsetX + 2 * desktopGridMetrics.columnStride + 60,
          y: desktopGridMetrics.offsetY + 3 * desktopGridMetrics.rowStride + 60,
        },
        size: { height: 2, width: 2 },
      }),
    ).toEqual({
      height: 2,
      width: 2,
      x: 2,
      y: 3,
    });
  });

  it('clamps dropped widgets to the top-left grid boundary', () => {
    expect(
      snapPointerToDesktopGrid({
        pointer: { x: 0, y: 0 },
        size: { height: 2, width: 2 },
      }),
    ).toEqual({
      height: 2,
      width: 2,
      x: 0,
      y: 0,
    });
  });

  it('creates adaptive visible cells without overflowing the viewport', () => {
    const bounds = { height: 320, width: 320 };
    const cells = createDesktopGridCells(bounds);

    expect(cells).toHaveLength(4);
    expect(cells.at(-1)).toEqual({ x: 1, y: 1 });

    for (const cell of cells) {
      const style = resolveDesktopGridAreaStyle({ height: 1, width: 1, x: cell.x, y: cell.y });

      expect(Number(style.left) + Number(style.width)).toBeLessThanOrEqual(bounds.width);
      expect(Number(style.top) + Number(style.height)).toBeLessThanOrEqual(bounds.height);
    }
  });

  it('clamps snapped widgets to the visible grid bounds', () => {
    expect(
      snapPointerToDesktopGrid({
        bounds: { height: 520, width: 640 },
        pointer: { x: 9999, y: 9999 },
        size: { height: 2, width: 2 },
      }),
    ).toEqual({
      height: 2,
      width: 2,
      x: 3,
      y: 1,
    });
  });
});
