'use client';

import { Folder, HardDrive, Heart, PlusCircle } from 'lucide-react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';

import type { MediaFilter, WallpaperAsset } from '../types';

export function MyMediaView({
  filter,
  likedIds,
  onAddVideo,
  onFilterChange,
  onSelectWallpaper,
  onToggleLike,
  rows,
  selectedWallpaperId,
  totalCount,
}: Readonly<{
  filter: MediaFilter;
  likedIds: ReadonlySet<string>;
  onAddVideo(): void;
  onFilterChange(filter: MediaFilter): void;
  onSelectWallpaper(id: string): void;
  onToggleLike(id: string): void;
  rows: WallpaperAsset[];
  selectedWallpaperId: string;
  totalCount: number;
}>) {
  return (
    <section aria-label="My Media" className="wallpaper-page wallpaper-page--media">
      <div className="wallpaper-media-heading">
        <div>
          <h1>My Media</h1>
          <p>{totalCount} wallpapers</p>
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

      <div className="wallpaper-media-table-wrap">
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
          {rows.length ? (
            rows.map((item, index) => (
              <MediaRow
                index={index + 1}
                isLiked={likedIds.has(item.id)}
                isSelected={selectedWallpaperId === item.id}
                item={item}
                key={item.id}
                onSelect={onSelectWallpaper}
                onToggleLike={onToggleLike}
              />
            ))
          ) : (
            <div className="wallpaper-empty-state">No media in this view.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function MediaRow({
  index,
  isLiked,
  isSelected,
  item,
  onSelect,
  onToggleLike,
}: Readonly<{
  index: number;
  isLiked: boolean;
  isSelected: boolean;
  item: WallpaperAsset;
  onSelect(id: string): void;
  onToggleLike(id: string): void;
}>) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  return (
    <div
      aria-label={`Select ${item.title}`}
      aria-pressed={isSelected}
      className={isSelected ? 'wallpaper-media-row is-selected' : 'wallpaper-media-row'}
      onClick={() => onSelect(item.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <span>{index}</span>
      <span>
        {item.placeholder === 'pink' ? (
          <i className="wallpaper-media-preview wallpaper-media-preview--pink" />
        ) : (
          <img alt="" className="wallpaper-media-preview" draggable={false} src={item.image} />
        )}
      </span>
      <strong>{item.title}</strong>
      <span>{item.category}</span>
      <span>{item.author}</span>
      <span>{item.duration}</span>
      <span>{item.resolution}</span>
      <span>{item.size}</span>
      <button
        aria-label={`${isLiked ? 'Unlike' : 'Like'} ${item.title}`}
        aria-pressed={isLiked}
        className="wallpaper-media-like"
        onClick={(event) => {
          event.stopPropagation();
          onToggleLike(item.id);
        }}
        type="button"
      >
        {isLiked ? item.likes + 1 : item.likes}
        <Heart aria-hidden="true" />
      </button>
    </div>
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
