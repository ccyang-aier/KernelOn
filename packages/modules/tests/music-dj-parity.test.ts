/// <reference types="node" />

import { createRequire } from 'node:module';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildBeatMapFromLowEnergy as buildPortedBeatMap } from '../src/apps/music/mineradio/generated/dj-analyzer';

const require = createRequire(import.meta.url);
const reference = require('../src/apps/music/mineradio/source/dj-analyzer.js') as {
  buildBeatMapFromLowEnergy(
    lowEnergy: Float32Array,
    hitEnergy: Float32Array,
    hopSec: number,
    durationSec: number,
  ): unknown;
};

describe('Mineradio DJ analyzer parity', () => {
  afterEach(() => vi.useRealTimers());

  it('produces a byte-for-byte equivalent map for a deterministic energy fixture', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T00:00:00.000Z'));
    const lowEnergy = new Float32Array(8_000);
    const hitEnergy = new Float32Array(8_000);

    for (let frame = 0; frame < lowEnergy.length; frame += 1) {
      const phase = frame % 50;
      const pulse = phase === 0 ? 0.92 : phase < 4 ? 0.22 / phase : 0;
      lowEnergy[frame] = 0.025 + Math.sin(frame / 37) * 0.006 + pulse;
      hitEnergy[frame] = 0.018 + Math.cos(frame / 19) * 0.004 + pulse * 0.72;
    }

    const expected = reference.buildBeatMapFromLowEnergy(lowEnergy, hitEnergy, 0.01, 80);
    const actual = buildPortedBeatMap(lowEnergy, hitEnergy, 0.01, 80);

    expect(actual).toEqual(expected);
  });

  it('preserves the exact short-input fallback', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T00:00:00.000Z'));
    const lowEnergy = new Float32Array([0.1, 0.2]);
    const hitEnergy = new Float32Array([0.05, 0.1]);

    expect(buildPortedBeatMap(lowEnergy, hitEnergy, 0.01, 0)).toEqual(
      reference.buildBeatMapFromLowEnergy(lowEnergy, hitEnergy, 0.01, 0),
    );
  });
});
