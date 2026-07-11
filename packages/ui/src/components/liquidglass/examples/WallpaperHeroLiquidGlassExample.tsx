'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
  type RefObject,
} from 'react';

import { LiquidGlass } from '..';

/**
 * Classic example extracted from KernelOn Wallpaper's production experiment.
 *
 * It deliberately keeps the background canvas, shader surface and native
 * button as three separate layers. See README.md in this directory before
 * adapting it: the buffering/readiness code is part of the example, not noise.
 */
export function WallpaperHeroLiquidGlassExample({
  backgroundImage,
  likeCount,
  liked,
  onPreview,
  onToggleLike,
}: Readonly<{
  backgroundImage: string;
  likeCount: number;
  liked: boolean;
  onPreview(): void;
  onToggleLike(): void;
}>) {
  const heroRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  return (
    <section className="liquidglass-hero-example" ref={heroRef}>
      <style>{EXAMPLE_STYLES}</style>
      <img
        alt=""
        aria-hidden="true"
        className="liquidglass-hero-example__image"
        ref={imageRef}
        src={backgroundImage}
      />
      <div className="liquidglass-hero-example__actions">
        <ExampleGlassButton
          backgroundImage={backgroundImage}
          heroRef={heroRef}
          imageRef={imageRef}
          label="View wallpaper"
          onClick={onPreview}
          variant="preview"
        >
          <span aria-hidden="true">▶</span>
          <span>View Wallpaper</span>
        </ExampleGlassButton>
        <ExampleGlassButton
          backgroundImage={backgroundImage}
          heroRef={heroRef}
          imageRef={imageRef}
          label="Like wallpaper"
          onClick={onToggleLike}
          pressed={liked}
          variant="like"
        >
          <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
          <span>{liked ? likeCount + 1 : likeCount}</span>
        </ExampleGlassButton>
      </div>
    </section>
  );
}

function ExampleGlassButton({
  backgroundImage,
  children,
  heroRef,
  imageRef,
  label,
  onClick,
  pressed,
  variant,
}: Readonly<{
  backgroundImage: string;
  children: ReactNode;
  heroRef: RefObject<HTMLElement | null>;
  imageRef: RefObject<HTMLImageElement | null>;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  pressed?: boolean;
  variant: 'like' | 'preview';
}>) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLSpanElement | null>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);
  const [backdropReady, setBackdropReady] = useState(false);
  const [glassReady, setGlassReady] = useState(false);
  const markFirstCommit = useCallback(() => setBackdropReady(true), []);

  useBufferedHeroBackdrop({
    backgroundImage,
    backdropRef,
    heroRef,
    imageRef,
    instanceRef,
    onFirstCommit: markFirstCommit,
    rootRef,
  });

  useEffect(() => {
    const root = rootRef.current;
    const surface = surfaceRef.current;
    if (!root || !surface || !backdropReady) return undefined;

    let cancelled = false;
    let instance: LiquidGlass | null = null;
    let readinessFrame = 0;

    void LiquidGlass.init({ root, glassElements: [surface], prefetchFonts: false }).then(
      (nextInstance) => {
        if (cancelled) {
          nextInstance.destroy();
          return;
        }

        instance = nextInstance;
        instanceRef.current = nextInstance;
        const backdrop = backdropRef.current;
        if (backdrop) nextInstance.markChanged(backdrop);

        let attempts = 0;
        let stableFrames = 0;
        const verify = () => {
          if (cancelled) return;
          attempts += 1;
          stableFrames = hasStableCoreOutput(surface) ? stableFrames + 1 : 0;
          if (stableFrames >= 2) {
            setGlassReady(true);
            return;
          }
          if (attempts < 12) readinessFrame = window.requestAnimationFrame(verify);
        };
        readinessFrame = window.requestAnimationFrame(verify);
      },
    );

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(readinessFrame);
      instance?.destroy();
      instanceRef.current = null;
    };
  }, [backdropReady]);

  return (
    <span
      className={`liquidglass-hero-example__control liquidglass-hero-example__control--${variant}`}
      data-glass-ready={glassReady ? 'true' : 'false'}
      ref={rootRef}
    >
      <canvas
        aria-hidden="true"
        className="liquidglass-hero-example__backdrop"
        ref={backdropRef}
      />
      <span
        aria-hidden="true"
        className="liquidglass-hero-example__surface"
        data-config={createWallpaperHeroFrostedConfig(21)}
        data-liquid-glass-skip-content="true"
        ref={surfaceRef}
      />
      <button
        aria-label={label}
        aria-pressed={pressed}
        className="liquidglass-hero-example__button"
        data-liquid-glass-skip-capture="true"
        onClick={onClick}
        type="button"
      >
        <span className="liquidglass-hero-example__content">{children}</span>
      </button>
    </span>
  );
}

