import { describe, expect, it } from 'vitest';

import {
  flattenGenieSnapshotPixels,
  type GenieSnapshotMatte,
} from '../src/components/genie-snapshot-compositor';

const matte: GenieSnapshotMatte = { b: 252, g: 250, r: 246 };

describe('genie snapshot compositor', () => {
  it('makes translucent window interior pixels opaque without filling transparent corners', () => {
    const pixels = new Uint8ClampedArray([
      20, 30, 40, 0,
      120, 160, 220, 224,
      80, 90, 100, 72,
    ]);

    const flattened = flattenGenieSnapshotPixels(pixels, matte);

    expect([...flattened.slice(0, 4)]).toEqual([20, 30, 40, 0]);
    expect(flattened[4]).toBe(135);
    expect(flattened[5]).toBe(171);
    expect(flattened[6]).toBe(224);
    expect(flattened[7]).toBe(255);
    expect([...flattened.slice(8, 12)]).toEqual([80, 90, 100, 72]);
    expect([...pixels.slice(4, 8)]).toEqual([120, 160, 220, 224]);
  });
});
