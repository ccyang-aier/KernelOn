import { describe, expect, it } from 'vitest';

import {
  createGenieScanlineFrame,
  resolveGenieDockPoint,
  type GenieRect,
} from '../src/components/genie-effect-geometry';

const windowRect: GenieRect = {
  height: 640,
  width: 960,
  x: 96,
  y: 72,
};

const dockRect: GenieRect = {
  height: 58,
  width: 58,
  x: 710,
  y: 812,
};

describe('genie effect geometry', () => {
  it('opens from the Dock center point into the exact window rect', () => {
    const dockPoint = resolveGenieDockPoint(dockRect);
    const start = createGenieScanlineFrame({
      direction: 'open',
      dockPoint,
      progress: 0,
      sourceRect: windowRect,
    });
    const end = createGenieScanlineFrame({
      direction: 'open',
      dockPoint,
      progress: 1,
      sourceRect: windowRect,
    });

    expect(start.rows[0]).toMatchObject({
      left: dockPoint.x,
      right: dockPoint.x,
      y: dockPoint.y,
    });
    expect(end.rows[0]).toMatchObject({
      left: windowRect.x,
      right: windowRect.x + windowRect.width,
      y: windowRect.y,
    });
    expect(end.rows.at(-1)?.left).toBeCloseTo(windowRect.x, 1);
    expect(end.rows.at(-1)?.right).toBeCloseTo(windowRect.x + windowRect.width, 1);
    expect(end.rows.at(-1)?.y).toBeCloseTo(windowRect.y + windowRect.height - 1, 1);
  });

  it('collapses bottom scanlines toward the Dock before the top scanlines', () => {
    const frame = createGenieScanlineFrame({
      direction: 'minimize',
      dockPoint: resolveGenieDockPoint(dockRect),
      progress: 0.35,
      sourceRect: windowRect,
    });
    const topRow = frame.rows[0];
    const bottomRow = frame.rows.at(-1);

    expect(bottomRow).toBeDefined();
    expect(bottomRow!.right - bottomRow!.left).toBeLessThan(topRow.right - topRow.left);
    expect(bottomRow!.y).toBeGreaterThan(topRow.y);
  });

  it('uses the Dock icon center as the landing point rather than a compact rect', () => {
    expect(resolveGenieDockPoint(dockRect)).toEqual({
      x: 739,
      y: 841,
    });
  });
});
