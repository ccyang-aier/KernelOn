'use client';

import {
  kernelOnDesktopWallpaper,
  useAppHeader,
  type AppHeaderCommandPayload,
} from '@kernelon/shell';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { ExploreView } from './components/ExploreView';
import { FloatingPlayer } from './components/FloatingPlayer';
import { HomeView } from './components/HomeView';
import { MyMediaView } from './components/MyMediaView';
import {
  categories,
  heroSlides,
  mediaCollectionBaseCount,
  popularTags,
  recommendedWallpapers,
  wallpaperLibrary,
} from './data';
import { createWallpaperHeader, isWallpaperView } from './header';
import { wallpaperStyles } from './styles';
import type {
  CategoryId,
  ExploreSort,
  MediaFilter,
  PlaybackSpeed,
  PlayerTrack,
  WallpaperAsset,
  WallpaperView,
} from './types';

const speedSequence: PlaybackSpeed[] = ['1x', '1.5x', '2x'];
const sortSequence: ExploreSort[] = ['newest', 'liked', 'duration'];
const wallpaperRootStyle = {
  '--wallpaper-desktop-bg': `url(${kernelOnDesktopWallpaper})`,
} as CSSProperties & Record<'--wallpaper-desktop-bg', string>;

export default function WallpaperWindow() {
  const header = useAppHeader();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeView, setActiveView] = useState<WallpaperView>('home');
  const [assets, setAssets] = useState<WallpaperAsset[]>(() => wallpaperLibrary);
  const [heroIndex, setHeroIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedPopularTag, setSelectedPopularTag] = useState('4K');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('All');
  const [sort, setSort] = useState<ExploreSort>('newest');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(
    () => new Set(wallpaperLibrary.filter((item) => item.liked).map((item) => item.id)),
  );
  const [currentTrackId, setCurrentTrackId] = useState('retrowaves');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [displayMode, setDisplayMode] = useState<'fit' | 'fill'>('fit');
  const [speed, setSpeed] = useState<PlaybackSpeed>('1x');
  const [progress, setProgress] = useState(28);
  const [toast, setToast] = useState('');

  const assetById = useMemo(
    () => new Map(assets.map((wallpaper) => [wallpaper.id, wallpaper])),
    [assets],
  );
  const currentWallpaper = assetById.get(currentTrackId) ?? assets[0] ?? wallpaperLibrary[0];
  const currentTrack = useMemo(() => toPlayerTrack(currentWallpaper), [currentWallpaper]);

  const switchView = useCallback((nextView: WallpaperView) => {
    setActiveView(nextView);
    setSpeed(nextView === 'explore' ? '1.5x' : '1x');
  }, []);

  const focusExploreSearch = useCallback(() => {
    switchView('explore');
    window.setTimeout(() => searchInputRef.current?.focus(), 90);
  }, [switchView]);

  useEffect(() => {
    header.setHeader(createWallpaperHeader(activeView));
  }, [activeView, header]);

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
    const unregisterSearch = header.registerCommand('wallpaper.focus-search', focusExploreSearch);
    const unregisterLicense = header.registerCommand('wallpaper.license', () =>
      setToast('Wallpaper license key is active.'),
    );
    const unregisterShare = header.registerCommand('wallpaper.share', () =>
      setToast(`Share link copied for ${currentWallpaper.title}.`),
    );
    const unregisterSettings = header.registerCommand('wallpaper.settings', () =>
      setDisplayMode((currentMode) => (currentMode === 'fit' ? 'fill' : 'fit')),
    );

    return () => {
      unregisterView();
      unregisterSearch();
      unregisterLicense();
      unregisterShare();
      unregisterSettings();
    };
  }, [currentWallpaper.title, focusExploreSearch, header, switchView]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 2600);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setProgress((currentValue) => {
        const nextValue = currentValue + resolveProgressStep(speed);

        return nextValue >= 100 ? 0 : nextValue;
      });
    }, 800);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed]);

  const visibleExploreWallpapers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredWallpapers = assets.filter((wallpaper) => {
      const matchesCategory = selectedCategory === 'All' || wallpaper.category === selectedCategory;
      const matchesPopularTag =
        !selectedPopularTag || wallpaper.tags.includes(selectedPopularTag);
      const matchesSearch =
        !normalizedQuery ||
        `${wallpaper.title} ${wallpaper.author} ${wallpaper.category} ${wallpaper.tags.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesPopularTag && matchesSearch;
    });

    return filteredWallpapers.sort((left, right) => compareWallpapers(left, right, sort));
  }, [assets, query, selectedCategory, selectedPopularTag, sort]);

  const visibleMediaItems = useMemo(
    () =>
      assets
        .filter((item) => {
          if (mediaFilter === 'local') {
            return item.local;
          }

          if (mediaFilter === 'liked') {
            return likedIds.has(item.id);
          }

          return true;
        })
        .sort((left, right) => compareWallpapers(left, right, 'newest')),
    [assets, likedIds, mediaFilter],
  );

  const playerQueue = useMemo(() => {
    if (activeView === 'media') {
      return visibleMediaItems;
    }

    if (activeView === 'explore') {
      return visibleExploreWallpapers;
    }

    return heroSlides;
  }, [activeView, visibleExploreWallpapers, visibleMediaItems]);

  const resultLabel =
    visibleExploreWallpapers.length === assets.length
      ? '2.523 wallpapers'
      : `${visibleExploreWallpapers.length} of 2.523 wallpapers`;
  const mediaTotalCount =
    mediaCollectionBaseCount + Math.max(0, assets.length - wallpaperLibrary.length);

  const selectHeroByIndex = useCallback((index: number) => {
    const normalizedIndex = normalizeIndex(index, heroSlides.length);

    setHeroIndex(normalizedIndex);
    setCurrentTrackId(heroSlides[normalizedIndex]?.id ?? 'retrowaves');
    setProgress(0);
  }, []);

  const selectHeroByDirection = useCallback((direction: 1 | -1) => {
    const nextIndex = normalizeIndex(heroIndex + direction, heroSlides.length);

    setHeroIndex(nextIndex);
    setCurrentTrackId(heroSlides[nextIndex]?.id ?? 'retrowaves');
    setProgress(0);
  }, [heroIndex]);

  useEffect(() => {
    if (activeView !== 'home' || !isPlaying) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      selectHeroByDirection(1);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [activeView, isPlaying, selectHeroByDirection]);

  const selectWallpaper = useCallback((wallpaperId: string) => {
    setCurrentTrackId(wallpaperId);
    setProgress(0);
  }, []);

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

  const cycleSpeed = useCallback(() => {
    setSpeed((currentSpeed) => {
      const currentIndex = speedSequence.indexOf(currentSpeed);

      return speedSequence[normalizeIndex(currentIndex + 1, speedSequence.length)];
    });
  }, []);

  const stepTrack = useCallback(
    (direction: 1 | -1) => {
      const queue = playerQueue.length ? playerQueue : assets;
      const currentIndex = queue.findIndex((wallpaper) => wallpaper.id === currentTrackId);
      const nextIndex = normalizeIndex(
        (currentIndex === -1 ? 0 : currentIndex) + direction,
        queue.length,
      );
      const nextWallpaper = queue[nextIndex];

      if (!nextWallpaper) {
        return;
      }

      setCurrentTrackId(nextWallpaper.id);
      setProgress(0);

      const nextHeroIndex = heroSlides.findIndex((slide) => slide.id === nextWallpaper.id);

      if (nextHeroIndex >= 0) {
        setHeroIndex(nextHeroIndex);
      }
    },
    [assets, currentTrackId, playerQueue],
  );

  const addVideo = useCallback(() => {
    const uploadNumber = assets.length - wallpaperLibrary.length + 1;
    const uploadedWallpaper = createUploadedWallpaper(uploadNumber);

    setAssets((currentAssets) => [uploadedWallpaper, ...currentAssets]);
    setCurrentTrackId(uploadedWallpaper.id);
    setProgress(0);
    setMediaFilter('local');
    switchView('media');
    setToast(`${uploadedWallpaper.title} added to My Media.`);
  }, [assets.length, switchView]);

  return (
    <div
      className={`wallpaper-ux wallpaper-ux--${activeView}`}
      data-wallpaper-active-view={activeView}
      data-wallpaper-app="true"
      style={wallpaperRootStyle}
    >
      <style>{wallpaperStyles}</style>
      {activeView === 'home' ? (
        <HomeView
          heroIndex={heroIndex}
          likedIds={likedIds}
          onHeroDotSelect={selectHeroByIndex}
          onHeroNav={selectHeroByDirection}
          onLike={toggleLike}
          onPreview={(wallpaperId) => {
            selectWallpaper(wallpaperId);
            setToast(`${assetById.get(wallpaperId)?.title ?? 'Wallpaper'} preview is playing.`);
          }}
          onRecommendationSelect={selectWallpaper}
          recommended={recommendedWallpapers}
          selectedRecommendedId={currentTrackId}
          slides={heroSlides}
        />
      ) : null}
      {activeView === 'explore' ? (
        <ExploreView
          categories={categories}
          likedIds={likedIds}
          onCategoryChange={setSelectedCategory}
          onLike={toggleLike}
          onPopularTagChange={setSelectedPopularTag}
          onQueryChange={setQuery}
          onSelectWallpaper={selectWallpaper}
          onSortCycle={cycleSort}
          popularTags={popularTags}
          query={query}
          resultLabel={resultLabel}
          searchInputRef={searchInputRef}
          selectedCategory={selectedCategory}
          selectedPopularTag={selectedPopularTag}
          selectedWallpaperId={currentTrackId}
          sort={sort}
          wallpapers={visibleExploreWallpapers}
        />
      ) : null}
      {activeView === 'media' ? (
        <MyMediaView
          filter={mediaFilter}
          likedIds={likedIds}
          onAddVideo={addVideo}
          onFilterChange={setMediaFilter}
          onSelectWallpaper={selectWallpaper}
          onToggleLike={toggleLike}
          rows={visibleMediaItems}
          selectedWallpaperId={currentTrackId}
          totalCount={mediaTotalCount}
        />
      ) : null}
      <FloatingPlayer
        activeView={activeView}
        displayMode={displayMode}
        isLiked={likedIds.has(currentTrackId)}
        isMuted={isMuted}
        isPlaying={isPlaying}
        onNext={() => stepTrack(1)}
        onPlayPause={() => setIsPlaying((currentValue) => !currentValue)}
        onPrevious={() => stepTrack(-1)}
        onSpeedCycle={cycleSpeed}
        onToggleDisplayMode={() =>
          setDisplayMode((currentMode) => (currentMode === 'fit' ? 'fill' : 'fit'))
        }
        onToggleLike={() => toggleLike(currentTrackId)}
        onToggleMute={() => setIsMuted((currentValue) => !currentValue)}
        progressPercent={progress}
        speed={speed}
        track={currentTrack}
      />
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

function resolveProgressStep(speed: PlaybackSpeed): number {
  if (speed === '2x') {
    return 5.2;
  }

  if (speed === '1.5x') {
    return 3.8;
  }

  return 2.6;
}

function toPlayerTrack(wallpaper: WallpaperAsset): PlayerTrack {
  return {
    device: wallpaper.device,
    durationSeconds: wallpaper.durationSeconds,
    id: wallpaper.id,
    image: wallpaper.image,
    title: wallpaper.title,
  };
}

function createUploadedWallpaper(uploadNumber: number): WallpaperAsset {
  const paddedUploadNumber = String(uploadNumber).padStart(2, '0');

  return {
    id: `local-upload-${paddedUploadNumber}`,
    title: `Local Upload ${paddedUploadNumber}`,
    category: 'Other',
    author: 'Local',
    authorInitial: 'L',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    device: 'LOCAL LIBRARY',
    duration: '0:18',
    durationSeconds: 18,
    resolution: '3840x2160',
    size: '38 MB',
    likes: 0,
    tags: ['4K', '16:9', 'Loop'],
    uploadedAt: new Date().toISOString(),
    local: true,
    liked: false,
  };
}
