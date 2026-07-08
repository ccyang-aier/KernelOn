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
    expect(wallpaperStyles).not.toContain('[data-kernelon-app-header-liquid-button="true"] button::before');
    expect(wallpaperStyles).not.toContain('[data-kernelon-app-header-segment-group="true"]::before');
    expect(wallpaperStyles).not.toContain('[data-kernelon-app-header-segment-active-indicator="true"]');
    expect(wallpaperStyles).not.toContain('.wallpaper-home__glass-action .glass__warp');
    expect(wallpaperStyles).not.toContain('.wallpaper-home__glass-button::before');
  });

  it('keeps the studio segment free of custom active glass layers', () => {
    expect(wallpaperStyles).toContain('.wallpaper-studio-glass-segment-surface {');
    expect(wallpaperStyles).not.toContain('.wallpaper-studio-glass-segment-button-surface');
    expect(wallpaperStyles).not.toContain('.wallpaper-studio-glass-segment__indicator');
    expect(wallpaperStyles).not.toContain('backdrop-filter: blur(12px) saturate(1.18);');
    expect(wallpaperStyles).not.toContain('inset 0 8px 14px rgba(255, 255, 255, 0.1)');
  });

  it('defines preview header placement and preview entrance motion', () => {
    expect(wallpaperStyles).toContain('header[data-app-header-preset="browser"]');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewImageIn');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewContentIn');
    expect(wallpaperStyles).not.toContain('.wallpaper-preview__back');
  });
});
