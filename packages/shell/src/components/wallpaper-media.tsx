'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { DesktopWallpaper } from '../wallpaper';
import { wallpaperPoster } from '../wallpaper';

export function WallpaperMedia({
  active = true,
  alt = '',
  className,
  testId,
  wallpaper,
}: Readonly<{
  active?: boolean;
  alt?: string;
  className?: string;
  testId?: string;
  wallpaper: DesktopWallpaper;
}>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const descriptor = typeof wallpaper === 'string' ? null : wallpaper;
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const saveData =
    typeof navigator !== 'undefined' &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

  useEffect(() => {
    setFailed(false);
  }, [wallpaper]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const syncPlayback = () => {
      if (!active || document.hidden) {
        video.pause();
      } else {
        void video.play().catch(() => setFailed(true));
      }
    };

    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => document.removeEventListener('visibilitychange', syncPlayback);
  }, [active, descriptor?.id]);

  if (!descriptor || descriptor.mediaType === 'image' || failed || reducedMotion || saveData) {
    return (
      <img
        alt={alt}
        className={className}
        data-testid={testId}
        draggable={false}
        src={wallpaperPoster(wallpaper)}
      />
    );
  }

  return (
    <video
      aria-label={alt || undefined}
      autoPlay={active}
      className={className}
      data-testid={testId}
      loop
      muted
      onError={() => setFailed(true)}
      playsInline
      poster={descriptor.posterUrl}
      preload="metadata"
      ref={videoRef}
    >
      {descriptor.sources.map((source) => (
        <source key={`${source.mimeType}:${source.url}`} src={source.url} type={source.mimeType} />
      ))}
    </video>
  );
}
