'use client';

import type { AppHeaderDescriptor } from '@kernelon/core';
import { useAppHeader, type AppHeaderCommandPayload } from '@kernelon/shell';
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Folder,
  HardDrive,
  Heart,
  Music,
  Pause,
  Play,
  PlusCircle,
  Search,
  SkipBack,
  SkipForward,
  ToggleLeft,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from 'react';

type WallpaperView = 'home' | 'explore' | 'media';
type CategoryId =
  | 'All'
  | 'Animals'
  | 'Anime'
  | 'Cars'
  | 'Games'
  | 'Graphics'
  | 'Minimalist'
  | 'Movies'
  | 'Nature'
  | 'Other'
  | 'People'
  | 'PixelArt'
  | 'SciFi'
  | 'Space'
  | 'Winter';
type MediaFilter = 'all' | 'local' | 'liked';

interface HeroSlide {
  id: string;
  category: string;
  title: string;
  image: string;
  meta: string[];
  likes: number;
}

interface ExploreCard {
  id: string;
  title: string;
  author: string;
  authorInitial: string;
  category: CategoryId;
  image: string;
  likes: number;
  duration: string;
}

interface MediaItem {
  id: number;
  title: string;
  category: CategoryId;
  author: string;
  duration: string;
  resolution: string;
  size: string;
  likes: number;
  image?: string;
  local: boolean;
  liked: boolean;
  placeholder?: 'pink';
}

const viewLabels: Record<WallpaperView, string> = {
  explore: 'Explore',
  home: 'Home',
  media: 'My Media',
};

const heroSlides: HeroSlide[] = [
  {
    id: 'overgrown-cathedral',
    category: 'OTHER',
    title: 'Overgrown Cathedral',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2560&auto=format&fit=crop',
    meta: ['3840x2160', 'Ark', '40 Mb', '19s'],
    likes: 53,
  },
  {
    id: 'crystal-arcade',
    category: 'GRAPHICS',
    title: 'Crystal Arcade',
    image:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2560&auto=format&fit=crop',
    meta: ['3840x2160', 'Vetro', '52 Mb', '21s'],
    likes: 71,
  },
  {
    id: 'neon-forest',
    category: 'NATURE',
    title: 'Neon Forest',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop',
    meta: ['5120x2880', 'Froztyy', '64 Mb', '12s'],
    likes: 86,
  },
];

const recommendedWallpapers = [
  {
    id: 'retrowaves-card',
    title: 'Retrowaves',
    device: 'SAMSUNG',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'desert-card',
    title: 'Arcade Heat',
    device: 'ASUS PROART',
    image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'sky-card',
    title: 'Blue Riot',
    device: 'LG ULTRAFINE',
    image:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'fire-card',
    title: 'Carbon Heart',
    device: 'BENQ',
    image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cyan-card',
    title: 'Sky Panel',
    device: 'STUDIO',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop',
  },
];

const popularTags = ['4K', 'Ultrawide', '21:9', '32:9', '16:9', 'DesktopHut', 'Loop', 'Aesthetic'];

const categories: Array<{ id: CategoryId; image?: string }> = [
  { id: 'All' },
  {
    id: 'Animals',
    image:
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Anime',
    image:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Cars',
    image:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Games',
    image:
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Graphics',
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Minimalist',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Movies',
    image:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Nature',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Other',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'People',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'PixelArt',
    image:
      'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'SciFi',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Space',
    image:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=96&h=96&auto=format&fit=crop',
  },
  {
    id: 'Winter',
    image:
      'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=96&h=96&auto=format&fit=crop',
  },
];

const exploreWallpapers: ExploreCard[] = [
  {
    id: 'lone-wanderer',
    title: 'Lone Wanderer - Anime',
    author: 'Froztyy',
    authorInitial: 'F',
    category: 'Anime',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=900&auto=format&fit=crop',
    likes: 3,
    duration: '0:05',
  },
  {
    id: 'silver-surfer',
    title: '4K Silver Surfer',
    author: '4k Silver Surfer.mp4',
    authorInitial: '4',
    category: 'Movies',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=900&auto=format&fit=crop',
    likes: 3,
    duration: '0:15',
  },
  {
    id: 'motorcycle',
    title: 'Motorcycle',
    author: 'TechGuy',
    authorInitial: 'T',
    category: 'Other',
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=900&auto=format&fit=crop',
    likes: 1,
    duration: '0:11',
  },
  {
    id: 'ocean-school',
    title: 'Ocean School',
    author: 'MSI MP341CQ',
    authorInitial: 'M',
    category: 'Nature',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop',
    likes: 18,
    duration: '0:08',
  },
  {
    id: 'shirt-blue',
    title: 'Shirt Blue!',
    author: 'Samsung',
    authorInitial: 'S',
    category: 'People',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=900&auto=format&fit=crop',
    likes: 12,
    duration: '0:12',
  },
  {
    id: 'blue-panel',
    title: 'Blue Panel Loop',
    author: 'DesktopHut',
    authorInitial: 'D',
    category: 'Minimalist',
    image:
      'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=900&auto=format&fit=crop',
    likes: 7,
    duration: '0:09',
  },
];

