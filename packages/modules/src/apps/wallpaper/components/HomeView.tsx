'use client';

import { ChevronLeft, ChevronRight, Heart, Play } from 'lucide-react';
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useRef,
} from 'react';

import { HeroFrostedAction } from './HeroFrostedAction';
import type { HeroSlide, RecommendedWallpaperSection } from '../types';

export function HomeView({
  heroIndex,
  likedIds,
  onHeroDotSelect,
  onHeroNav,
  onLike,
  onPreview,
  onRecommendationPreview,
  recommendationSections,
  selectedRecommendedId,
  showHeroDetails,
  slides,
}: Readonly<{
  heroIndex: number;
  likedIds: ReadonlySet<string>;
  onHeroDotSelect(index: number): void;
  onHeroNav(direction: 1 | -1): void;
  onLike(id: string): void;
  onPreview(id: string): void;
  onRecommendationPreview(wallpaperId: string): void;
  recommendationSections: RecommendedWallpaperSection[];
  selectedRecommendedId: string;
  showHeroDetails: boolean;
  slides: HeroSlide[];
}>) {
  const heroSwipeRef = useRef<HeroSwipeState | null>(null);
  const activeHero = slides[heroIndex] ?? slides[0];
  const trackStyle = {
    transform: `translate3d(calc(-${heroIndex * 100}% + var(--wallpaper-hero-drag-x, 0px)), 0, 0)`,
  } satisfies CSSProperties;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      onHeroNav(-1);
    }

    if (event.key === 'ArrowRight') {
      onHeroNav(1);
    }
  };

  const handleHeroPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isInteractiveSwipeTarget(event.target)) {
      return;
    }

    heroSwipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: event.timeStamp,
    };
    event.currentTarget.style.setProperty('--wallpaper-hero-drag-x', '0px');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = heroSwipeRef.current;

    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const rawOffsetX = event.clientX - swipe.startX;
    const offsetX = Math.abs(rawOffsetX);
    const offsetY = Math.abs(event.clientY - swipe.startY);

    if (offsetX > 5 && offsetX > offsetY) {
      event.preventDefault();
      event.currentTarget.dataset.wallpaperHeroDragging = 'true';
      const dampenedOffset = Math.max(-132, Math.min(132, rawOffsetX * 0.72));

      event.currentTarget.style.setProperty('--wallpaper-hero-drag-x', `${dampenedOffset}px`);
    }
  };

  const handleHeroPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = heroSwipeRef.current;

    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    heroSwipeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const offsetX = event.clientX - swipe.startX;
    const offsetY = event.clientY - swipe.startY;
    const elapsed = Math.max(1, event.timeStamp - swipe.startedAt);
    const horizontalIntent = Math.abs(offsetX) > Math.abs(offsetY) * 1.12;
    const passedDistance = Math.abs(offsetX) >= 36;
    const passedFlick = Math.abs(offsetX) >= 18 && Math.abs(offsetX) / elapsed >= 0.28;

    event.currentTarget.removeAttribute('data-wallpaper-hero-dragging');
    event.currentTarget.style.setProperty('--wallpaper-hero-drag-x', '0px');

    if (!horizontalIntent || (!passedDistance && !passedFlick)) {
      return;
    }

    onHeroNav(offsetX < 0 ? 1 : -1);
  };

  const handleHeroPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = heroSwipeRef.current;

    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    heroSwipeRef.current = null;
    event.currentTarget.removeAttribute('data-wallpaper-hero-dragging');
    event.currentTarget.style.setProperty('--wallpaper-hero-drag-x', '0px');
  };

  return (
    <section
      aria-label="Wallpaper Home"
      className="wallpaper-home"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="wallpaper-home__hero"
        data-wallpaper-hero-swipe="true"
        onPointerCancel={handleHeroPointerCancel}
        onPointerDown={handleHeroPointerDown}
        onPointerMove={handleHeroPointerMove}
        onPointerUp={handleHeroPointerUp}
      >
        <div
          aria-live="polite"
          className="wallpaper-home__track"
          data-wallpaper-hero-index={heroIndex}
          style={trackStyle}
        >
          {slides.map((slide) => (
            <figure className="wallpaper-home__slide" key={slide.id}>
              <img
                alt=""
                className="wallpaper-home__image"
                crossOrigin="anonymous"
                draggable={false}
                src={slide.image}
              />
              <div className="wallpaper-home__shade" />
            </figure>
          ))}
        </div>

        <div className="wallpaper-home__content">
          {showHeroDetails ? (
            <span className="wallpaper-home__category">{activeHero.categoryLabel}</span>
          ) : null}
          <h1>{activeHero.title}</h1>
          {showHeroDetails ? (
            <div className="wallpaper-home__meta">
              {activeHero.meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
              <span className="wallpaper-home__badge">4K</span>
            </div>
          ) : null}
          <div className="wallpaper-home__actions">
            <HeroFrostedAction variant="preview">
              <button
                className="wallpaper-home__frosted-button wallpaper-home__frosted-button--preview"
                onClick={() => onPreview(activeHero.id)}
                type="button"
              >
                <Play aria-hidden="true" className="wallpaper-icon wallpaper-icon--fill" />
                <span>View Wallpaper</span>
              </button>
            </HeroFrostedAction>
            <HeroFrostedAction variant="like">
              <button
                aria-pressed={likedIds.has(activeHero.id)}
                className="wallpaper-home__frosted-button wallpaper-home__frosted-button--like"
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
            </HeroFrostedAction>
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
              {section.items.map((item) => {
                const selected = selectedRecommendedId === item.sourceWallpaperId;

                return (
                  <button
                    aria-pressed={selected}
                    className={['wallpaper-carousel-card', selected ? 'is-selected' : '']
                      .filter(Boolean)
                      .join(' ')}
                    key={item.id}
                    onClick={() => onRecommendationPreview(item.sourceWallpaperId)}
                    type="button"
                  >
                    <img alt="" draggable={false} src={item.image} />
                    <span className="wallpaper-card-glass-label">View Wallpaper</span>
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

type HeroSwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
};

function isInteractiveSwipeTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('button, a, input, textarea, select, [role="button"]'))
  );
}
