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

  it('does not paint custom material backgrounds onto liquid glass warp layers', () => {
    expect(wallpaperStyles).not.toContain('[data-kernelon-app-header-liquid-segment="true"] .glass__warp');
    expect(wallpaperStyles).not.toContain('[data-kernelon-app-header-liquid-button="true"] .glass__warp');
    expect(wallpaperStyles).not.toContain('.wallpaper-home__glass-action .glass__warp');
  });
});