const mediaItems: MediaItem[] = [
  {
    id: 1,
    title: 'Dark Sky',
    category: 'Nature',
    author: 'Kinc',
    duration: '0:50',
    resolution: '3840x2160',
    size: '9 MB',
    likes: 336,
    image:
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=180&h=180&auto=format&fit=crop',
    local: true,
    liked: true,
  },
  {
    id: 2,
    title: 'Boat Floats',
    category: 'Nature',
    author: 'Unknown',
    duration: '0:15',
    resolution: '3840x2160',
    size: '44 MB',
    likes: 157,
    image:
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=180&h=180&auto=format&fit=crop',
    local: true,
    liked: true,
  },
  {
    id: 3,
    title: 'Bloodlight Face',
    category: 'Anime',
    author: 'Unknown',
    duration: '0:14',
    resolution: '3840x2160',
    size: '24 MB',
    likes: 54,
    image:
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=180&h=180&auto=format&fit=crop',
    local: false,
    liked: true,
  },
  {
    id: 4,
    title: 'Zelda Forest Temple',
    category: 'Games',
    author: 'Hyunjinniee',
    duration: '0:06',
    resolution: '3840x2160',
    size: '7 MB',
    likes: 102,
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=180&h=180&auto=format&fit=crop',
    local: true,
    liked: true,
  },
  {
    id: 5,
    title: 'Snowy Village',
    category: 'Winter',
    author: 'Unknown',
    duration: '0:10',
    resolution: '1920x1080',
    size: '4 MB',
    likes: 91,
    image:
      'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?q=80&w=180&h=180&auto=format&fit=crop',
    local: false,
    liked: true,
  },
  {
    id: 6,
    title: 'Cat Waves Its Tail',
    category: 'Minimalist',
    author: 'Unknown',
    duration: '0:04',
    resolution: '1920x1080',
    size: '1 MB',
    likes: 186,
    local: true,
    liked: true,
    placeholder: 'pink',
  },
  {
    id: 7,
    title: 'Abi Toads',
    category: 'Other',
    author: 'Unknown',
    duration: '0:12',
    resolution: '3840x2160',
    size: '127 MB',
    likes: 329,
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=180&h=180&auto=format&fit=crop',
    local: false,
    liked: true,
  },
];

const headerOptions = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.media, value: 'media' },
];

function createWallpaperHeader(activeView: WallpaperView): AppHeaderDescriptor {
  return {
    center: [
      {
        commandId: 'wallpaper.view',
        id: 'wallpaper-tabs',
        options: headerOptions,
        type: 'segment',
        value: activeView,
      },
    ],
    density: 'comfortable',
    leading: [
      {
        commandId: 'wallpaper.focus-search',
        icon: 'Search',
        id: 'wallpaper-search',
        label: 'Search',
        type: 'button',
      },
    ],
    mode: 'standard',
    preset: 'editor',
    trailing: [
      {
        commandId: 'wallpaper.license',
        icon: 'KeyRound',
        id: 'wallpaper-license',
        label: 'License',
        type: 'button',
      },
      {
        commandId: 'wallpaper.share',
        icon: 'Share2',
        id: 'wallpaper-share',
        label: 'Share',
        type: 'button',
      },
      {
        commandId: 'wallpaper.settings',
        icon: 'Settings',
        id: 'wallpaper-settings',
        label: 'Settings',
        type: 'button',
      },
    ],
  };
}