export function createWallpaperHeroFrostedConfig(radius: number): string {
  return JSON.stringify({
    blurAmount: 0.25,
    refraction: 0.69,
    chromAberration: 0.05,
    edgeHighlight: 0.05,
    specular: 0,
    fresnel: 1,
    distortion: 0,
    cornerRadius: radius,
    zRadius: radius,
    opacity: 1,
    saturation: 0,
    tintStrength: 0,
    brightness: 0,
    shadowOpacity: 0.1,
    shadowSpread: 5,
    shadowOffsetY: 1,
    floating: false,
    button: true,
    bevelMode: 0,
  });
}

function useBufferedHeroBackdrop({
  backgroundImage,
  backdropRef,
  heroRef,
  imageRef,
  instanceRef,
  onFirstCommit,
  rootRef,
}: Readonly<{
  backgroundImage: string;
  backdropRef: RefObject<HTMLCanvasElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  imageRef: RefObject<HTMLImageElement | null>;
  instanceRef: RefObject<LiquidGlass | null>;
  onFirstCommit(): void;
  rootRef: RefObject<HTMLElement | null>;
}>): void {
  const stagingRef = useRef<HTMLCanvasElement | null>(null);
  const committedFramesRef = useRef(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const hero = heroRef.current;
    const image = imageRef.current;
    if (!root || !hero || !image) return undefined;

    let frame = 0;
    let followUntil = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const canvas = backdropRef.current;
        if (!canvas || !image.complete || image.naturalWidth === 0) return;

        const rootRect = root.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const intersection = intersect(rootRect, imageRect);
        if (!intersection) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rootRect.width * dpr));
        const height = Math.max(1, Math.round(rootRect.height * dpr));
        const staging = stagingRef.current ?? document.createElement('canvas');
        const stagingContext = staging.getContext('2d', { willReadFrequently: true });
        const outputContext = canvas.getContext('2d');
        if (!stagingContext || !outputContext) return;

        stagingRef.current = staging;
        if (staging.width !== width || staging.height !== height) {
          staging.width = width;
          staging.height = height;
        }
        stagingContext.clearRect(0, 0, width, height);
        drawCoverSample(stagingContext, image, imageRect, rootRect, intersection, dpr);

        // Never replace the visible old frame with transparent/incomplete pixels.
        if (!isFullyOpaque(stagingContext, width, height)) return;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        outputContext.globalCompositeOperation = 'copy';
        outputContext.drawImage(staging, 0, 0);
        outputContext.globalCompositeOperation = 'source-over';
        const firstCommit = committedFramesRef.current === 0;
        committedFramesRef.current += 1;
        canvas.dataset.backdropFrame = String(committedFramesRef.current);
        instanceRef.current?.markChanged(canvas);
        if (firstCommit) onFirstCommit();

        if (window.performance.now() < followUntil) {
          frame = window.requestAnimationFrame(update);
        }
      });
    };
    const followTransition = () => {
      followUntil = window.performance.now() + 620;
      update();
    };
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(root);
    resizeObserver.observe(hero);
    image.addEventListener('load', update);
    hero.addEventListener('transitionrun', followTransition);
    hero.addEventListener('transitionend', update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { capture: true, passive: true });
    update();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      image.removeEventListener('load', update);
      hero.removeEventListener('transitionrun', followTransition);
      hero.removeEventListener('transitionend', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [backgroundImage, backdropRef, heroRef, imageRef, instanceRef, onFirstCommit, rootRef]);
}

