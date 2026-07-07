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
});
