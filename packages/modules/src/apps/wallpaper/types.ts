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
  mediaType?: 'image' | 'video';
  provider?: string;
  externalId?: string;
  posterUrl?: string;
  sources?: WallpaperMediaSource[];
  sourcePageUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  attribution?: string;
  canImport?: boolean;
  sizeBytes?: number | null;
}

export interface WallpaperMediaSource {
  url?: string;
  mediaPath?: string;
  mimeType: string;
  quality?: string;
  width?: number;
  height?: number;
  bitrate?: number;
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

export interface RecommendedWallpaperSection {
  id: string;
  title: string;
  items: RecommendedWallpaper[];
}

export interface WallpaperSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  isSystem: boolean;
  description: string;
  visible?: boolean;
  configured?: boolean;
  delivery?: 'hotlink' | 'stored';
  mediaTypes?: Array<'image' | 'video'>;
}

export interface WallpaperStorageUsage {
  user: { usedBytes: number; limitBytes: number };
  organization: { usedBytes: number; limitBytes: number };
  platform: { usedBytes: number; limitBytes: number };
  temporaryLimitBytes: number;
  backend: 'local' | 's3';
  processingMode: 'passthrough' | 'transcode';
}