export default function WallpaperWindow() {
  const header = useAppHeader();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeView, setActiveView] = useState<WallpaperView>('home');
  const [heroIndex, setHeroIndex] = useState(0);
  const [homeLiked, setHomeLiked] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedPopularTag, setSelectedPopularTag] = useState('4K');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('All');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [likedMediaIds, setLikedMediaIds] = useState<ReadonlySet<number>>(
    () => new Set(mediaItems.filter((item) => item.liked).map((item) => item.id)),
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(activeView === 'explore' ? '1.5x' : '1x');
  const [toast, setToast] = useState('');
  const activeHero = heroSlides[heroIndex] ?? heroSlides[0];

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
      setToast('Share link copied for the current wallpaper.'),
    );
    const unregisterSettings = header.registerCommand('wallpaper.settings', () =>
      setSpeed((currentSpeed) => (currentSpeed === '1x' ? '1.5x' : '1x')),
    );

    return () => {
      unregisterView();
      unregisterSearch();
      unregisterLicense();
      unregisterShare();
      unregisterSettings();
    };
  }, [focusExploreSearch, header, switchView]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 2600);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleExploreWallpapers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exploreWallpapers.filter((wallpaper) => {
      const matchesCategory = selectedCategory === 'All' || wallpaper.category === selectedCategory;
      const matchesSearch =
        !normalizedQuery ||
        `${wallpaper.title} ${wallpaper.author} ${wallpaper.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [query, selectedCategory]);

  const visibleMediaItems = useMemo(
    () =>
      mediaItems.filter((item) => {
        if (mediaFilter === 'local') {
          return item.local;
        }

        if (mediaFilter === 'liked') {
          return likedMediaIds.has(item.id);
        }

        return true;
      }),
    [likedMediaIds, mediaFilter],
  );

  const playerProfile = useMemo(() => {
    if (activeView === 'media') {
      return {
        device: 'SAMSUNG',
        image:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=160&h=160&auto=format&fit=crop',
        title: 'Shirt Blue!',
      };
    }

    if (activeView === 'home') {
      return {
        device: 'SAMSUNG',
        image:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=160&h=160&auto=format&fit=crop',
        title: 'Retrowaves',
      };
    }

    return {
      device: 'MSI MP341CQ',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=160&h=160&auto=format&fit=crop',
      title: 'Ocean',
    };
  }, [activeView]);

  function selectHero(direction: 1 | -1) {
    setHeroIndex(
      (currentIndex) => (currentIndex + direction + heroSlides.length) % heroSlides.length,
    );
  }

  function toggleMediaLike(itemId: number) {
    setLikedMediaIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(itemId)) {
        nextIds.delete(itemId);
      } else {
        nextIds.add(itemId);
      }

      return nextIds;
    });
  }

  return (
    <div
      className={`wallpaper-ux wallpaper-ux--${activeView}`}
      data-wallpaper-active-view={activeView}
      data-wallpaper-app="true"
    >
      <style>{wallpaperStyles}</style>
      {activeView === 'home' ? (
        <HomeView
          activeHero={activeHero}
          heroIndex={heroIndex}
          homeLiked={homeLiked}
          onHeroDotSelect={setHeroIndex}
          onHeroNav={selectHero}
          onLike={() => setHomeLiked((currentValue) => !currentValue)}
        />
      ) : null}
      {activeView === 'explore' ? (
        <ExploreView
          onCategoryChange={setSelectedCategory}
          onPopularTagChange={setSelectedPopularTag}
          onQueryChange={setQuery}
          query={query}
          searchInputRef={searchInputRef}
          selectedCategory={selectedCategory}
          selectedPopularTag={selectedPopularTag}
          wallpapers={visibleExploreWallpapers}
        />
      ) : null}
      {activeView === 'media' ? (
        <MyMediaView
          filter={mediaFilter}
          likedIds={likedMediaIds}
          onAddVideo={() => setToast('Add Video queue is ready.')}
          onFilterChange={setMediaFilter}
          onToggleLike={toggleMediaLike}
          rows={visibleMediaItems}
        />
      ) : null}
      <FloatingPlayer
        activeView={activeView}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying((currentValue) => !currentValue)}
        playerProfile={playerProfile}
        speed={speed}
      />
      {toast ? <div className="wallpaper-toast">{toast}</div> : null}
    </div>
  );
}

function HomeView({
  activeHero,
  heroIndex,
  homeLiked,
  onHeroDotSelect,
  onHeroNav,
  onLike,
}: Readonly<{
  activeHero: HeroSlide;
  heroIndex: number;
  homeLiked: boolean;
  onHeroDotSelect(index: number): void;
  onHeroNav(direction: 1 | -1): void;
  onLike(): void;
}>) {
  return (
    <section className="wallpaper-home" aria-label="Wallpaper Home">
      <img alt="" className="wallpaper-home__image" draggable={false} src={activeHero.image} />
      <div className="wallpaper-home__shade" />
      <div className="wallpaper-home__content">
        <span className="wallpaper-home__category">{activeHero.category}</span>
        <h1>{activeHero.title}</h1>
        <div className="wallpaper-home__meta">
          {activeHero.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
          <span className="wallpaper-home__badge">4K</span>
        </div>
        <div className="wallpaper-home__actions">
          <button type="button">
            <Play aria-hidden="true" className="wallpaper-icon wallpaper-icon--fill" />
            View Wallper
          </button>
          <button aria-pressed={homeLiked} onClick={onLike} type="button">
            <Heart
              aria-hidden="true"
              className={homeLiked ? 'wallpaper-icon wallpaper-icon--fill' : 'wallpaper-icon'}
            />
            {homeLiked ? activeHero.likes + 1 : activeHero.likes}
          </button>
        </div>
      </div>
      <button
        aria-label="Previous wallpaper"
        className="wallpaper-home__arrow wallpaper-home__arrow--prev"
        onClick={() => onHeroNav(-1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        aria-label="Next wallpaper"
        className="wallpaper-home__arrow wallpaper-home__arrow--next"
        onClick={() => onHeroNav(1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" />
      </button>
      <div className="wallpaper-home__pagination" role="tablist">
        {Array.from({ length: 10 }, (_, index) => (
          <button
            aria-label={`Show wallpaper ${index + 1}`}
            aria-selected={index === heroIndex}
            className={index === heroIndex ? 'is-active' : undefined}
            key={index}
            onClick={() => onHeroDotSelect(index % heroSlides.length)}
            role="tab"
            type="button"
          />
        ))}
      </div>
      <section className="wallpaper-recommendations" aria-label="Recommended wallpapers">
        <h2>
          Recommended For You
          <ChevronRight aria-hidden="true" />
        </h2>
        <div className="wallpaper-carousel">
          {recommendedWallpapers.map((item, index) => (
            <article
              className={
                index === 1 ? 'wallpaper-carousel-card has-overlay' : 'wallpaper-carousel-card'
              }
              key={item.id}
            >
              <img alt="" draggable={false} src={item.image} />
              {index === 1 ? (
                <div className="wallpaper-card-glass-label">
                  <strong>{item.title}</strong>
                  <span>
                    <i />
                    {item.device}
                  </span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ExploreView({
  onCategoryChange,
  onPopularTagChange,
  onQueryChange,
  query,
  searchInputRef,
  selectedCategory,
  selectedPopularTag,
  wallpapers,
}: Readonly<{
  onCategoryChange(category: CategoryId): void;
  onPopularTagChange(tag: string): void;
  onQueryChange(query: string): void;
  query: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  selectedCategory: CategoryId;
  selectedPopularTag: string;
  wallpapers: ExploreCard[];
}>) {
  return (
    <section
      className="wallpaper-page wallpaper-page--explore"
      aria-label="Explore Wallpaper Library"
    >
      <div className="wallpaper-page__intro">
        <p>
          Good Night <span aria-hidden="true">👋</span>
        </p>
        <h1>Explore Wallper Library</h1>
        <span>Discover 2.523 stunning live wallpapers curated for your desktop</span>
      </div>

      <label className="wallpaper-search">
        <Search aria-hidden="true" />
        <input
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="Search wallpapers..."
          ref={searchInputRef}
          type="search"
          value={query}
        />
      </label>

      <div className="wallpaper-popular">
        <span>Popular:</span>
        {popularTags.map((tag) => (
          <button
            aria-pressed={selectedPopularTag === tag}
            className={selectedPopularTag === tag ? 'is-selected' : undefined}
            key={tag}
            onClick={() => onPopularTagChange(tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="wallpaper-categories" aria-label="Wallpaper categories">
        {categories.map((category) => (
          <button
            aria-pressed={selectedCategory === category.id}
            className={selectedCategory === category.id ? 'is-active' : undefined}
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            type="button"
          >
            {category.image ? <img alt="" draggable={false} src={category.image} /> : <i />}
            {category.id}
          </button>
        ))}
      </div>

      <div className="wallpaper-results-bar">
        <strong>2.523 wallpapers</strong>
        <button type="button">
          <ArrowDownUp aria-hidden="true" />
          Newest
        </button>
      </div>

      <div className="wallpaper-grid">
        {wallpapers.map((wallpaper) => (
          <ExploreCard key={wallpaper.id} wallpaper={wallpaper} />
        ))}
      </div>
    </section>
  );
}

function ExploreCard({ wallpaper }: Readonly<{ wallpaper: ExploreCard }>) {
  return (
    <article className="wallpaper-explore-card">
      <img alt="" draggable={false} src={wallpaper.image} />
      <div className="wallpaper-explore-card__info">
        <h2>{wallpaper.title}</h2>
        <div className="wallpaper-explore-card__meta">
          <span className="wallpaper-author">
            <i>{wallpaper.authorInitial}</i>
            {wallpaper.author}
          </span>
          <span className="wallpaper-tag">{wallpaper.category}</span>
          <span className="wallpaper-stats">
            <b>
              <Heart aria-hidden="true" />
              {wallpaper.likes}
            </b>
            <em>{wallpaper.duration}</em>
          </span>
        </div>
      </div>
    </article>
  );
}

function MyMediaView({
  filter,
  likedIds,
  onAddVideo,
  onFilterChange,
  onToggleLike,
  rows,
}: Readonly<{
  filter: MediaFilter;
  likedIds: ReadonlySet<number>;
  onAddVideo(): void;
  onFilterChange(filter: MediaFilter): void;
  onToggleLike(id: number): void;
  rows: MediaItem[];
}>) {
  return (
    <section className="wallpaper-page wallpaper-page--media" aria-label="My Media">
      <div className="wallpaper-media-heading">
        <div>
          <h1>My Media</h1>
          <p>42 wallpapers</p>
        </div>
        <button className="wallpaper-add-video" onClick={onAddVideo} type="button">
          <PlusCircle aria-hidden="true" />
          Add Video
        </button>
      </div>

      <div className="wallpaper-media-tabs">
        <MediaTab active={filter === 'all'} label="All" onClick={() => onFilterChange('all')}>
          <Folder aria-hidden="true" />
        </MediaTab>
        <MediaTab active={filter === 'local'} label="Local" onClick={() => onFilterChange('local')}>
          <HardDrive aria-hidden="true" />
        </MediaTab>
        <MediaTab active={filter === 'liked'} label="Liked" onClick={() => onFilterChange('liked')}>
          <Heart aria-hidden="true" />
        </MediaTab>
      </div>

      <div className="wallpaper-media-table">
        <div className="wallpaper-media-row wallpaper-media-row--head">
          <span>#</span>
          <span>PREVIEW</span>
          <span>TITLE</span>
          <span>CATEGORY</span>
          <span>AUTHOR</span>
          <span>DURATION</span>
          <span>RESOLUTION</span>
          <span>SIZE</span>
          <span>LIKES</span>
        </div>
        {rows.map((item) => (
          <div className="wallpaper-media-row" key={item.id}>
            <span>{item.id}</span>
            <span>
              {item.placeholder === 'pink' ? (
                <i className="wallpaper-media-preview wallpaper-media-preview--pink" />
              ) : (
                <img
                  alt=""
                  className="wallpaper-media-preview"
                  draggable={false}
                  src={item.image}
                />
              )}
            </span>
            <strong>{item.title}</strong>
            <span>{item.category}</span>
            <span>{item.author}</span>
            <span>{item.duration}</span>
            <span>{item.resolution}</span>
            <span>{item.size}</span>
            <button
              aria-label={`${likedIds.has(item.id) ? 'Unlike' : 'Like'} ${item.title}`}
              aria-pressed={likedIds.has(item.id)}
              onClick={() => onToggleLike(item.id)}
              type="button"
            >
              {item.likes}
              <Heart aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MediaTab({
  active,
  children,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  children: ReactNode;
  label: string;
  onClick(): void;
}>) {
  return (
    <button
      aria-pressed={active}
      className={active ? 'is-active' : undefined}
      onClick={onClick}
      type="button"
    >
      {children}
      {label}
    </button>
  );
}

function FloatingPlayer({
  activeView,
  isPlaying,
  onPlayPause,
  playerProfile,
  speed,
}: Readonly<{
  activeView: WallpaperView;
  isPlaying: boolean;
  onPlayPause(): void;
  playerProfile: { title: string; device: string; image: string };
  speed: string;
}>) {
  return (
    <aside className={`wallpaper-player wallpaper-player--${activeView}`}>
      <div className="wallpaper-player__info">
        <img alt="" draggable={false} src={playerProfile.image} />
        <div>
          <strong>{playerProfile.title}</strong>
          <span>
            <i />
            {playerProfile.device}
          </span>
        </div>
      </div>
      <div className="wallpaper-player__controls">
        <button aria-label="Display mode" type="button">
          <ToggleLeft aria-hidden="true" />
        </button>
        <button aria-label="Favorite playing wallpaper" type="button">
          <Heart aria-hidden="true" />
        </button>
        <button aria-label="Audio" type="button">
          <Music aria-hidden="true" />
        </button>
        <button aria-label="Previous" type="button">
          <SkipBack aria-hidden="true" />
        </button>
        <button
          aria-label={isPlaying ? 'Pause wallpaper' : 'Play wallpaper'}
          onClick={onPlayPause}
          type="button"
        >
          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <button aria-label="Next" type="button">
          <SkipForward aria-hidden="true" />
        </button>
        <button aria-label="Playback speed" className="wallpaper-player__speed" type="button">
          {speed}
        </button>
      </div>
    </aside>
  );
}

function isWallpaperView(value: string | undefined): value is WallpaperView {
  return value === 'home' || value === 'explore' || value === 'media';
}

const wallpaperStyles = `
section[data-app-id="wallpaper"] {
  background: #050505 !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

section[data-app-id="wallpaper"] > header {
  position: absolute;
  inset: 0 0 auto;
  z-index: 80;
  min-height: 68px !important;
  height: 68px;
  overflow: visible;
  border-bottom: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

section[data-app-id="wallpaper"] > header + div {
  height: 100%;
  flex: 1 1 auto;
  background: transparent !important;
}

section[data-app-id="wallpaper"] > header + div > div {
  height: 100%;
  overflow: hidden !important;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-window-traffic-lights-"] {
  left: 24px;
  top: 31px;
  gap: 10px;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-window-traffic-lights-"] button {
  width: 13px;
  height: 13px;
}

section[data-app-id="wallpaper"] > header > div:nth-of-type(2) {
  min-height: 68px;
  padding: 0 24px 0 86px;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-identity-"] {
  display: none;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-leading-"],
section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] {
  flex: 1 1 0;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-center-"] {
  flex: 0 0 auto;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-leading-"] button,
section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] button {
  width: 42px;
  min-width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 999px;
  border-color: rgba(255, 255, 255, 0.16) !important;
  background: rgba(24, 25, 29, 0.48) !important;
  color: rgba(255, 255, 255, 0.92) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 30px rgba(0, 0, 0, 0.22) !important;
  backdrop-filter: blur(22px) saturate(1.22);
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] {
  gap: 0;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] button {
  margin-left: -1px;
  border-radius: 0;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] button:first-child {
  border-radius: 999px 0 0 999px;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] button:last-child {
  border-radius: 0 999px 999px 0;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-leading-"] button span,
section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] button span {
  display: none;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-leading-"] svg,
section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] svg {
  width: 21px;
  height: 21px;
  stroke-width: 2.25;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-center-"] [role="group"] {
  height: 42px;
  gap: 0;
  padding: 4px;
  border-color: rgba(255, 255, 255, 0.16) !important;
  border-radius: 999px;
  background: rgba(38, 41, 43, 0.48) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 30px rgba(0, 0, 0, 0.18) !important;
  backdrop-filter: blur(24px) saturate(1.25);
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-center-"] button {
  height: 34px;
  min-width: 94px;
  padding: 0 20px;
  border: 0 !important;
  border-radius: 999px;
  background: transparent !important;
  color: rgba(255, 255, 255, 0.77) !important;
  box-shadow: none !important;
  font-size: 14px;
  font-weight: 700;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-center-"] button[aria-pressed="true"] {
  background: rgba(255, 255, 255, 0.18) !important;
  color: #fff !important;
}

.wallpaper-ux {
  --wallpaper-display: Georgia, "Times New Roman", serif;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 620px;
  overflow: hidden;
  color: #fff;
  background: #050505;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.wallpaper-ux::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  transition: opacity 260ms ease, background 260ms ease;
}

.wallpaper-ux--home::before {
  opacity: 0;
}

.wallpaper-ux--explore::before {
  opacity: 1;
  background:
    radial-gradient(circle at 76% 27%, rgba(157, 147, 128, 0.58), rgba(157, 147, 128, 0) 28%),
    radial-gradient(circle at 22% 22%, rgba(93, 100, 110, 0.55), rgba(93, 100, 110, 0) 32%),
    linear-gradient(115deg, #283038 0%, #343b40 42%, #585953 68%, #293026 100%);
  filter: saturate(0.88);
}

.wallpaper-ux--media::before {
  opacity: 1;
  background:
    radial-gradient(circle at 56% 40%, rgba(94, 94, 89, 0.68), rgba(94, 94, 89, 0) 30%),
    radial-gradient(circle at 83% 20%, rgba(238, 9, 21, 0.66), rgba(238, 9, 21, 0) 42%),
    radial-gradient(circle at 20% 60%, rgba(143, 24, 30, 0.62), rgba(143, 24, 30, 0) 48%),
    linear-gradient(108deg, #7e0711 0%, #421617 49%, #b10012 100%);
}

.wallpaper-ux button {
  font: inherit;
}

.wallpaper-icon {
  width: 17px;
  height: 17px;
  stroke-width: 2.4;
}

.wallpaper-icon--fill {
  fill: currentColor;
}

.wallpaper-home {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  background: #0b0d10;
}

.wallpaper-home__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
}

.wallpaper-home__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.08) 48%, rgba(0, 0, 0, 0.38) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.16) 50%, rgba(11, 5, 8, 0.96) 78%, rgba(7, 6, 8, 1) 100%);
}

.wallpaper-home__content {
  position: absolute;
  left: clamp(52px, 6vw, 92px);
  bottom: 256px;
  z-index: 2;
  width: min(520px, 56vw);
  text-shadow: 0 3px 18px rgba(0, 0, 0, 0.65);
}

.wallpaper-home__category {
  display: block;
  margin-bottom: 5px;
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.wallpaper-home h1 {
  margin: 0;
  color: #fff;
  font-family: var(--wallpaper-display);
  font-size: clamp(29px, 3vw, 43px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: 0;
}

.wallpaper-home__meta {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
  font-weight: 700;
}

.wallpaper-home__badge {
  display: inline-flex;
  height: 14px;
  align-items: center;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.25);
  padding: 0 4px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 8px;
  font-weight: 900;
}

.wallpaper-home__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.wallpaper-home__actions button {
  display: inline-flex;
  height: 42px;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(20, 21, 22, 0.52);
  color: rgba(255, 255, 255, 0.94);
  padding: 0 24px;
  font-size: 15px;
  font-weight: 800;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 15px 30px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(20px);
  cursor: pointer;
}

.wallpaper-home__actions button:last-child {
  padding: 0 16px;
}

.wallpaper-home__arrow {
  position: absolute;
  top: 42%;
  z-index: 3;
  display: grid;
  width: 42px;
  height: 64px;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
}

.wallpaper-home__arrow svg {
  width: 39px;
  height: 39px;
  stroke-width: 2.8;
  filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5));
}

