import { describe, expect, it } from 'vitest';

import {
  createGenieMeshFrame,
  resolveGenieTargetRect,
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
  it('starts as the window rect and resolves into the dock target rect', () => {
    const start = createGenieMeshFrame({
      columns: 4,
      progress: 0,
      rows: 4,
      sourceRect: windowRect,
      targetRect: dockRect,
    });
    const end = createGenieMeshFrame({
      columns: 4,
      progress: 1,
      rows: 4,
      sourceRect: windowRect,
      targetRect: dockRect,
    });

    expect(start.vertices[0]).toMatchObject({ x: 96, y: 72 });
    expect(start.vertices.at(-1)).toMatchObject({ x: 1056, y: 712 });
    expect(end.vertices[0].x).toBeCloseTo(dockRect.x, 1);
    expect(end.vertices[0].y).toBeCloseTo(dockRect.y, 1);
    expect(end.vertices.at(-1)?.x).toBeCloseTo(dockRect.x + dockRect.width, 1);
    expect(end.vertices.at(-1)?.y).toBeCloseTo(dockRect.y + dockRect.height, 1);
  });

  it('collapses bottom rows toward the Dock before the top rows for the silk-like pull', () => {
    const frame = createGenieMeshFrame({
      columns: 8,
      progress: 0.45,
      rows: 8,
      sourceRect: windowRect,
      targetRect: dockRect,
    });

    expect(frame.rowWidths.at(-1)).toBeLessThan(frame.rowWidths[0]);
    expect(frame.rowCenters.at(-1)?.y).toBeGreaterThan(frame.rowCenters[0].y);
    expect(frame.vertices.some((vertex) => Math.abs(vertex.offsetX) > 0)).toBe(true);
  });

  it('keeps the final target centered on the Dock icon with a compact landing size', () => {
    expect(resolveGenieTargetRect(dockRect)).toEqual({
      height: 44,
      width: 44,
      x: 717,
      y: 819,
    });
  });
});
