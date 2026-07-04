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
        内容
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
    expect(markup).toContain('内容');
  });
});