.wallpaper-home__arrow--prev {
  left: 20px;
}

.wallpaper-home__arrow--next {
  right: 20px;
}

.wallpaper-home__pagination {
  position: absolute;
  left: 50%;
  bottom: 245px;
  z-index: 3;
  display: flex;
  transform: translateX(-50%);
  gap: 8px;
}

.wallpaper-home__pagination button {
  width: 8px;
  height: 8px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.32);
  padding: 0;
  cursor: pointer;
}

.wallpaper-home__pagination button.is-active {
  background: rgba(255, 255, 255, 0.96);
}

.wallpaper-recommendations {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  min-height: 224px;
  padding: 34px clamp(48px, 5.8vw, 86px) 0;
  background: linear-gradient(180deg, rgba(20, 10, 13, 0.85), rgba(9, 7, 8, 0.98));
  box-shadow: 0 -40px 70px rgba(10, 5, 7, 0.54);
}

.wallpaper-recommendations h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 24px;
  font-family: var(--wallpaper-display);
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.wallpaper-recommendations h2 svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.5);
}

.wallpaper-carousel {
  display: flex;
  gap: 23px;
  overflow: hidden;
}

.wallpaper-carousel-card {
  position: relative;
  min-width: 300px;
  height: 152px;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
}

.wallpaper-carousel-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wallpaper-card-glass-label {
  position: absolute;
  bottom: 16px;
  left: 30px;
  min-width: 226px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(56, 34, 52, 0.48);
  padding: 12px 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 34px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(22px);
}

