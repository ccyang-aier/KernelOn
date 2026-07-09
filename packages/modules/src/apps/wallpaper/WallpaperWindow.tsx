'use client';

import {
  kernelOnDesktopWallpaper,
  useAppHeader,
  useShellSelector,
} from '@kernelon/shell';
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
  const header = useAppHeader();
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
  const [previewFitMode, setPreviewFitMode] = useState<'fill' | 'fit'>('fill');
  const [glassDepth, setGlassDepth] = useState<'deep' | 'soft'>('deep');

  const assetById = useMemo(
    () => new Map(wallpaperLibrary.map((wallpaper) => [wallpaper.id, wallpaper])),
    [],
  );
  const selectedWallpaper = assetById.get(selectedWallpaperId) ?? wallpaperLibrary[0]!;
  const previewWallpaper = previewWallpaperId ? assetById.get(previewWallpaperId) : null;
  const displayedView = previewWallpaper ? 'preview' : activeView;
  const headerGlassBackdrop = previewWallpaper
    ? resolveWallpaperImage(previewWallpaper)
    : activeView === 'home'
      ? (heroSlides[heroIndex]?.image ?? resolveWallpaperImage(selectedWallpaper))
      : desktopWallpaper;
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

  useEffect(() => {
    header.setHeader(createWallpaperHeader(displayedView));
  }, [displayedView, header]);

  useEffect(() => () => header.clearHeader(), [header]);

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

  return (
    <div
      className={`wallpaper-ux wallpaper-ux--${displayedView}`}
      data-wallpaper-active-view={displayedView}
      data-wallpaper-app="true"
      data-wallpaper-glass-depth={glassDepth}
      data-wallpaper-preview-fit={previewFitMode}
      style={wallpaperRootStyle}
    >
      <style>{wallpaperStyles}</style>
      <WallpaperFrostedHeaderControls
        activeView={displayedView}
        glassBackdropImage={headerGlassBackdrop}
        isSearchOpen={isHeaderSearchOpen}
        onBack={closePreview}
        onSearchChange={setQuery}
        onSearchOpenChange={setIsHeaderSearchOpen}
        onSettings={openSettings}
        onViewChange={switchView}
        searchQuery={query}
      />
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
          onToggleGlassDepth={() =>
            setGlassDepth((currentDepth) => (currentDepth === 'deep' ? 'soft' : 'deep'))
          }
          onToggleHeroAutoplay={() => setIsHeroAutoplayEnabled((currentValue) => !currentValue)}
          onTogglePreviewFit={() =>
            setPreviewFitMode((currentMode) => (currentMode === 'fit' ? 'fill' : 'fit'))
          }
          previewFitMode={previewFitMode}
          selectedWallpaperTitle={selectedWallpaper.title}
        />
      ) : null}
    </div>
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
