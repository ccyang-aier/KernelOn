import { describe, expect, it } from 'vitest';

import { HeroFrostedAction } from '../src/apps/wallpaper/components/HeroFrostedAction';
import { HomeView } from '../src/apps/wallpaper/components/HomeView';
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

  it('places Home carousel pagination near the lower hero edge', () => {
    expect(wallpaperStyles).toContain('bottom: clamp(30px, 5vh, 56px);');
  });

  it('defines a persistent sliding segment indicator for top navigation', () => {
    const headerSource = WallpaperFrostedHeaderControls.toString();

    expect(wallpaperStyles).toContain('.wallpaper-frosted-segment__indicator');
    expect(wallpaperStyles).toContain('transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);');
    expect(wallpaperStyles).not.toContain('@keyframes wallpaperSegmentTouchBounce');
    expect(headerSource).not.toContain('key={segmentView}');
  });

  it('keeps carousel card labels hover-only and aligned to the frosted control style', () => {
    expect(wallpaperStyles).not.toContain(
      '.wallpaper-carousel-card.is-selected .wallpaper-card-glass-label',
    );
    expect(wallpaperStyles).not.toContain(
      '.wallpaper-explore-card.is-selected .wallpaper-explore-card__view',
    );
    expect(wallpaperStyles).toContain('.wallpaper-carousel-card:hover .wallpaper-card-glass-label');
    expect(wallpaperStyles).toContain('backdrop-filter: blur(2px) saturate(1.02);');
  });

  it('defines the expanding header search state without switching views', () => {
    expect(wallpaperStyles).toContain('.wallpaper-frosted-search');
    expect(wallpaperStyles).toContain('header:has(.wallpaper-frosted-search[data-wallpaper-search-open="true"])');
    expect(wallpaperStyles).not.toContain('filter: blur(8px);');
  });

  it('supports pointer swipes on the Home carousel hero', () => {
    const homeSource = HomeView.toString();

    expect(homeSource).toContain('onPointerDown');
    expect(homeSource).toContain('onPointerUp');
  });

  it('renders a dedicated animated search control in the wallpaper header', () => {
    const headerSource = WallpaperFrostedHeaderControls.toString();

    expect(headerSource).toContain('wallpaper-frosted-search');
    expect(headerSource).toContain('onSearchOpenChange');
  });

  it('does not keep right-side wallpaper header toast logic', () => {
    expect(wallpaperStyles).not.toContain('.wallpaper-toast');
  });

  it('locks Explore cards to consistent media and info regions', () => {
    expect(wallpaperStyles).toContain('grid-template-rows: minmax(0, 1fr) 122px;');
    expect(wallpaperStyles).toContain('height: clamp(328px, 28vw, 430px);');
    expect(wallpaperStyles).toContain('height: 122px;');
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
