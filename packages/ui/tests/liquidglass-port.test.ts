import { describe, expect, it } from 'vitest';

import {
  DEFAULTS,
  LiquidGlass,
  createInteractiveGlassPulseConfig,
  invalidateFontEmbedCache,
} from '../src/components/liquidglass';

describe('liquidglass port', () => {
  it('exposes the upstream public API from the isolated component entry', () => {
    expect(typeof LiquidGlass.init).toBe('function');
    expect(typeof invalidateFontEmbedCache).toBe('function');
    expect(DEFAULTS).toMatchObject({
      refraction: 0.69,
      cornerRadius: 65,
      zRadius: 40,
      bevelMode: 0,
    });
  });

  it('provides visibly distinct A/B/C configs for interactive glass pulses', () => {
    const modeA = JSON.parse(createInteractiveGlassPulseConfig(14, 0));
    const modeB = JSON.parse(createInteractiveGlassPulseConfig(14, 1));
    const modeC = JSON.parse(createInteractiveGlassPulseConfig(14, 2));

    expect(modeA).toMatchObject({ blurAmount: 0.25, refraction: 0.69, saturation: 0 });
    expect(modeB).toMatchObject({ blurAmount: 0.52, refraction: 0.96, saturation: 0.18 });
    expect(modeC).toMatchObject({ blurAmount: 0.08, refraction: 0.42, saturation: -0.08 });
  });
});
