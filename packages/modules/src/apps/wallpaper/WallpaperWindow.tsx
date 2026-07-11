'use client';

import { AppFrame, kernelOnDesktopWallpaper, useShellSelector } from '@kernelon/shell';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { ExploreView } from './components/ExploreView';
import { HomeView } from './components/HomeView';
import { PreviewView } from './components/PreviewView';
import { SettingsView } from './components/SettingsView';
import { WallpaperFrostedHeaderControls } from './components/WallpaperFrostedHeaderControls';
import {
  categories,
  heroSlides,
  popularTags,
  recommendationSections,
  wallpaperLibrary,
} from './data';
import { createWallpaperHeader } from './header';
import { wallpaperStyles } from './styles';
import type { CategoryId, ExploreSort, WallpaperAsset, WallpaperView } from './types';

const sortSequence: ExploreSort[] = ['newest', 'liked', 'duration'];

export default function WallpaperWindow() {
  const desktopWallpaper = useShellSelector((state) => state.desktopWallpaper);
  const setDesktopWallpaper = useShellSelector((state) => state.setDesktopWallpaper);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeView, setActiveView] = useState<WallpaperView>('home');
  const [previewWallpaperId, setPreviewWallpaperId] = useState<string | null>(null);
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPopularTag, setSelectedPopularTag] = useState('4K');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('All');
  const [sort, setSort] = useState<ExploreSort>('newest');
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(
    () => new Set(wallpaperLibrary.filter((item) => item.liked).map((item) => item.id)),
  );
  const [selectedWallpaperId, setSelectedWallpaperId] = useState('retrowaves');
  const [isHeroAutoplayEnabled, setIsHeroAutoplayEnabled] = useState(true);
  const [isHeroDetailsVisible, setIsHeroDetailsVisible] = useState(true);
  const [previewFitMode, setPreviewFitMode] = useState<'fill' | 'fit'>('fill');
  const [glassDepth, setGlassDepth] = useState<'deep' | 'soft'>('deep');
  const [headerActionNotice, setHeaderActionNotice] = useState<string | null>(null);

  const assetById = useMemo(
    () => new Map(wallpaperLibrary.map((wallpaper) => [wallpaper.id, wallpaper])),
    [],
  );
  const selectedWallpaper = assetById.get(selectedWallpaperId) ?? wallpaperLibrary[0]!;
  const previewWallpaper = previewWallpaperId ? assetById.get(previewWallpaperId) : null;
  const activeWallpaper = previewWallpaper ?? selectedWallpaper;
  const displayedView = previewWallpaper ? 'preview' : activeView;
  const wallpaperHeader = useMemo(() => createWallpaperHeader(displayedView), [displayedView]);
  const headerGlassBackdropImage =
    (previewWallpaper
      ? resolveWallpaperImage(previewWallpaper)
      : activeView === 'home'
        ? heroSlides[heroIndex]?.image
        : desktopWallpaper) ?? desktopWallpaper;
  const wallpaperRootStyle = useMemo(
    () =>
      ({
        '--wallpaper-desktop-bg': `url(${desktopWallpaper})`,
      }) as CSSProperties & Record<'--wallpaper-desktop-bg', string>,
    [desktopWallpaper],
  );

  const switchView = useCallback((nextView: WallpaperView) => {
    setPreviewWallpaperId(null);
    setIsHeaderSearchOpen(false);
    setActiveView(nextView);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewWallpaperId(null);
    setIsHeaderSearchOpen(false);
  }, []);

  const openSettings = useCallback(() => {
    switchView('settings');
  }, [switchView]);

  const visibleExploreWallpapers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredWallpapers = wallpaperLibrary.filter((wallpaper) => {
      const matchesCategory = selectedCategory === 'All' || wallpaper.category === selectedCategory;
      const matchesPopularTag = !selectedPopularTag || wallpaper.tags.includes(selectedPopularTag);
      const matchesSearch =
        !normalizedQuery ||
        `${wallpaper.title} ${wallpaper.author} ${wallpaper.category} ${wallpaper.tags.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesPopularTag && matchesSearch;
    });

    return filteredWallpapers.sort((left, right) => compareWallpapers(left, right, sort));
  }, [query, selectedCategory, selectedPopularTag, sort]);

  const resultLabel =
    visibleExploreWallpapers.length === wallpaperLibrary.length
      ? '共 2,523 张壁纸'
      : `${visibleExploreWallpapers.length} / 2,523 张壁纸`;

  const selectHeroByIndex = useCallback((index: number) => {
    const normalizedIndex = normalizeIndex(index, heroSlides.length);

    setHeroIndex(normalizedIndex);
    setSelectedWallpaperId(heroSlides[normalizedIndex]?.id ?? 'retrowaves');
  }, []);

  const selectHeroByDirection = useCallback(
    (direction: 1 | -1) => {
      const nextIndex = normalizeIndex(heroIndex + direction, heroSlides.length);

      setHeroIndex(nextIndex);
      setSelectedWallpaperId(heroSlides[nextIndex]?.id ?? 'retrowaves');
    },
    [heroIndex],
  );

  useEffect(() => {
    if (activeView !== 'home' || !isHeroAutoplayEnabled) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      selectHeroByDirection(1);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [activeView, isHeroAutoplayEnabled, selectHeroByDirection]);

  const previewWallpaperById = useCallback((wallpaperId: string) => {
    setSelectedWallpaperId(wallpaperId);
    setPreviewWallpaperId(wallpaperId);
    setIsHeaderSearchOpen(false);
  }, []);

  const applyWallpaper = useCallback(
    (wallpaperId: string) => {
      const wallpaper = assetById.get(wallpaperId);

      if (!wallpaper) {
        return;
      }

      const nextWallpaper = resolveWallpaperImage(wallpaper);

      setDesktopWallpaper(nextWallpaper);
      setSelectedWallpaperId(wallpaper.id);
    },
    [assetById, setDesktopWallpaper],
  );

  const toggleLike = useCallback((wallpaperId: string) => {
    setLikedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(wallpaperId)) {
        nextIds.delete(wallpaperId);
      } else {
        nextIds.add(wallpaperId);
      }

      return nextIds;
    });
  }, []);

  const cycleSort = useCallback(() => {
    setSort((currentSort) => {
      const currentIndex = sortSequence.indexOf(currentSort);

      return sortSequence[normalizeIndex(currentIndex + 1, sortSequence.length)];
    });
  }, []);

  const showHeaderActionNotice = useCallback((message: string) => {
    setHeaderActionNotice(message);
  }, []);

  const showLicense = useCallback(() => {
    showHeaderActionNotice(
      `“${activeWallpaper.title}”由 ${activeWallpaper.author} 提供，请在使用前核对原作者许可。`,
    );
  }, [activeWallpaper.author, activeWallpaper.title, showHeaderActionNotice]);

  const shareWallpaper = useCallback(() => {
    const shareText = `${activeWallpaper.title} · ${activeWallpaper.author}\n${window.location.href}`;

    if (!navigator.clipboard) {
      showHeaderActionNotice('当前环境不支持剪贴板，请手动复制浏览器地址。');
      return;
    }

    void navigator.clipboard.writeText(shareText).then(
      () => showHeaderActionNotice('壁纸分享信息已复制到剪贴板。'),
      () => showHeaderActionNotice('浏览器未允许访问剪贴板，请检查站点权限。'),
    );
  }, [activeWallpaper.author, activeWallpaper.title, showHeaderActionNotice]);

  useEffect(() => {
    if (!headerActionNotice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setHeaderActionNotice(null), 3200);

    return () => window.clearTimeout(timer);
  }, [headerActionNotice]);

  return (
    <WallpaperFrostedHeaderControls
      activeView={displayedView}
      glassBackdropImage={headerGlassBackdropImage}
      isSearchOpen={isHeaderSearchOpen}
      onBack={closePreview}
      onLicense={showLicense}
      onSearchChange={setQuery}
      onSearchOpenChange={setIsHeaderSearchOpen}
      onShare={shareWallpaper}
      onSettings={openSettings}
      onViewChange={switchView}
      searchQuery={query}
    >
      {(headerSlots) => (
        <AppFrame header={wallpaperHeader} headerSlots={headerSlots} scroll="hidden">
          <div
            className={`wallpaper-ux wallpaper-ux--${displayedView}`}
            data-wallpaper-active-view={displayedView}
            data-wallpaper-app="true"
            data-wallpaper-glass-depth={glassDepth}
            data-wallpaper-preview-fit={previewFitMode}
            style={wallpaperRootStyle}
          >
            <style>{wallpaperStyles}</style>
            {headerActionNotice ? (
              <div className="wallpaper-header-action-notice" role="status">
                {headerActionNotice}
              </div>
            ) : null}
            {previewWallpaper ? (
              <PreviewView
                isApplied={desktopWallpaper === resolveWallpaperImage(previewWallpaper)}
                isLiked={likedIds.has(previewWallpaper.id)}
                onApply={applyWallpaper}
                onLike={toggleLike}
                wallpaper={previewWallpaper}
                wallpaperImage={resolveWallpaperImage(previewWallpaper)}
              />
            ) : null}
            {!previewWallpaper && activeView === 'home' ? (
              <HomeView
                heroIndex={heroIndex}
                likedIds={likedIds}
                onHeroDotSelect={selectHeroByIndex}
                onHeroNav={selectHeroByDirection}
                onLike={toggleLike}
                onPreview={previewWallpaperById}
                onRecommendationPreview={previewWallpaperById}
                recommendationSections={recommendationSections}
                selectedRecommendedId={selectedWallpaperId}
                showHeroDetails={isHeroDetailsVisible}
                slides={heroSlides}
              />
            ) : null}
            {!previewWallpaper && activeView === 'explore' ? (
              <ExploreView
                categories={categories}
                likedIds={likedIds}
                onCategoryChange={setSelectedCategory}
                onLike={toggleLike}
                onPopularTagChange={setSelectedPopularTag}
                onQueryChange={setQuery}
                onSelectWallpaper={previewWallpaperById}
                onSortCycle={cycleSort}
                popularTags={popularTags}
                query={query}
                resultLabel={resultLabel}
                searchInputRef={searchInputRef}
                selectedCategory={selectedCategory}
                selectedPopularTag={selectedPopularTag}
                selectedWallpaperId={selectedWallpaperId}
                sort={sort}
                wallpapers={visibleExploreWallpapers}
              />
            ) : null}
            {!previewWallpaper && activeView === 'settings' ? (
              <SettingsView
                glassDepth={glassDepth}
                isHeroAutoplayEnabled={isHeroAutoplayEnabled}
                isHeroDetailsVisible={isHeroDetailsVisible}
                onToggleGlassDepth={() =>
                  setGlassDepth((currentDepth) => (currentDepth === 'deep' ? 'soft' : 'deep'))
                }
                onToggleHeroAutoplay={() =>
                  setIsHeroAutoplayEnabled((currentValue) => !currentValue)
                }
                onToggleHeroDetails={() => setIsHeroDetailsVisible((currentValue) => !currentValue)}
                onTogglePreviewFit={() =>
                  setPreviewFitMode((currentMode) => (currentMode === 'fit' ? 'fill' : 'fit'))
                }
                previewFitMode={previewFitMode}
                selectedWallpaper={selectedWallpaper}
              />
            ) : null}
          </div>
        </AppFrame>
      )}
    </WallpaperFrostedHeaderControls>
  );
}

function compareWallpapers(left: WallpaperAsset, right: WallpaperAsset, sort: ExploreSort): number {
  if (sort === 'liked') {
    return right.likes - left.likes;
  }

  if (sort === 'duration') {
    return right.durationSeconds - left.durationSeconds;
  }

  return Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt);
}

function normalizeIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return (index + total) % total;
}

function resolveWallpaperImage(wallpaper: WallpaperAsset): string {
  return wallpaper.image || kernelOnDesktopWallpaper;
}
