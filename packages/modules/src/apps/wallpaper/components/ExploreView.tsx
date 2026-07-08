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
  duration: '时长',
  liked: '最受欢迎',
  newest: '最新',
};

const categoryLabels: Partial<Record<CategoryId, string>> = {
  All: '全部',
  Animals: '动物',
  Anime: '动漫',
  Cars: '汽车',
  Games: '游戏',
  Graphics: '图形',
  Minimalist: '极简',
  Movies: '电影',
  Nature: '自然',
  Other: '其他',
  People: '人物',
  PixelArt: '像素',
  SciFi: '科幻',
  Space: '宇宙',
  Winter: '冬日',
};

const popularTagLabels = new Map<string, string>([
  ['Ultrawide', '超宽屏'],
  ['DesktopHut', '桌面精选'],
  ['Loop', '循环'],
  ['Aesthetic', '美学'],
]);

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
      aria-label="探索壁纸库"
      className="wallpaper-page wallpaper-page--explore"
    >
      <div className="wallpaper-page__intro">
        <p>
          今晚好 <span aria-hidden="true">{'\u{1F44B}'}</span>
        </p>
        <h1>探索壁纸库</h1>
        <span>为你的桌面挑选清爽、耐看的动态壁纸</span>
      </div>

      <label className="wallpaper-search">
        <Search aria-hidden="true" />
        <input
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="搜索壁纸..."
          ref={searchInputRef}
          type="search"
          value={query}
        />
      </label>

      <div className="wallpaper-popular">
        <span>热门：</span>
        {popularTags.map((tag) => (
          <button
            aria-pressed={selectedPopularTag === tag}
            className={selectedPopularTag === tag ? 'is-selected' : undefined}
            key={tag}
            onClick={() => onPopularTagChange(tag)}
            type="button"
          >
            {popularTagLabels.get(tag) ?? tag}
          </button>
        ))}
      </div>

      <div className="wallpaper-categories" aria-label="壁纸分类">
        {categories.map((category) => (
          <button
            aria-pressed={selectedCategory === category.id}
            className={selectedCategory === category.id ? 'is-active' : undefined}
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            type="button"
          >
            {category.image ? <img alt="" draggable={false} src={category.image} /> : <i />}
            {categoryLabels[category.id] ?? category.id}
          </button>
        ))}
      </div>

      <div className="wallpaper-results-bar">
        <strong>{resultLabel}</strong>
        <button aria-label={`按${sortLabels[sort]}排序`} onClick={onSortCycle} type="button">
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
          <div className="wallpaper-empty-state">没有匹配的壁纸</div>
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
      aria-label={`预览 ${wallpaper.title}`}
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
      <span className="wallpaper-explore-card__view">查看壁纸</span>
      <div className="wallpaper-explore-card__info">
        <h2>{wallpaper.title}</h2>
        <div className="wallpaper-explore-card__meta">
          <span className="wallpaper-tag">
            {categoryLabels[wallpaper.category] ?? wallpaper.category}
          </span>
          <button
            aria-label={`${isLiked ? '取消喜欢' : '喜欢'} ${wallpaper.title}`}
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
        </div>
      </div>
    </article>
  );
}
