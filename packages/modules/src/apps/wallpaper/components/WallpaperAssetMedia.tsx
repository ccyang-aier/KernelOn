'use client';

import { WallpaperMedia } from '@kernelon/shell';

import { useKernelOnRuntimeConfig } from '../../../runtime-config';
import { toDesktopWallpaper } from '../media';
import type { WallpaperAsset } from '../types';

export function WallpaperAssetMedia({
  active = true,
  alt = '',
  asset,
  className,
}: Readonly<{
  active?: boolean;
  alt?: string;
  asset: WallpaperAsset;
  className?: string;
}>) {
  const runtime = useKernelOnRuntimeConfig();
  return (
    <WallpaperMedia
      active={active}
      alt={alt}
      className={className}
      wallpaper={toDesktopWallpaper(asset, runtime.apiBaseUrl)}
    />
  );
}
