import { describe, expect, it } from 'vitest';

import { LiquidGlassReact } from '../src';

describe('LiquidGlassReact', () => {
  it('is exported from the global UI package', () => {
    expect(typeof LiquidGlassReact).toBe('function');
  });
});
