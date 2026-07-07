import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LiquidGlassStudioSurface } from '../src/components/liquid-glass-studio/LiquidGlassStudioSurface';

describe('LiquidGlassStudioSurface', () => {
  it('exports a production surface component', () => {
    expect(typeof LiquidGlassStudioSurface).toBe('function');
    expect(LiquidGlassStudioSurface.name).toBe('LiquidGlassStudioSurface');
  });

  it('server-renders an accessible DOM content layer with a CSS fallback surface', () => {
    const markup = renderToStaticMarkup(
      <LiquidGlassStudioSurface
        backgroundHostRef={{ current: null }}
        backgroundImage="/kernelon-assets/wallpapers/kernelon-flower-wallpaper.png"
        height={42}
        radius={999}
        width={190}
      >
        <button type="button">View Wallpaper</button>
      </LiquidGlassStudioSurface>,
    );

    expect(markup).toContain('data-slot="liquid-glass-studio-surface"');
    expect(markup).toContain('data-render-mode="fallback"');
    expect(markup).toContain('width:190px');
    expect(markup).toContain('height:42px');
    expect(markup).toContain('border-radius:999px');
    expect(markup).toContain('data-slot="liquid-glass-studio-surface-canvas"');
    expect(markup).toContain('data-slot="liquid-glass-studio-surface-fallback"');
    expect(markup).toContain('data-slot="liquid-glass-studio-surface-content"');
    expect(markup).toContain('<button type="button">View Wallpaper</button>');
  });
});
