'use client';

import {
  AppFrame,
  kernelOnDesktopWallpaper,
  useShellSelector,
  wallpaperPoster as shellWallpaperPoster,
} from '@kernelon/shell';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { ExploreView } from './components/ExploreView';
import { HomeView } from './components/HomeView';
import { LockScreenSetup } from './components/LockScreenSetup';
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
import { WallpaperApi } from './api';
import { toDesktopWallpaper } from './media';
import { wallpaperStyles } from './styles';
import { useKernelOnRuntimeConfig } from '../../runtime-config';
import type {
  CategoryId,
  ExploreSort,
  HeroSlide,
  RecommendedWallpaperSection,
  WallpaperAsset,
  WallpaperView,
  WallpaperSource,
  WallpaperStorageUsage,
} from './types';

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
    id: 'nasa',
    name: 'NASA Image and Video Library',
    url: 'https://images.nasa.gov',
    enabled: true,
    isSystem: false,
    description: 'NASA 官方图片和视频，默认直链播放，不占用服务端媒体存储。',
  },
  {
    id: 'wikimedia',
    name: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org',
    enabled: true,
    isSystem: false,
    description: '仅展示 Public Domain、CC0、CC BY 与 CC BY-SA 许可资源。',
  },
];

export default function WallpaperWindow() {
  const runtime = useKernelOnRuntimeConfig();
  const wallpaperApi = useMemo(() => new WallpaperApi(runtime), [runtime]);
  const desktopWallpaper = useShellSelector((state) => state.desktopWallpaper);
  const setDesktopWallpaper = useShellSelector((state) => state.setDesktopWallpaper);
  const lockDesktop = useShellSelector((state) => state.lockDesktop);
  const disableDesktopLock = useShellSelector((state) => state.disableDesktopLock);
  const desktopLockIdleMinutes = useShellSelector((state) => state.desktopLockIdleMinutes);
  const desktopLockPassword = useShellSelector((state) => state.desktopLockPassword);
  const setDesktopLockIdleMinutes = useShellSelector((state) => state.setDesktopLockIdleMinutes);
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
      return saved
        ? (JSON.parse(saved) as WallpaperAsset[]).filter(
            (asset) => !asset.image.startsWith('blob:'),
          )
        : [];
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

  const [remoteWallpapers, setRemoteWallpapers] = useState<WallpaperAsset[]>([]);
  const [storageUsage, setStorageUsage] = useState<WallpaperStorageUsage | null>(null);
  const [remotePage, setRemotePage] = useState(1);
  const [hasMoreRemote, setHasMoreRemote] = useState(true);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [isLoadingMoreRemote, setIsLoadingMoreRemote] = useState(false);
  const [remoteSearchError, setRemoteSearchError] = useState<string | null>(null);
  const [homePage, setHomePage] = useState(1);
  const [homeHasMore, setHomeHasMore] = useState(true);
  const [isLoadingHomeMore, setIsLoadingHomeMore] = useState(false);

  const allWallpapers = useMemo(() => {
    return [...wallpaperLibrary, ...remoteWallpapers, ...customWallpapers];
  }, [customWallpapers, remoteWallpapers]);

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
  const [isLockScreenOpen, setIsLockScreenOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      wallpaperApi.search('earth space nature abstract', 'video'),
      wallpaperApi.sources(),
      wallpaperApi.current(),
      wallpaperApi.storage(),
    ]).then(([searchResult, sourcesResult, currentResult, storageResult]) => {
      if (cancelled) return;
      if (searchResult.status === 'fulfilled') {
        setRemoteWallpapers(searchResult.value.items.map(normalizeRemoteAsset));
        setHomeHasMore(searchResult.value.items.length >= 30);
        setLikedIds((ids) =>
          new Set([
            ...ids,
            ...searchResult.value.items.filter((asset) => asset.liked).map((asset) => asset.id),
          ]),
        );
      }
      if (sourcesResult.status === 'fulfilled') setSources(sourcesResult.value);
      if (currentResult.status === 'fulfilled' && currentResult.value) {
        const current = normalizeRemoteAsset(currentResult.value);
        setRemoteWallpapers((items) =>
          items.some((item) => item.id === current.id) ? items : [current, ...items],
        );
        setSelectedWallpaperId(current.id);
        setDesktopWallpaper(toDesktopWallpaper(current, runtime.apiBaseUrl));
      }
      if (storageResult.status === 'fulfilled') setStorageUsage(storageResult.value);
    });
    return () => {
      cancelled = true;
    };
  }, [runtime.apiBaseUrl, setDesktopWallpaper, wallpaperApi]);

  const loadMoreHome = useCallback(async () => {
    if (isLoadingHomeMore || !homeHasMore) return;
    setIsLoadingHomeMore(true);
    try {
      const nextPage = homePage + 1;
      const result = await wallpaperApi.search(
        'earth space nature abstract timelapse',
        'video',
        nextPage,
      );
      const assets = result.items.map(normalizeRemoteAsset);
      setRemoteWallpapers((current) => dedupeWallpapers([...current, ...assets]));
      setHomePage(nextPage);
      setHomeHasMore(assets.length >= 30);
    } finally {
      setIsLoadingHomeMore(false);
    }
  }, [homeHasMore, homePage, isLoadingHomeMore, wallpaperApi]);

  const remoteSearchTerm = useMemo(
    () =>
      [
        query.trim(),
        selectedCategory === 'All' ? '' : selectedCategory,
        mapExploreTag(selectedPopularTag),
      ]
        .filter(Boolean)
        .join(' '),
    [query, selectedCategory, selectedPopularTag],
  );

  const loadRemotePage = useCallback(
    async (page: number, reset: boolean) => {
      reset ? setIsSearchingRemote(true) : setIsLoadingMoreRemote(true);
      setRemoteSearchError(null);
      try {
        const result = await wallpaperApi.search(remoteSearchTerm, 'all', page);
        const assets = result.items.map(normalizeRemoteAsset);
        setRemoteWallpapers((current) => dedupeWallpapers(reset ? assets : [...current, ...assets]));
        setRemotePage(page);
        setHasMoreRemote(assets.length >= 30);
      } catch (error) {
        setRemoteSearchError(error instanceof Error ? error.message : '壁纸来源暂时不可用');
      } finally {
        reset ? setIsSearchingRemote(false) : setIsLoadingMoreRemote(false);
      }
    },
    [remoteSearchTerm, wallpaperApi],
  );

  useEffect(() => {
    if (activeView !== 'explore') return undefined;
    const timer = window.setTimeout(() => void loadRemotePage(1, true), 420);
    return () => window.clearTimeout(timer);
  }, [activeView, loadRemotePage]);

  const assetById = useMemo(
    () => new Map(allWallpapers.map((wallpaper) => [wallpaper.id, wallpaper])),
    [allWallpapers],
  );
  const selectedWallpaper = assetById.get(selectedWallpaperId) ?? allWallpapers[0]!;

  const homeSlides = useMemo<HeroSlide[]>(() => {
    const videos = remoteWallpapers.filter((asset) => asset.mediaType === 'video');
    return videos.length ? videos.slice(0, 10).map(toHeroSlide) : heroSlides;
  }, [remoteWallpapers]);
  const homeRecommendations = useMemo<RecommendedWallpaperSection[]>(() => {
    if (!remoteWallpapers.length) return recommendationSections;
    return [
      {
        id: 'live-providers',
        title: '动态壁纸优先推荐',
        items: remoteWallpapers.slice(0, 12).map((asset) => ({
          id: `recommended-${asset.id}`,
          title: asset.title,
          device: asset.device,
          image: asset.posterUrl || asset.image,
          sourceWallpaperId: asset.id,
        })),
      },
    ];
  }, [remoteWallpapers]);

  const previewWallpaper = previewWallpaperId ? assetById.get(previewWallpaperId) : null;
  const activeWallpaper = previewWallpaper ?? selectedWallpaper;
  const displayedView = previewWallpaper ? 'preview' : activeView;
  const wallpaperHeader = useMemo(
    () => createWallpaperHeader(isLockScreenOpen ? 'lock' : displayedView),
    [displayedView, isLockScreenOpen],
  );
  const wallpaperRootStyle = useMemo(
    () =>
      ({
        '--wallpaper-desktop-bg': `url(${shellWallpaperPoster(desktopWallpaper)})`,
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
      const isRemote = Boolean(wallpaper.provider && wallpaper.provider !== 'system');
      const matchesCategory =
        isRemote || selectedCategory === 'All' || wallpaper.category === selectedCategory;
      const matchesSearch =
        !normalizedQuery ||
        `${wallpaper.title} ${wallpaper.author} ${wallpaper.category} ${wallpaper.tags.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && (isRemote || matchesSearch);
    });

    return filteredWallpapers.sort((left, right) => compareWallpapers(left, right, sort));
  }, [allWallpapers, query, selectedCategory, selectedPopularTag, sort]);

  const resultLabel =
    visibleExploreWallpapers.length === allWallpapers.length
      ? `共 ${allWallpapers.length} 张壁纸`
      : `${visibleExploreWallpapers.length} / ${allWallpapers.length} 张壁纸`;

  const selectHeroByIndex = useCallback((index: number) => {
    const normalizedIndex = normalizeIndex(index, homeSlides.length);

    setHeroIndex(normalizedIndex);
    setSelectedWallpaperId(homeSlides[normalizedIndex]?.id ?? 'retrowaves');
  }, [homeSlides]);

  const selectHeroByDirection = useCallback(
    (direction: 1 | -1) => {
      const nextIndex = normalizeIndex(heroIndex + direction, homeSlides.length);

      setHeroIndex(nextIndex);
      setSelectedWallpaperId(homeSlides[nextIndex]?.id ?? 'retrowaves');
    },
    [heroIndex, homeSlides],
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

      setDesktopWallpaper(toDesktopWallpaper(wallpaper, runtime.apiBaseUrl));
      setSelectedWallpaperId(wallpaper.id);
      if (wallpaper.provider && wallpaper.provider !== 'system') {
        void wallpaperApi.apply(wallpaper).catch(() => undefined);
      }
    },
    [assetById, runtime.apiBaseUrl, setDesktopWallpaper, wallpaperApi],
  );

  const toggleLike = useCallback((wallpaperId: string) => {
    const asset = assetById.get(wallpaperId);
    setLikedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      const willLike = !nextIds.has(wallpaperId);

      if (nextIds.has(wallpaperId)) {
        nextIds.delete(wallpaperId);
      } else {
        nextIds.add(wallpaperId);
      }

      if (asset?.provider && asset.provider !== 'system') {
        void wallpaperApi.favorite(asset, willLike).catch(() => undefined);
      }

      return nextIds;
    });
  }, [assetById, wallpaperApi]);

  const importWallpaper = useCallback(
    async (wallpaperId: string) => {
      const asset = assetById.get(wallpaperId);
      if (!asset) return;
      try {
        const preview = await wallpaperApi.importAsset(asset, false);
        const estimate = `${(preview.estimatedBytes / 1024 / 1024).toFixed(1)} MiB`;
        const accepted = window.confirm(
          `导入会占用约 ${estimate}。\n许可：${preview.licenseName || '未知'}\n${preview.attribution || ''}\n\n确认导入吗？`,
        );
        if (!accepted) return;
        const result = await wallpaperApi.importAsset(asset, true);
        if (result.asset) {
          const imported = normalizeRemoteAsset(result.asset);
          setCustomWallpapers((current) => [imported, ...current]);
          setSelectedWallpaperId(imported.id);
        }
      } catch (error) {
        setHeaderActionNotice(error instanceof Error ? error.message : '导入失败');
      }
    },
    [assetById, wallpaperApi],
  );

  const handleUploadWallpaper = useCallback(
    async (file: File, title: string, posterUrl: string) => {
      const wallpaper = normalizeRemoteAsset(await wallpaperApi.upload(file, title, posterUrl));
      setCustomWallpapers((prev) => [wallpaper, ...prev]);
    },
    [wallpaperApi],
  );

  const handleDeleteUploadedWallpaper = useCallback((wallpaperId: string) => {
    if (wallpaperId.startsWith('upload:') || wallpaperId.startsWith('import:')) {
      void wallpaperApi.deleteStoredAsset(wallpaperId).catch((error: unknown) => {
        setHeaderActionNotice(error instanceof Error ? error.message : '删除失败');
      });
    }
    setCustomWallpapers((prev) => prev.filter((w) => w.id !== wallpaperId));
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.delete(wallpaperId);
      return next;
    });
    setSelectedWallpaperId((currentId) => (currentId === wallpaperId ? 'retrowaves' : currentId));
  }, [wallpaperApi]);

  const handleToggleSource = useCallback((sourceId: string) => {
    const source = sources.find((item) => item.id === sourceId);
    setSources((prev) =>
      prev.map((item) => (item.id === sourceId ? { ...item, enabled: !item.enabled } : item)),
    );
    if (source) {
      void wallpaperApi.setSourceVisible(sourceId, !source.enabled).catch(() => undefined);
    }
  }, [sources, wallpaperApi]);


  const cycleSort = useCallback(() => {
    setSort((currentSort) => {
      const currentIndex = sortSequence.indexOf(currentSort);

      return sortSequence[normalizeIndex(currentIndex + 1, sortSequence.length)];
    });
  }, []);

  const showHeaderActionNotice = useCallback((message: string) => {
    setHeaderActionNotice(message);
  }, []);

  const openLockScreen = useCallback(() => {
    setIsHeaderSearchOpen(false);
    setIsLockScreenOpen(true);
  }, []);

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
      isLockScreenOpen={isLockScreenOpen}
      isSearchOpen={isHeaderSearchOpen}
      onBack={closePreview}
      onLockScreen={openLockScreen}
      onLockScreenClose={() => setIsLockScreenOpen(false)}
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
            <LockScreenSetup
              idleMinutes={desktopLockIdleMinutes}
              isEnabled={Boolean(desktopLockPassword)}
              isOpen={isLockScreenOpen}
              onApplyLock={(password, idleMinutes) => {
                setIsLockScreenOpen(false);
                lockDesktop(password, idleMinutes);
              }}
              onDisableLock={() => {
                disableDesktopLock();
                setIsLockScreenOpen(false);
              }}
              onIdleMinutesChange={setDesktopLockIdleMinutes}
              wallpaper={desktopWallpaper}
            />
            {headerActionNotice ? (
              <div className="wallpaper-header-action-notice" role="status">
                {headerActionNotice}
              </div>
            ) : null}
            {previewWallpaper ? (
              <PreviewView
                isApplied={
                  typeof desktopWallpaper !== 'string' && desktopWallpaper.id === previewWallpaper.id
                }
                isLiked={likedIds.has(previewWallpaper.id)}
                onApply={applyWallpaper}
                onLike={toggleLike}
                onImport={(id) => void importWallpaper(id)}
                wallpaper={previewWallpaper}
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
                recommendationSections={homeRecommendations}
                selectedRecommendedId={selectedWallpaperId}
                showHeroDetails={isHeroDetailsVisible}
                slides={homeSlides}
                hasMore={homeHasMore}
                isLoadingMore={isLoadingHomeMore}
                onLoadMore={() => void loadMoreHome()}
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
                hasMore={hasMoreRemote}
                isLoadingMore={isLoadingMoreRemote}
                isSearching={isSearchingRemote}
                loadError={remoteSearchError}
                onLoadMore={() => void loadRemotePage(remotePage + 1, false)}
              />
            ) : null}
            {!previewWallpaper && activeView === 'settings' ? (
              <SettingsView
                allWallpapers={allWallpapers}
                customWallpapers={customWallpapers}
                likedIds={likedIds}
                sources={sources}
                selectedWallpaperId={selectedWallpaperId}
                storageUsage={storageUsage}
                onLike={toggleLike}
                onApply={applyWallpaper}
                onUploadWallpaper={handleUploadWallpaper}
                onDeleteUploadedWallpaper={handleDeleteUploadedWallpaper}
                onToggleSource={handleToggleSource}
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

function normalizeRemoteAsset(asset: WallpaperAsset): WallpaperAsset {
  const width = asset.sources?.[0]?.width ?? 0;
  const height = asset.sources?.[0]?.height ?? 0;
  const durationSeconds = asset.durationSeconds || 0;
  return {
    ...asset,
    category: asset.category || 'Other',
    author: asset.author || 'Unknown',
    authorInitial: (asset.author || 'U').slice(0, 1).toUpperCase(),
    image: asset.posterUrl || asset.image || kernelOnDesktopWallpaper,
    device: asset.provider || 'External',
    duration: durationSeconds ? `0:${String(durationSeconds).padStart(2, '0')}` : '0:00',
    durationSeconds,
    resolution: width && height ? `${width}x${height}` : 'Source original',
    size: asset.sizeBytes ? `${(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB` : 'Direct source',
    likes: asset.likes || 0,
    tags: asset.tags || [],
    uploadedAt: asset.uploadedAt || new Date(0).toISOString(),
    liked: Boolean(asset.liked),
  };
}

function toHeroSlide(asset: WallpaperAsset): HeroSlide {
  return {
    ...asset,
    categoryLabel: asset.mediaType === 'video' ? '动态壁纸' : asset.category,
    meta: [asset.resolution, asset.author, asset.duration || '循环播放'],
  };
}

function dedupeWallpapers(assets: WallpaperAsset[]): WallpaperAsset[] {
  return Array.from(new Map(assets.map((asset) => [asset.id, asset])).values());
}

function mapExploreTag(tag: string): string {
  return (
    {
      '4K': 'ultra high definition',
      Ultrawide: 'panorama',
      '21:9': 'panorama',
      '32:9': 'panorama',
      '16:9': 'widescreen',
      DesktopHut: 'desktop motion',
      Loop: 'timelapse loop',
      Aesthetic: 'abstract aesthetic',
    }[tag] ?? tag
  );
}
