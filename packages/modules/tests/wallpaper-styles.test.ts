import { describe, expect, it } from 'vitest';

import { HeroFrostedAction } from '../src/apps/wallpaper/components/HeroFrostedAction';
import { ExploreView } from '../src/apps/wallpaper/components/ExploreView';
import { HomeView } from '../src/apps/wallpaper/components/HomeView';
import { SettingsView } from '../src/apps/wallpaper/components/SettingsView';
import { WallpaperFrostedHeaderControls } from '../src/apps/wallpaper/components/WallpaperFrostedHeaderControls';
import { createWallpaperHeader } from '../src/apps/wallpaper/header';
import { wallpaperStyles } from '../src/apps/wallpaper/styles';

describe('Wallpaper styles', () => {
  it('keeps the Home hero edge transparent and hero actions separated', () => {
    expect(wallpaperStyles).toContain(
      'section[data-app-id="wallpaper"] {\n  background: transparent !important;',
    );
    expect(wallpaperStyles).toContain(
      'section[data-app-id="wallpaper"] > header + div {\n  height: 100%;\n  flex: 1 1 auto;\n  background: transparent !important;',
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
    expect(wallpaperStyles).toContain(
      'transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);',
    );
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
    expect(wallpaperStyles).toContain(
      '.wallpaper-frosted-primary[data-wallpaper-search-open="true"]',
    );
    expect(wallpaperStyles).toContain('.wallpaper-frosted-menu-button');
    expect(wallpaperStyles).toContain('width: clamp(250px, 30vw, 380px);');
    expect(wallpaperStyles).toContain(
      '.wallpaper-frosted-navigation[data-wallpaper-search-open="true"]',
    );
    expect(wallpaperStyles).toContain('transition: width 620ms cubic-bezier(0.22, 1, 0.36, 1);');
    expect(wallpaperStyles).not.toContain('filter: blur(8px);');
  });

  it('supports pointer swipes on the Home carousel hero', () => {
    const homeSource = HomeView.toString();

    expect(homeSource).toContain('onPointerDown');
    expect(homeSource).toContain('onPointerMove');
    expect(homeSource).toContain('onPointerUp');
    expect(homeSource).toContain('wallpaperHeroDragging');
    expect(wallpaperStyles).toContain('touch-action: pan-y;');
    expect(wallpaperStyles).toContain('[data-wallpaper-hero-dragging="true"]');
  });

  it('renders a dedicated animated search control in the wallpaper header', () => {
    const headerSource = WallpaperFrostedHeaderControls.toString();

    expect(createWallpaperHeader('home').center).toEqual([
      { id: 'wallpaper-primary-control', type: 'slot' },
    ]);
    expect(createWallpaperHeader('home').leading).toBeUndefined();
    expect(headerSource).toContain('wallpaper-frosted-search');
    expect(headerSource).toContain('wallpaper-frosted-primary');
    expect(headerSource).toContain('wallpaper-frosted-menu-button');
    expect(headerSource).toContain('onSearchOpenChange');
  });

  it('does not keep right-side wallpaper header toast logic', () => {
    expect(wallpaperStyles).not.toContain('.wallpaper-toast');
  });

  it('locks Explore cards to consistent media and info regions', () => {
    const exploreSource = ExploreView.toString();

    expect(wallpaperStyles).toContain('grid-template-rows: minmax(0, 1fr) 78px;');
    expect(wallpaperStyles).toContain('height: clamp(248px, 21vw, 330px);');
    expect(wallpaperStyles).toContain('height: 78px;');
    expect(wallpaperStyles).toContain('.wallpaper-explore-card:hover > img');
    expect(exploreSource).not.toContain('wallpaper-author');
    expect(exploreSource).not.toContain('wallpaper-stats');
    expect(exploreSource).not.toContain('wallpaper.duration');
  });

  it('localizes and softens the Explore filter surface', () => {
    const exploreSource = ExploreView.toString();

    expect(exploreSource).toContain('探索壁纸库');
    expect(exploreSource).toContain('搜索壁纸...');
    expect(exploreSource).toContain('热门：');
    expect(exploreSource).toContain('没有匹配的壁纸');
    expect(exploreSource).not.toContain('Explore Wallpaper Library');
    expect(wallpaperStyles).toContain('width: min(448px, 100%);');
    expect(wallpaperStyles).toContain('height: 30px;');
    expect(wallpaperStyles).toContain('font-weight: 520;');
  });

  it('uses wallpaper-owned frosted button components', () => {
    expect(HeroFrostedAction.name).toBe('HeroFrostedAction');
    expect(WallpaperFrostedHeaderControls.name).toBe('WallpaperFrostedHeaderControls');
  });

  it('keeps header liquid glass buttons on live material instead of a static image copy', () => {
    const headerSource = WallpaperFrostedHeaderControls.toString();

    expect(headerSource).not.toContain('glassBackdropImage');
    expect(wallpaperStyles).toContain('.wallpaper-frosted-button__liquid-material-fill');
    expect(wallpaperStyles).not.toContain('wallpaper-frosted-button__liquid-refract');
  });

  it('builds Settings as preferences plus a current wallpaper preview', () => {
    const settingsSource = SettingsView.toString();

    expect(settingsSource).toContain('wallpaper-settings-layout');
    expect(settingsSource).toContain('wallpaper-settings-current');
    expect(settingsSource).toContain('Wallpaper details');
    expect(wallpaperStyles).toContain('.wallpaper-settings-row');
    expect(wallpaperStyles).toContain(
      'grid-template-columns: minmax(0, 1.32fr) minmax(290px, 0.68fr);',
    );
  });

  it('defines preview header placement and preview entrance motion', () => {
    expect(wallpaperStyles).toContain('header[data-app-header-preset="browser"]');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewImageIn');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewContentIn');
    expect(wallpaperStyles).not.toContain('.wallpaper-preview__back');
  });
});
