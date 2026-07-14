import type { DesktopWallpaperDescriptor } from '@kernelon/shell';

import type { WallpaperAsset } from './types';

export function wallpaperPoster(asset: WallpaperAsset): string {
  return asset.posterUrl || asset.thumb || asset.image;
}

export function toDesktopWallpaper(
  asset: WallpaperAsset,
  apiBaseUrl: string,
): DesktopWallpaperDescriptor {
  const posterUrl = resolveUrl(asset.posterUrl || asset.image, apiBaseUrl);
  const sources = (asset.sources?.length ? asset.sources : [{ url: asset.image, mimeType: 'image/*' }])
    .map((source) => ({
      ...source,
      url: resolveUrl(source.url || source.mediaPath || asset.image, apiBaseUrl),
    }))
    .filter((source) => Boolean(source.url));

  return {
    id: asset.id,
    mediaType: asset.mediaType || 'image',
    posterUrl,
    sources,
    provider: asset.provider || 'system',
    externalId: asset.externalId || asset.id,
    attribution: asset.attribution || asset.author,
    license: asset.licenseName,
  };
}

export function resolveUrl(value: string, apiBaseUrl: string): string {
  if (!value || /^(?:https?:|blob:|data:)/i.test(value)) return value;
  if (value.startsWith('/wallpaper-')) return `${apiBaseUrl}${value}`;
  return value;
}