.wallpaper-card-glass-label strong {
  display: block;
  font-family: var(--wallpaper-display);
  font-size: 15px;
  line-height: 1;
}

.wallpaper-card-glass-label span,
.wallpaper-player__info span {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 10px;
  font-weight: 900;
}

.wallpaper-card-glass-label i,
.wallpaper-player__info i {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: #21e66a;
}

.wallpaper-page {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: auto;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  scrollbar-width: thin;
}

.wallpaper-page::-webkit-scrollbar {
  width: 9px;
}

.wallpaper-page::-webkit-scrollbar-track {
  background: transparent;
}

.wallpaper-page::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
}

.wallpaper-page--explore {
  padding: 136px clamp(56px, 6.5vw, 90px) 140px;
}

.wallpaper-page--media {
  padding: 112px clamp(52px, 5vw, 72px) 120px;
}

.wallpaper-page__intro p {
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 20px;
  font-weight: 800;
}

.wallpaper-page__intro h1,
.wallpaper-media-heading h1 {
  margin: 0;
  color: #fff;
  font-family: var(--wallpaper-display);
  font-size: clamp(42px, 4.2vw, 62px);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: 0;
}

.wallpaper-page__intro > span {
  display: block;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 20px;
  font-weight: 700;
}

.wallpaper-search {
  display: flex;
  width: min(560px, 100%);
  height: 48px;
  align-items: center;
  gap: 14px;
  margin-top: 36px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(17, 19, 22, 0.36);
  padding: 0 22px;
  color: rgba(255, 255, 255, 0.56);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.wallpaper-search svg {
  width: 21px;
  height: 21px;
}

.wallpaper-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff;
  font-size: 19px;
  font-weight: 700;
}

