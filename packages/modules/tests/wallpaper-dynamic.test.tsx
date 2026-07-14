import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExploreView } from '../src/apps/wallpaper/components/ExploreView';
import { HomeView } from '../src/apps/wallpaper/components/HomeView';
import type { HeroSlide } from '../src/apps/wallpaper/types';

const dynamicSlide: HeroSlide = {
  id: 'nasa:demo',
  provider: 'nasa',
  externalId: 'demo',
  mediaType: 'video',
  posterUrl: 'https://example.test/poster.jpg',
  sources: [{ url: 'https://example.test/demo.mp4', mimeType: 'video/mp4' }],
  title: 'Earth in motion',
  category: 'Space',
  categoryLabel: '动态壁纸',
  author: 'NASA',
  authorInitial: 'N',
  image: 'https://example.test/poster.jpg',
  device: 'nasa',
  duration: '0:12',
  durationSeconds: 12,
  resolution: '1920x1080',
  size: 'Direct source',
  likes: 3,
  tags: ['Earth'],
  uploadedAt: '2026-01-01T00:00:00Z',
  liked: false,
  meta: ['1920x1080', 'NASA', '0:12'],
};

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly scrollMargin = '0px';
    readonly thresholds = [0];
    disconnect = vi.fn();
    observe = vi.fn();
    takeRecords = vi.fn(() => []);
    unobserve = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('dynamic wallpaper discovery', () => {
  it('renders a dynamic provider result as the home hero', () => {
    render(
      <HomeView
        hasMore={false}
        heroIndex={0}
        isLoadingMore={false}
        likedIds={new Set()}
        onHeroDotSelect={vi.fn()}
        onHeroNav={vi.fn()}
        onLike={vi.fn()}
        onLoadMore={vi.fn()}
        onPreview={vi.fn()}
        onRecommendationPreview={vi.fn()}
        recommendationSections={[]}
        selectedRecommendedId=""
        showHeroDetails
        slides={[dynamicSlide]}
      />,
    );
    expect(screen.getByText('Earth in motion')).toBeTruthy();
    expect(document.querySelector('.wallpaper-home__image')?.tagName).toBe('VIDEO');
  });

  it('shows independent search and bottom-loading feedback in Explore', () => {
    render(
      <ExploreView
        categories={[{ id: 'All' }]}
        hasMore
        isLoadingMore
        isSearching
        likedIds={new Set()}
        loadError={null}
        onCategoryChange={vi.fn()}
        onLike={vi.fn()}
        onLoadMore={vi.fn()}
        onPopularTagChange={vi.fn()}
        onQueryChange={vi.fn()}
        onSelectWallpaper={vi.fn()}
        onSortCycle={vi.fn()}
        popularTags={['Loop']}
        query="earth"
        resultLabel="1 张壁纸"
        searchInputRef={{ current: null }}
        selectedCategory="All"
        selectedPopularTag="Loop"
        selectedWallpaperId=""
        sort="newest"
        wallpapers={[dynamicSlide]}
      />,
    );
    expect(screen.getByLabelText('正在搜索')).toBeTruthy();
    expect(screen.getByText('正在加载更多壁纸…')).toBeTruthy();
  });
});
// @vitest-environment jsdom
