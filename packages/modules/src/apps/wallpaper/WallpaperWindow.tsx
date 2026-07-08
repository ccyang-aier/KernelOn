'use client';

import {
  kernelOnDesktopWallpaper,
  useAppHeader,
  useShellSelector,
  type AppHeaderCommandPayload,
} from '@kernelon/shell';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { ExploreView } from './components/ExploreView';
import { HomeView } from './components/HomeView';
import { PreviewView } from './components/PreviewView';
import { SettingsView } from './components/SettingsView';
import {
  categories,
  heroSlides,
  popularTags,
  recommendationSections,
  wallpaperLibrary,
} from './data';
import { createWallpaperHeader, isWallpaperView } from './header';
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
  const [toast, setToast] = useState('');

  const assetById = useMemo(
    () => new Map(wallpaperLibrary.map((wallpaper) => [wallpaper.id, wallpaper])),
    [],
  );
  const selectedWallpaper = assetById.get(selectedWallpaperId) ?? wallpaperLibrary[0]!;
  const previewWallpaper = previewWallpaperId ? assetById.get(previewWallpaperId) : null;
  const displayedView = previewWallpaper ? 'preview' : activeView;
  const wallpaperRootStyle = useMemo(
    () =>
      ({
        '--wallpaper-desktop-bg': `url(${desktopWallpaper})`,
      }) as CSSProperties & Record<'--wallpaper-desktop-bg', string>,
    [desktopWallpaper],
  );

  const switchView = useCallback((nextView: WallpaperView) => {
    setPreviewWallpaperId(null);
    setActiveView(nextView);
  }, []);

  const focusExploreSearch = useCallback(() => {
    switchView('explore');
    window.setTimeout(() => searchInputRef.current?.focus(), 90);
  }, [switchView]);

  const closePreview = useCallback(() => {
    setPreviewWallpaperId(null);
  }, []);

  useEffect(() => {
    header.setHeader(createWallpaperHeader(displayedView));
  }, [displayedView, header]);

  useEffect(() => () => header.clearHeader(), [header]);

  useEffect(() => {
    const unregisterView = header.registerCommand(
      'wallpaper.view',
      (payload: AppHeaderCommandPayload) => {
        if (isWallpaperView(payload.value)) {
          switchView(payload.value);
        }
      },
    );
    const unregisterBack = header.registerCommand('wallpaper.back', closePreview);
    const unregisterSearch = header.registerCommand('wallpaper.focus-search', focusExploreSearch);
    const unregisterLicense = header.registerCommand('wallpaper.license', () =>
      setToast('Wallpaper license key is active.'),
    );
    const unregisterShare = header.registerCommand('wallpaper.share', () =>
      setToast(`Share link copied for ${selectedWallpaper.title}.`),
    );
    const unregisterSettings = header.registerCommand('wallpaper.settings', () =>
      switchView('settings'),
    );

    return () => {
      unregisterBack();
      unregisterView();
      unregisterSearch();
      unregisterLicense();
      unregisterShare();
      unregisterSettings();
    };
  }, [closePreview, focusExploreSearch, header, selectedWallpaper.title, switchView]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 2600);

    return () => window.clearTimeout(timer);
  }, [toast]);

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
      ? '2.523 wallpapers'
      : `${visibleExploreWallpapers.length} of 2.523 wallpapers`;

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
      setToast(`${wallpaper.title} applied to KernelOn desktop.`);
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
      {toast ? <div className="wallpaper-toast">{toast}</div> : null}
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
