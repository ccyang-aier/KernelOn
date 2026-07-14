export type WallpaperMediaType = 'image' | 'video';

export interface WallpaperMediaSource {
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  bitrate?: number;
}

export interface DesktopWallpaperDescriptor {
  id: string;
  mediaType: WallpaperMediaType;
  posterUrl: string;
  sources: WallpaperMediaSource[];
  provider?: string;
  externalId?: string;
  attribution?: string;
  license?: string;
}

export type DesktopWallpaper = string | DesktopWallpaperDescriptor;

export function wallpaperPoster(wallpaper: DesktopWallpaper): string {
  return typeof wallpaper === 'string' ? wallpaper : wallpaper.posterUrl;
}
