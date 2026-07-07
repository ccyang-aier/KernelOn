'use client';

import { ChevronLeft, ChevronRight, Heart, Play } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import { HeroGlassAction } from './HeroGlassAction';
import type { HeroSlide, RecommendedWallpaperSection } from '../types';

export function HomeView({
  heroIndex,
  likedIds,
  onHeroDotSelect,
  onHeroNav,
  onLike,
  onPreview,
  onRecommendationSelect,
  recommendationSections,
  selectedRecommendedId,
  slides,
}: Readonly<{
  heroIndex: number;
  likedIds: ReadonlySet<string>;
  onHeroDotSelect(index: number): void;
  onHeroNav(direction: 1 | -1): void;
  onLike(id: string): void;
  onPreview(id: string): void;
  onRecommendationSelect(wallpaperId: string): void;
  recommendationSections: RecommendedWallpaperSection[];
  selectedRecommendedId: string;
  slides: HeroSlide[];
}>) {
  const activeHero = slides[heroIndex] ?? slides[0];
  const trackStyle = {
    transform: `translateX(-${heroIndex * 100}%)`,
  } satisfies CSSProperties;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      onHeroNav(-1);
    }

    if (event.key === 'ArrowRight') {
      onHeroNav(1);
    }
  };

  return (
    <section
      aria-label="Wallpaper Home"
      className="wallpaper-home"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="wallpaper-home__hero">
        <div
          aria-live="polite"
          className="wallpaper-home__track"
          data-wallpaper-hero-index={heroIndex}
          style={trackStyle}
        >
          {slides.map((slide) => (
            <figure className="wallpaper-home__slide" key={slide.id}>
              <img alt="" className="wallpaper-home__image" draggable={false} src={slide.image} />
              <div className="wallpaper-home__shade" />
            </figure>
          ))}
        </div>

        <div className="wallpaper-home__content">
          <span className="wallpaper-home__category">{activeHero.categoryLabel}</span>
          <h1>{activeHero.title}</h1>
          <div className="wallpaper-home__meta">
            {activeHero.meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
            <span className="wallpaper-home__badge">4K</span>
          </div>
          <div className="wallpaper-home__actions">
            <HeroGlassAction variant="preview">
              <button
                className="wallpaper-home__glass-button wallpaper-home__glass-button--preview"
                onClick={() => onPreview(activeHero.id)}
                type="button"
              >
                <Play aria-hidden="true" className="wallpaper-icon wallpaper-icon--fill" />
                <span>View Wallper</span>
              </button>
            </HeroGlassAction>
            <HeroGlassAction variant="like">
              <button
                aria-pressed={likedIds.has(activeHero.id)}
                className="wallpaper-home__glass-button wallpaper-home__glass-button--like"
                onClick={() => onLike(activeHero.id)}
                type="button"
              >
                <Heart
                  aria-hidden="true"
                  className={
                    likedIds.has(activeHero.id)
                      ? 'wallpaper-icon wallpaper-icon--fill'
                      : 'wallpaper-icon'
                  }
                />
                <span>{likedIds.has(activeHero.id) ? activeHero.likes + 1 : activeHero.likes}</span>
              </button>
            </HeroGlassAction>
          </div>
        </div>

        <button
          aria-label="Previous wallpaper"
          className="wallpaper-home__arrow wallpaper-home__arrow--prev"
          onClick={() => onHeroNav(-1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          aria-label="Next wallpaper"
          className="wallpaper-home__arrow wallpaper-home__arrow--next"
          onClick={() => onHeroNav(1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" />
        </button>

        <div className="wallpaper-home__pagination" role="tablist">
          {slides.map((slide, index) => (
            <button
              aria-label={`Show wallpaper ${index + 1}: ${slide.title}`}
              aria-selected={index === heroIndex}
              className={index === heroIndex ? 'is-active' : undefined}
              key={slide.id}
              onClick={() => onHeroDotSelect(index)}
              role="tab"
              type="button"
            />
          ))}
        </div>
      </div>

      <section className="wallpaper-recommendations" aria-label="Recommended wallpapers">
        {recommendationSections.map((section) => (
          <div className="wallpaper-recommendation-row" key={section.id}>
            <div className="wallpaper-recommendations__title-row">
              <h2>
                {section.title}
                <ChevronRight aria-hidden="true" />
              </h2>
            </div>
            <div className="wallpaper-carousel">
              {section.items.map((item, index) => {
                const selected = selectedRecommendedId === item.sourceWallpaperId;
                const featured = index === 0;

                return (
                  <button
                    aria-pressed={selected}
                    className={[
                      'wallpaper-carousel-card',
                      featured ? 'has-overlay' : '',
                      selected ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={item.id}
                    onClick={() => onRecommendationSelect(item.sourceWallpaperId)}
                    type="button"
                  >
                    <img alt="" draggable={false} src={item.image} />
                    <div className="wallpaper-card-glass-label">
                      <strong>{item.title}</strong>
                      <span>
                        <i />
                        {item.device}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </section>
  );
}
