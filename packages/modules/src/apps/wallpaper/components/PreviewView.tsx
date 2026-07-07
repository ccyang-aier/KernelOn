'use client';

import { Check, Heart, Play } from 'lucide-react';

import type { WallpaperAsset } from '../types';

export function PreviewView({
  isApplied,
  isLiked,
  onApply,
  onLike,
  wallpaper,
  wallpaperImage,
}: Readonly<{
  isApplied: boolean;
  isLiked: boolean;
  onApply(id: string): void;
  onLike(id: string): void;
  wallpaper: WallpaperAsset;
  wallpaperImage: string;
}>) {
  return (
    <section aria-label={`Preview ${wallpaper.title}`} className="wallpaper-preview">
      {wallpaper.placeholder === 'pink' ? (
        <i className="wallpaper-preview__placeholder" />
      ) : (
        <img alt="" className="wallpaper-preview__image" draggable={false} src={wallpaperImage} />
      )}
      <div className="wallpaper-preview__shade" />

      <div className="wallpaper-preview__content">
        <h1>{wallpaper.title}</h1>
        <p>{wallpaper.category}</p>
        <div className="wallpaper-preview__meta">
          <span>Author: {wallpaper.author}</span>
          <span>Size: {wallpaper.size}</span>
          <span>Resolution: {wallpaper.resolution}</span>
          <span>Likes: {isLiked ? wallpaper.likes + 1 : wallpaper.likes}</span>
        </div>
        <div className="wallpaper-preview__actions">
          <button
            aria-label={`${isLiked ? 'Unlike' : 'Like'} ${wallpaper.title}`}
            aria-pressed={isLiked}
            className="wallpaper-preview__icon-button"
            onClick={() => onLike(wallpaper.id)}
            type="button"
          >
            <Heart aria-hidden="true" className={isLiked ? 'wallpaper-icon--fill' : undefined} />
          </button>
          <button
            className="wallpaper-preview__apply-button"
            onClick={() => onApply(wallpaper.id)}
            type="button"
          >
            {isApplied ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}
            <span>{isApplied ? 'Applied to Desktop' : 'Set as Wallpaper'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
