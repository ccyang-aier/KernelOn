import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LiquidGlassSimple } from '../src';

describe('LiquidGlassSimple', () => {
  it('is exported from the global UI package', () => {
    expect(typeof LiquidGlassSimple).toBe('function');
    expect(LiquidGlassSimple.name).toBe('LiquidGlassSimple');
  });

  it('renders the glass layers with a stable caller-provided filter id', () => {
    const markup = renderToStaticMarkup(
      <LiquidGlassSimple filterId="kernelon-glass-test" className="custom-shell">
        content
      </LiquidGlassSimple>,
    );

    expect(markup).toContain('data-slot="liquid-glass-simple"');
    expect(markup).toContain('custom-shell');
    expect(markup).toContain('id="kernelon-glass-test"');
    expect(markup).toContain('filter:url(#kernelon-glass-test)');
    expect(markup).toContain('data-slot="liquid-glass-simple-effect"');
    expect(markup).toContain('data-slot="liquid-glass-simple-tint"');
    expect(markup).toContain('data-slot="liquid-glass-simple-shine"');
    expect(markup).toContain('data-slot="liquid-glass-simple-content"');
    expect(markup).toContain('content');
  });

  it('defaults to the light transparent material used by the reference demo', () => {
    const markup = renderToStaticMarkup(
      <LiquidGlassSimple filterId="kernelon-glass-reference">content</LiquidGlassSimple>,
    );

    expect(markup).toContain('--ko-liquid-glass-blur:3px');
    expect(markup).toContain('--ko-liquid-glass-saturation:100%');
    expect(markup).toContain('--ko-liquid-glass-tint-opacity:0.25');
    expect(markup).toContain('background:rgba(255, 255, 255, var(--ko-liquid-glass-tint-opacity))');
    expect(markup).toContain('baseFrequency="0.01 0.01"');
    expect(markup).toContain(
      '<feGaussianBlur in="turbulence" stdDeviation="3" result="softMap"></feGaussianBlur>',
    );
    expect(markup).toContain('scale="150"');
    expect(markup).toContain(
      'backdrop-filter:blur(var(--ko-liquid-glass-blur)) saturate(var(--ko-liquid-glass-saturation))',
    );
  });
});
