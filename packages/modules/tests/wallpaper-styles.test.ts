import { describe, expect, it } from 'vitest';

import { wallpaperStyles } from '../src/apps/wallpaper/styles';

describe('Wallpaper styles', () => {
  it('keeps the Home hero edge transparent and hero actions separated', () => {
    expect(wallpaperStyles).toContain('section[data-app-id="wallpaper"] {\n  background: transparent !important;');
    expect(wallpaperStyles).toContain(
      'section[data-app-id="wallpaper"] > header + div {\n  height: 100%;\n  flex: 1 1 auto;\n  background: transparent !important;'
    );
    expect(wallpaperStyles).toContain('.wallpaper-home {\n');
    expect(wallpaperStyles).toContain('background: transparent;');
    expect(wallpaperStyles).not.toContain('background: #0b0d10;');
    expect(wallpaperStyles).toContain('gap: 24px;');
  });

  it('adds wallpaper-only material tint to liquid glass warp layers', () => {
    expect(wallpaperStyles).toContain(
      'section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-segment="true"] .glass__warp,'
    );
    expect(wallpaperStyles).toContain('.wallpaper-home__glass-action .glass__warp {');
    expect(wallpaperStyles).toContain('linear-gradient(135deg, rgba(255, 255, 255, 0.2)');
    expect(wallpaperStyles).toContain('background-clip: padding-box;');
  });
});
