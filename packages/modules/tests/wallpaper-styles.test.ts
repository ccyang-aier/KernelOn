import { describe, expect, it } from 'vitest';

import { HeroFrostedAction } from '../src/apps/wallpaper/components/HeroFrostedAction';
import { ExploreView } from '../src/apps/wallpaper/components/ExploreView';
import { HomeView } from '../src/apps/wallpaper/components/HomeView';
import { LockScreenSetup } from '../src/apps/wallpaper/components/LockScreenSetup';
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
      'section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header + [data-app-frame-content] {\n  height: 100%;\n  flex: 1 1 auto;\n  background: transparent !important;',
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
    expect(wallpaperStyles).not.toContain('data-testid^="kernelon-app-header');
  });

  it('defines one shared frosted material core for wallpaper controls', () => {
    expect(wallpaperStyles).toContain('.wallpaper-frosted-surface');
    expect(wallpaperStyles).toContain('--wallpaper-frosted-border: rgba(218, 238, 255, 0.3);');
    expect(wallpaperStyles).toContain('border: 1px solid var(--wallpaper-frosted-border);');
    expect(wallpaperStyles).toContain('--wallpaper-frosted-backdrop: blur(2px) saturate(1.02);');
    expect(wallpaperStyles).toContain('.wallpaper-frosted-segment');
    expect(wallpaperStyles).toContain('.wallpaper-home__frosted-button');
    expect(wallpaperStyles).toContain('backdrop-filter: var(--wallpaper-frosted-backdrop);');
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
    expect(wallpaperStyles).toContain('--wallpaper-frosted-backdrop: blur(2px) saturate(1.02);');
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

    expect(wallpaperStyles).toContain('grid-template-rows: minmax(0, 1fr) 72px;');
    expect(wallpaperStyles).toContain('height: clamp(224px, 18vw, 290px);');
    expect(wallpaperStyles).toContain('height: 72px;');
    expect(wallpaperStyles).toContain('background-size: 300% 100%;');
    expect(wallpaperStyles).toContain('background-position: 0 0;');
    expect(wallpaperStyles).not.toContain('skewX(-14deg)');
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

  it('uses a transparent frosted glass surface for the Explore page', () => {
    expect(wallpaperStyles).toContain('.wallpaper-ux--explore {');
    expect(wallpaperStyles).toContain('background: rgba(7, 14, 18, 0.18);');
    expect(wallpaperStyles).toContain('filter: blur(22px) saturate(1.28) brightness(0.94);');
    expect(wallpaperStyles).toContain('rgba(13, 29, 35, 0.23);');
    expect(wallpaperStyles).toContain(
      'backdrop-filter: blur(38px) saturate(1.32) brightness(1.08);',
    );
  });

  it('uses wallpaper-owned frosted button components', () => {
    expect(HeroFrostedAction.name).toBe('HeroFrostedAction');
    expect(WallpaperFrostedHeaderControls.name).toBe('WallpaperFrostedHeaderControls');
  });

  it('uses the documented CSS frosted action recipe for all four actions', () => {
    const headerSource = WallpaperFrostedHeaderControls.toString();
    const heroSource = HeroFrostedAction.toString();

    expect(headerSource).toContain('wallpaper-frosted-button--action');
    expect(heroSource).toContain('wallpaper-home__frosted-button');
    expect(wallpaperStyles).toContain('wallpaper-frosted-surface');
    expect(wallpaperStyles).toContain('border: 1px solid var(--wallpaper-frosted-border)');
    expect(wallpaperStyles).toContain('--wallpaper-frosted-backdrop: blur(2px) saturate(1.02)');
    expect(wallpaperStyles).toContain('0 6px 14px rgba(0, 0, 0, 0.05)');
    expect(headerSource).toContain('type: "button"');
    expect(heroSource).toContain('type: "button"');
  });

  it('builds Settings as unified glass board with sidebar', () => {
    const settingsSource = SettingsView.toString();

    expect(settingsSource).toContain('wallpaper-settings-board');
    expect(settingsSource).toContain('wallpaper-settings-sidebar');
    expect(settingsSource).toContain('我的收藏');
    expect(wallpaperStyles).toContain('.wallpaper-settings-board {');
    expect(wallpaperStyles).toContain('grid-template-columns: 220px 1fr;');
    expect(wallpaperStyles).toContain('background: rgba(45, 212, 191, 0.13);');
  });

  it('builds the key action as a current-wallpaper lock-screen workflow', () => {
    const lockScreenSource = LockScreenSetup.toString();
    const headerSource = WallpaperFrostedHeaderControls.toString();

    expect(headerSource).toContain('设置锁屏');
    expect(lockScreenSource).toContain('应用锁屏');
    expect(lockScreenSource).not.toContain('确认密码');
    expect(lockScreenSource).not.toContain('稍后设置');
    expect(lockScreenSource).toContain('/kernelon-assets/avatars/current-user.png');
    expect(wallpaperStyles).toContain('.wallpaper-lock-screen__background');
    expect(wallpaperStyles).toContain('@keyframes wallpaperLockPanelIn');
  });

  it('defines preview header placement and preview entrance motion', () => {
    expect(wallpaperStyles).toContain('header[data-app-header-preset="browser"]');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewImageIn');
    expect(wallpaperStyles).toContain('@keyframes wallpaperPreviewContentIn');
    expect(wallpaperStyles).not.toContain('.wallpaper-preview__back');
  });
});