function drawCoverSample(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  imageRect: DOMRect,
  rootRect: DOMRect,
  intersection: Rect,
  dpr: number,
): void {
  const scale = Math.max(
    imageRect.width / image.naturalWidth,
    imageRect.height / image.naturalHeight,
  );
  const projectedWidth = image.naturalWidth * scale;
  const projectedHeight = image.naturalHeight * scale;
  const projectedLeft = imageRect.left + (imageRect.width - projectedWidth) / 2;
  const projectedTop = imageRect.top + (imageRect.height - projectedHeight) / 2;

  context.drawImage(
    image,
    (intersection.left - projectedLeft) / scale,
    (intersection.top - projectedTop) / scale,
    intersection.width / scale,
    intersection.height / scale,
    (intersection.left - rootRect.left) * dpr,
    (intersection.top - rootRect.top) * dpr,
    intersection.width * dpr,
    intersection.height * dpr,
  );
}

function intersect(left: DOMRect, right: DOMRect): Rect | null {
  const x = Math.max(left.left, right.left);
  const y = Math.max(left.top, right.top);
  const rightEdge = Math.min(left.right, right.right);
  const bottomEdge = Math.min(left.bottom, right.bottom);

  return rightEdge > x && bottomEdge > y
    ? { height: bottomEdge - y, left: x, top: y, width: rightEdge - x }
    : null;
}

function isFullyOpaque(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  const pixels = context.getImageData(0, 0, width, height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if ((pixels[index] ?? 0) < 250) return false;
  }
  return true;
}

function hasStableCoreOutput(surface: HTMLElement): boolean {
  const output = surface.querySelector('canvas');
  const context = output?.getContext('2d', { willReadFrequently: true });
  if (!output || !context) return false;

  const pixels = context.getImageData(0, 0, output.width, output.height).data;
  const startX = Math.floor(output.width * 0.25);
  const endX = Math.ceil(output.width * 0.75);
  const startY = Math.floor(output.height * 0.25);
  const endY = Math.ceil(output.height * 0.75);
  let sampled = 0;
  let visible = 0;
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      sampled += 1;
      if ((pixels[(y * output.width + x) * 4 + 3] ?? 0) > 8) visible += 1;
    }
  }
  return sampled > 0 && visible / sampled >= 0.8;
}

type Rect = Readonly<{ height: number; left: number; top: number; width: number }>;

const EXAMPLE_STYLES = `
.liquidglass-hero-example { position: relative; min-height: 360px; overflow: hidden; }
.liquidglass-hero-example__image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.liquidglass-hero-example__actions { position: absolute; left: 48px; bottom: 48px; display: flex; gap: 24px; }
.liquidglass-hero-example__control { position: relative; display: block; height: 42px; border-radius: 999px; }
.liquidglass-hero-example__control--preview { width: 190px; }
.liquidglass-hero-example__control--like { width: 80px; }
.liquidglass-hero-example__backdrop,
.liquidglass-hero-example__surface,
.liquidglass-hero-example__button { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; }
.liquidglass-hero-example__backdrop { opacity: 0; pointer-events: none; }
.liquidglass-hero-example__surface { opacity: 0; pointer-events: none; }
.liquidglass-hero-example__control[data-glass-ready="true"] .liquidglass-hero-example__surface { opacity: 1; }
.liquidglass-hero-example__button { z-index: 3; border: 0; background: transparent; color: white; cursor: pointer; }
.liquidglass-hero-example__content { display: inline-flex; align-items: center; gap: 8px; font: 800 15px/1 system-ui; }
.liquidglass-hero-example__button:focus-visible { outline: 2px solid rgba(255,255,255,.8); outline-offset: 3px; }
`;