.wallpaper-search input::placeholder {
  color: rgba(255, 255, 255, 0.54);
}

.wallpaper-popular {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
}

.wallpaper-popular > span {
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  font-weight: 900;
}

.wallpaper-popular button,
.wallpaper-categories button {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}

.wallpaper-popular button {
  height: 37px;
  padding: 0 17px;
}

.wallpaper-popular button.is-selected {
  background: rgba(255, 255, 255, 0.19);
  color: rgba(255, 255, 255, 0.9);
}

.wallpaper-categories {
  display: flex;
  max-width: 1120px;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 42px;
}

.wallpaper-categories button {
  display: flex;
  height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 16px 0 5px;
  background: rgba(255, 255, 255, 0.12);
}

.wallpaper-categories button.is-active {
  background: rgba(255, 255, 255, 0.98);
  color: #171717;
}

.wallpaper-categories img,
.wallpaper-categories i {
  width: 31px;
  height: 31px;
  border-radius: 999px;
  object-fit: cover;
}

.wallpaper-categories i {
  background: linear-gradient(135deg, #dfe7ec, #506673);
}

.wallpaper-results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 34px;
}

.wallpaper-results-bar strong {
  color: rgba(255, 255, 255, 0.55);
  font-size: 18px;
  font-weight: 900;
}

