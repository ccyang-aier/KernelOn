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
import type { CategoryId, ExploreSort, WallpaperAsset, WallpaperView, WallpaperSource } from './types';

const sortSequence: ExploreSort[] = ['newest', 'liked', 'duration'];

const defaultSources: WallpaperSource[] = [
  {
    id: 'system',
    name: '系统内置壁纸库',
    url: 'local://system-library',
    enabled: true,
    isSystem: true,
    description: 'KernelOn 系统精选的高清静态与动态壁纸。',
  },
  {
    id: 'unsplash',
    name: 'Unsplash 精选源',
    url: 'https://api.unsplash.com/photos',
    enabled: true,
    isSystem: false,
    description: '源自全球创作者的高质量免版权图片库。',
  },
  {
    id: 'wallhaven',
    name: 'Wallhaven 动态站',
    url: 'https://wallhaven.cc/api/v1',
    enabled: false,
    isSystem: false,
    description: '知名的壁纸分享社区，提供丰富的二次元及创意视觉作品。',
  },
];

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

  const [customWallpapers, setCustomWallpapers] = useState<WallpaperAsset[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kernelon_custom_wallpapers');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [sources, setSources] = useState<WallpaperSource[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kernelon_wallpaper_sources');
      return saved ? JSON.parse(saved) : defaultSources;
    }
    return defaultSources;
  });

  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kernelon_liked_wallpaper_ids');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    }
    return new Set(wallpaperLibrary.filter((item) => item.liked).map((item) => item.id));
  });

  const allWallpapers = useMemo(() => {
    return [...wallpaperLibrary, ...customWallpapers];
  }, [customWallpapers]);

  useEffect(() => {
    localStorage.setItem('kernelon_custom_wallpapers', JSON.stringify(customWallpapers));
  }, [customWallpapers]);

  useEffect(() => {
    localStorage.setItem('kernelon_wallpaper_sources', JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    localStorage.setItem('kernelon_liked_wallpaper_ids', JSON.stringify(Array.from(likedIds)));
  }, [likedIds]);

  const [selectedWallpaperId, setSelectedWallpaperId] = useState('retrowaves');
  const [isHeroAutoplayEnabled] = useState(true);
  const [isHeroDetailsVisible] = useState(true);
  const [previewFitMode] = useState<'fill' | 'fit'>('fill');
  const [glassDepth] = useState<'deep' | 'soft'>('deep');
  const [headerActionNotice, setHeaderActionNotice] = useState<string | null>(null);

  const assetById = useMemo(
    () => new Map(allWallpapers.map((wallpaper) => [wallpaper.id, wallpaper])),
    [allWallpapers],
  );
  const selectedWallpaper = assetById.get(selectedWallpaperId) ?? allWallpapers[0]!;

  const previewWallpaper = previewWallpaperId ? assetById.get(previewWallpaperId) : null;
  const activeWallpaper = previewWallpaper ?? selectedWallpaper;
  const displayedView = previewWallpaper ? 'preview' : activeView;
  const wallpaperHeader = useMemo(() => createWallpaperHeader(displayedView), [displayedView]);
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
    const filteredWallpapers = allWallpapers.filter((wallpaper) => {
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
  }, [allWallpapers, query, selectedCategory, selectedPopularTag, sort]);

  const resultLabel =
    visibleExploreWallpapers.length === allWallpapers.length
      ? `共 ${allWallpapers.length} 张壁纸`
      : `${visibleExploreWallpapers.length} / ${allWallpapers.length} 张壁纸`;

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

  const handleUploadWallpaper = useCallback((wallpaper: WallpaperAsset) => {
    setCustomWallpapers((prev) => [wallpaper, ...prev]);
  }, []);

  const handleDeleteUploadedWallpaper = useCallback((wallpaperId: string) => {
    setCustomWallpapers((prev) => prev.filter((w) => w.id !== wallpaperId));
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.delete(wallpaperId);
      return next;
    });
    setSelectedWallpaperId((currentId) => currentId === wallpaperId ? 'retrowaves' : currentId);
  }, []);

  const handleToggleSource = useCallback((sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, enabled: !s.enabled } : s)),
    );
  }, []);

  const handleAddSource = useCallback((newSource: WallpaperSource) => {
    setSources((prev) => [...prev, newSource]);
  }, []);

  const handleRemoveSource = useCallback((sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
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
                allWallpapers={allWallpapers}
                customWallpapers={customWallpapers}
                likedIds={likedIds}
                sources={sources}
                selectedWallpaperId={selectedWallpaperId}
                onLike={toggleLike}
                onApply={applyWallpaper}
                onUploadWallpaper={handleUploadWallpaper}
                onDeleteUploadedWallpaper={handleDeleteUploadedWallpaper}
                onToggleSource={handleToggleSource}
                onAddSource={handleAddSource}
                onRemoveSource={handleRemoveSource}
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
