import { describe, expect, it } from 'vitest';

import { HeroFrostedAction } from '../src/apps/wallpaper/components/HeroFrostedAction';
import { WallpaperFrostedHeaderControls } from '../src/apps/wallpaper/components/WallpaperFrostedHeaderControls';
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

  it('does not style existing liquid glass component hooks for wallpaper controls', () => {
    expect(wallpaperStyles).not.toContain('data-kernelon-app-header-liquid');
    expect(wallpaperStyles).not.toContain('glass__warp');
    expect(wallpaperStyles).not.toContain('.wallpaper-home__glass-action .glass');
    expect(wallpaperStyles).not.toContain('wallpaper-home__liquid-action-glass');
  });

  it('defines custom clear frosted controls for wallpaper chrome', () => {
    expect(wallpaperStyles).toContain('.wallpaper-frosted-button');
    expect(wallpaperStyles).toContain('.wallpaper-frosted-segment');
    expect(wallpaperStyles).toContain('.wallpaper-home__frosted-button');
    expect(wallpaperStyles).toContain('backdrop-filter: blur(2px) saturate(1.02);');
  });

  it('uses wallpaper-owned frosted button components', () => {
    expect(HeroFrostedAction.name).toBe('HeroFrostedAction');
    expect(WallpaperFrostedHeaderControls.name).toBe('WallpaperFrostedHeaderControls');
  });

  it('defines preview header placement and preview entrance motion', () => {
    expect(wallpaperStyles).toContain('header[data-app-header-preset="browser"]');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewImageIn');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewContentIn');
    expect(wallpaperStyles).not.toContain('.wallpaper-preview__back');
  });
});