.wallpaper-results-bar button {
  display: flex;
  height: 39px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: rgba(255, 255, 255, 0.75);
  padding: 0 16px;
  font-size: 16px;
  font-weight: 900;
}

.wallpaper-results-bar svg {
  width: 18px;
  height: 18px;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
  margin-top: 18px;
}

.wallpaper-explore-card {
  position: relative;
  min-height: 315px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 18px;
  background: rgba(12, 14, 13, 0.4);
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.18);
}

.wallpaper-explore-card > img {
  width: 100%;
  height: 73%;
  object-fit: cover;
}

.wallpaper-explore-card__info {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 88px;
  background: rgba(21, 25, 20, 0.88);
  padding: 20px 19px 16px;
}

.wallpaper-explore-card__info h2 {
  margin: 0 0 12px;
  font-family: var(--wallpaper-display);
  font-size: 20px;
  line-height: 1;
}

.wallpaper-explore-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 900;
}

.wallpaper-author {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.wallpaper-author i {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.82);
  font-style: normal;
  font-size: 11px;
}

.wallpaper-tag,
.wallpaper-stats em {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  padding: 3px 8px;
  color: rgba(255, 255, 255, 0.48);
  font-style: normal;
}

.wallpaper-stats {
  display: flex;
  margin-left: auto;
  align-items: center;
  gap: 13px;
}

.wallpaper-stats b {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #ff4f70;
}

.wallpaper-stats svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.wallpaper-media-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.wallpaper-media-heading h1 {
  font-size: 42px;
}

.wallpaper-media-heading p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  font-weight: 600;
}

.wallpaper-add-video {
  display: flex;
  height: 41px;
  align-items: center;
  gap: 8px;
  margin-right: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(71, 6, 9, 0.48);
  color: #fff;
  padding: 0 17px;
  font-size: 14px;
  font-weight: 900;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 26px rgba(0, 0, 0, 0.2);
}

