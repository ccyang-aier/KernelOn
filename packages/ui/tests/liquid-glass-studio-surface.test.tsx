import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  computeLiquidGlassStudioBackgroundSample,
  LiquidGlassStudioSurface,
} from '../src/components/liquid-glass-studio/LiquidGlassStudioSurface';

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
    expect(markup).not.toContain('data-slot="liquid-glass-studio-surface-rim"');
    expect(markup).not.toContain('backdrop-filter');
    expect(markup).toContain('data-slot="liquid-glass-studio-surface-content"');
    expect(markup).toContain('<button type="button">View Wallpaper</button>');
  });

  it('changes the texture sample when the background host moves during scroll', () => {
    const beforeScroll = computeLiquidGlassStudioBackgroundSample(
      createRect({ height: 42, top: 32, width: 96 }),
      createRect({ height: 520, top: 0, width: 1280 }),
    );
    const afterScroll = computeLiquidGlassStudioBackgroundSample(
      createRect({ height: 42, top: 32, width: 96 }),
      createRect({ height: 520, top: -180, width: 1280 }),
    );

    expect(afterScroll.offset[1]).toBeLessThan(beforeScroll.offset[1]);
  });

  it('accepts an explicit scroll container for dynamic background sampling', () => {
    const markup = renderToStaticMarkup(
      <LiquidGlassStudioSurface
        backgroundHostRef={{ current: null }}
        backgroundImage="/kernelon-assets/wallpapers/kernelon-flower-wallpaper.png"
        backgroundScrollRef={{ current: null }}
        height={42}
        radius={999}
        width={190}
      >
        <button type="button">View Wallpaper</button>
      </LiquidGlassStudioSurface>,
    );

    expect(markup).toContain('data-slot="liquid-glass-studio-surface"');
  });
});

function createRect({
  height,
  left = 0,
  top,
  width,
}: {
  height: number;
  left?: number;
  top: number;
  width: number;
}) {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}
