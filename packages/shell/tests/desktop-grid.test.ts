import { describe, expect, it } from 'vitest';

import {
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
      height: 260,
      left: 204,
      top: 508,
      width: 540,
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
});