.wallpaper-add-video svg {
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.wallpaper-media-tabs {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}

.wallpaper-media-tabs button {
  display: flex;
  height: 28px;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: rgba(255, 255, 255, 0.78);
  padding: 0 13px;
  font-size: 12px;
  font-weight: 900;
}

.wallpaper-media-tabs button.is-active {
  background: rgba(255, 255, 255, 0.98);
  color: #111;
}

.wallpaper-media-tabs svg {
  width: 14px;
  height: 14px;
}

.wallpaper-media-table {
  min-width: 980px;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.68);
}

.wallpaper-media-row {
  display: grid;
  grid-template-columns: 34px 72px minmax(260px, 1.35fr) 96px 120px 96px 116px 84px 86px;
  min-height: 70px;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  font-weight: 700;
}

.wallpaper-media-row--head {
  min-height: 32px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0;
}

.wallpaper-media-row strong {
  color: #fff;
  font-family: var(--wallpaper-display);
  font-size: 14px;
}

.wallpaper-media-preview {
  display: block;
  width: 58px;
  height: 58px;
  border-radius: 999px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.16);
}

.wallpaper-media-preview--pink {
  position: relative;
  background: #ff696e;
}

.wallpaper-media-preview--pink::after {
  content: "";
  position: absolute;
  left: 28px;
  top: 26px;
  width: 12px;
  height: 2px;
  border-radius: 99px;
  background: #141414;
  box-shadow: -4px -2px 0 -1px #141414;
}

.wallpaper-media-row button {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 28px;
  border: 0;
  background: transparent;
  color: #fff;
  font-weight: 900;
}

.wallpaper-media-row button svg {
  width: 16px;
  height: 16px;
  color: #ff494d;
  fill: currentColor;
}

.wallpaper-player {
  position: absolute;
  left: 50%;
  bottom: 24px;
  z-index: 70;
  display: flex;
  width: min(730px, calc(100% - 280px));
  height: 78px;
  align-items: center;
  justify-content: space-between;
  transform: translateX(-50%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(75, 76, 78, 0.56);
  padding: 8px 30px 8px 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 26px 60px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(28px) saturate(1.34);
}

.wallpaper-player--home {
  bottom: 20px;
  width: min(640px, calc(100% - 340px));
  background: rgba(74, 73, 72, 0.62);
}

.wallpaper-player--media {
  bottom: 16px;
  width: min(490px, calc(100% - 360px));
  height: 56px;
  background: rgba(49, 28, 30, 0.58);
  padding: 6px 22px;
}

.wallpaper-player__info {
  display: flex;
  min-width: 190px;
  align-items: center;
  gap: 12px;
}

.wallpaper-player__info img {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  object-fit: cover;
}

.wallpaper-player--media .wallpaper-player__info img {
  width: 44px;
  height: 44px;
  border-radius: 14px;
}

.wallpaper-player__info strong {
  display: block;
  font-family: var(--wallpaper-display);
  font-size: 19px;
  line-height: 1;
}

.wallpaper-player--media .wallpaper-player__info strong {
  font-size: 14px;
}

.wallpaper-player__controls {
  display: flex;
  align-items: center;
  gap: 24px;
}

.wallpaper-player--media .wallpaper-player__controls {
  gap: 18px;
}

.wallpaper-player__controls button {
  display: grid;
  min-width: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  padding: 0;
  cursor: pointer;
}

.wallpaper-player__controls svg {
  width: 24px;
  height: 24px;
  stroke-width: 2.4;
}

.wallpaper-player--media .wallpaper-player__controls svg {
  width: 18px;
  height: 18px;
}

.wallpaper-player__controls button:nth-child(2) svg {
  fill: currentColor;
}

.wallpaper-player__speed {
  color: #fff !important;
  font-size: 16px;
  font-weight: 900;
}

.wallpaper-player--media .wallpaper-player__speed {
  font-size: 11px;
}

.wallpaper-toast {
  position: absolute;
  right: 28px;
  bottom: 104px;
  z-index: 90;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(18, 19, 22, 0.62);
  color: rgba(255, 255, 255, 0.92);
  padding: 11px 16px;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(22px);
}

@media (max-width: 1080px) {
  section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-center-"] button {
    min-width: 72px;
    padding: 0 12px;
  }

  .wallpaper-page--explore,
  .wallpaper-page--media {
    padding-left: 34px;
    padding-right: 34px;
  }

  .wallpaper-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wallpaper-player {
    width: calc(100% - 90px);
  }
}

@media (max-width: 760px) {
  section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-leading-"],
  section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] {
    display: none;
  }

  section[data-app-id="wallpaper"] > header > div:nth-of-type(2) {
    justify-content: center;
    padding: 0 12px 0 80px;
  }

  .wallpaper-home__content {
    bottom: 250px;
    width: calc(100% - 96px);
  }

  .wallpaper-recommendations {
    padding-left: 28px;
    padding-right: 28px;
  }

  .wallpaper-grid {
    grid-template-columns: 1fr;
  }

  .wallpaper-player {
    width: calc(100% - 32px);
    gap: 18px;
    padding: 8px 18px;
  }

  .wallpaper-player__controls {
    gap: 14px;
  }
}
`;
