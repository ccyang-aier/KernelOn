export type WallpaperView = 'home' | 'explore' | 'settings';

export type CategoryId =
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

export type ExploreSort = 'newest' | 'liked' | 'duration';

export interface CategoryOption {
  id: CategoryId;
  image?: string;
}

export interface WallpaperAsset {
  id: string;
  title: string;
  category: CategoryId;
  author: string;
  authorInitial: string;
  image: string;
  thumb?: string;
  device: string;
  duration: string;
  durationSeconds: number;
  resolution: string;
  size: string;
  likes: number;
  tags: string[];
  uploadedAt: string;
  liked: boolean;
  placeholder?: 'pink';
}

export interface HeroSlide extends WallpaperAsset {
  categoryLabel: string;
  meta: string[];
}

export interface RecommendedWallpaper {
  id: string;
  title: string;
  device: string;
  image: string;
  sourceWallpaperId: string;
}
