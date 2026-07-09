import { describe, expect, it } from 'vitest';

import { DEFAULTS, LiquidGlass, invalidateFontEmbedCache } from '../src/components/liquidglass';

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
});
