'use client';

import { ArrowDownUp, Heart, Search } from 'lucide-react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from 'react';

import type {
  CategoryId,
  CategoryOption,
  ExploreSort,
  WallpaperAsset,
} from '../types';

const sortLabels: Record<ExploreSort, string> = {
  duration: 'Duration',
  liked: 'Most Liked',
  newest: 'Newest',
};

export function ExploreView({
  categories,
  likedIds,
  onCategoryChange,
  onLike,
  onPopularTagChange,
  onQueryChange,
  onSelectWallpaper,
  onSortCycle,
  popularTags,
  query,
  resultLabel,
  searchInputRef,
  selectedCategory,
  selectedPopularTag,
  selectedWallpaperId,
  sort,
  wallpapers,
}: Readonly<{
  categories: CategoryOption[];
  likedIds: ReadonlySet<string>;
  onCategoryChange(category: CategoryId): void;
  onLike(id: string): void;
  onPopularTagChange(tag: string): void;
  onQueryChange(query: string): void;
  onSelectWallpaper(id: string): void;
  onSortCycle(): void;
  popularTags: string[];
  query: string;
  resultLabel: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  selectedCategory: CategoryId;
  selectedPopularTag: string;
  selectedWallpaperId: string;
  sort: ExploreSort;
  wallpapers: WallpaperAsset[];
}>) {
  return (
    <section
      aria-label="Explore Wallpaper Library"
      className="wallpaper-page wallpaper-page--explore"
    >
      <div className="wallpaper-page__intro">
        <p>
          Good Night <span aria-hidden="true">{'\u{1F44B}'}</span>
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
        <strong>{resultLabel}</strong>
        <button aria-label={`Sort wallpapers by ${sortLabels[sort]}`} onClick={onSortCycle} type="button">
          <ArrowDownUp aria-hidden="true" />
          {sortLabels[sort]}
        </button>
      </div>

      <div className="wallpaper-grid">
        {wallpapers.length ? (
          wallpapers.map((wallpaper) => (
            <ExploreCard
              isLiked={likedIds.has(wallpaper.id)}
              isSelected={selectedWallpaperId === wallpaper.id}
              key={wallpaper.id}
              onLike={onLike}
              onSelect={onSelectWallpaper}
              wallpaper={wallpaper}
            />
          ))
        ) : (
          <div className="wallpaper-empty-state">No wallpapers match this filter.</div>
        )}
      </div>
    </section>
  );
}

function ExploreCard({
  isLiked,
  isSelected,
  onLike,
  onSelect,
  wallpaper,
}: Readonly<{
  isLiked: boolean;
  isSelected: boolean;
  onLike(id: string): void;
  onSelect(id: string): void;
  wallpaper: WallpaperAsset;
}>) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(wallpaper.id);
    }
  };

  return (
    <article
      aria-label={`Preview ${wallpaper.title}`}
      aria-pressed={isSelected}
      className={isSelected ? 'wallpaper-explore-card is-selected' : 'wallpaper-explore-card'}
      onClick={() => onSelect(wallpaper.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {wallpaper.placeholder === 'pink' ? (
        <i className="wallpaper-explore-placeholder" />
      ) : (
        <img alt="" draggable={false} src={wallpaper.image} />
      )}
      <div className="wallpaper-explore-card__info">
        <h2>{wallpaper.title}</h2>
        <div className="wallpaper-explore-card__meta">
          <span className="wallpaper-author">
            <i>{wallpaper.authorInitial}</i>
            {wallpaper.author}
          </span>
          <span className="wallpaper-tag">{wallpaper.category}</span>
          <span className="wallpaper-stats">
            <button
              aria-label={`${isLiked ? 'Unlike' : 'Like'} ${wallpaper.title}`}
              aria-pressed={isLiked}
              className="wallpaper-like-button"
              onClick={(event) => {
                event.stopPropagation();
                onLike(wallpaper.id);
              }}
              type="button"
            >
              <Heart aria-hidden="true" />
              {isLiked ? wallpaper.likes + 1 : wallpaper.likes}
            </button>
            <em>{wallpaper.duration}</em>
          </span>
        </div>
      </div>
    </article>
  );
}
