'use client';

import { Glass, type GlassOptics } from '@kernelon/ui/liquid-glass';
import { LiquidGlass } from '@kernelon/ui/liquidglass';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';

const WALLPAPER_HEADER_GLASS_SIZE = 42;
const WALLPAPER_HEADER_GLASS_RADIUS = WALLPAPER_HEADER_GLASS_SIZE / 2;

const samasanteHeaderOptics: Partial<GlassOptics> = {
  mapSize: 256,
  clipToShape: true,
  softEdge: true,
  depth: 0.7,
  curvature: 0.46,
  strength: 0.15,
  dispersion: 0.14,
  bend: 0.7,
  bendWidth: 0.1,
  frost: 0.55,
  brightness: 0.08,
  specular: 0.92,
  sheen: 0.58,
  sheenAngle: 42,
  sheenWidth: 2.25,
  sheenFalloff: 1.45,
  glow: 0.08,
  glowSpread: 0.56,
  glowFalloff: 0.85,
  edgeShadow: '0 8px 18px rgba(3, 8, 12, 0.16)',
};

const ybouaneHeaderConfig = JSON.stringify({
  blurAmount: 0.012,
  refraction: 0.52,
  chromAberration: 0.003,
  edgeHighlight: 0.05,
  specular: 0.08,
  fresnel: 0.36,
  distortion: 0.004,
  cornerRadius: WALLPAPER_HEADER_GLASS_RADIUS,
  zRadius: 12,
  opacity: 0.98,
  saturation: 0.06,
  tintStrength: 0.01,
  brightness: 0.02,
  shadowOpacity: 0.11,
  shadowSpread: 4,
  shadowOffsetY: 1,
  floating: false,
  button: true,
  bevelMode: 0,
});

type WallpaperHeaderGlassButtonProps = Readonly<{
  backdropImage: string;
  children: ReactNode;
  label: string;
}>;

export function WallpaperHeaderSamasanteGlassButton({
  backdropImage,
  children,
  label,
}: WallpaperHeaderGlassButtonProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const copyStyle = usePositionMatchedBackdrop(rootRef, backdropImage);

  return (
    <span
      className="wallpaper-header-glass-root wallpaper-header-glass-root--samasante"
      data-wallpaper-glass-engine="samasante-liquid-glass"
      ref={rootRef}
      title="samasante/liquid-glass"
    >
      <Glass
        aria-hidden="true"
        behind="transparent"
        brightnessInFilter
        className="wallpaper-header-glass-lens wallpaper-header-glass-lens--samasante"
        filterResolution={3}
        height={WALLPAPER_HEADER_GLASS_SIZE}
        optics={samasanteHeaderOptics}
        radius={WALLPAPER_HEADER_GLASS_RADIUS}
        refract={
          <span
            aria-hidden="true"
            className="wallpaper-header-glass-copy"
            style={copyStyle}
          />
        }
        width={WALLPAPER_HEADER_GLASS_SIZE}
      />
      <button
        aria-label={label}
        className="wallpaper-header-glass-button"
        data-wallpaper-glass-control={label.toLowerCase()}
        type="button"
      >
        <span aria-hidden="true" className="wallpaper-header-glass-icon">
          {children}
        </span>
      </button>
    </span>
  );
}

export function WallpaperHeaderYbouaneGlassButton({
  backdropImage,
  children,
  label,
}: WallpaperHeaderGlassButtonProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLSpanElement | null>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);

  useLocalBackdropCanvas(rootRef, backdropRef, instanceRef, backdropImage);

  useEffect(() => {
    const root = rootRef.current;
    const surface = surfaceRef.current;

    if (!root || !surface) {
      return undefined;
    }

    let cancelled = false;
    let instance: LiquidGlass | null = null;
    let readinessFrame = 0;
    const animationFrame = window.requestAnimationFrame(() => {
      const initialize = async () => {
        if (cancelled) {
          return;
        }

        const nextInstance = await LiquidGlass.init({
          root,
          glassElements: [surface],
          prefetchFonts: false,
        });

        if (cancelled) {
          nextInstance.destroy();
          return;
        }

        instance = nextInstance;
        instanceRef.current = nextInstance;
        root.dataset.wallpaperGlassReady = 'warming';
        readinessFrame = window.requestAnimationFrame(() => {
          readinessFrame = window.requestAnimationFrame(() => {
            if (cancelled) {
              return;
            }

            root.dataset.wallpaperGlassReady = hasRenderedGlassOutput(surface)
              ? 'true'
              : 'fallback';
          });
        });
      };

      void initialize().catch(() => {
        if (!cancelled) {
          root.dataset.wallpaperGlassReady = 'error';
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(readinessFrame);
      instance?.destroy();
      instanceRef.current = null;
      delete root.dataset.wallpaperGlassReady;
    };
  }, []);

  return (
    <span
      className="wallpaper-header-glass-root wallpaper-header-glass-root--ybouane"
      data-wallpaper-glass-engine="ybouane-liquidglass"
      ref={rootRef}
      title="ybouane/liquidglass"
    >
      <canvas
        aria-hidden="true"
        className="wallpaper-header-glass-backdrop"
        data-wallpaper-glass-backdrop="position-matched"
        ref={backdropRef}
      />
      <span
        aria-hidden="true"
        className="wallpaper-header-glass-ybouane-surface"
        data-config={ybouaneHeaderConfig}
        ref={surfaceRef}
      />
      <button
        aria-label={label}
        className="wallpaper-header-glass-button wallpaper-header-glass-button--ybouane"
        data-wallpaper-glass-control={label.toLowerCase()}
        type="button"
      >
        <span aria-hidden="true" className="wallpaper-header-glass-icon">
          {children}
        </span>
      </button>
    </span>
  );
}

function hasRenderedGlassOutput(surface: HTMLElement): boolean {
  const output = surface.querySelector('canvas');
  const context = output?.getContext('2d', { willReadFrequently: true });

  if (!output || !context) {
    return false;
  }

  const pixels = context.getImageData(0, 0, output.width, output.height).data;

  for (let index = 3; index < pixels.length; index += 16) {
    if ((pixels[index] ?? 0) > 0) {
      return true;
    }
  }

  return false;
}

function usePositionMatchedBackdrop(
  rootRef: RefObject<HTMLElement | null>,
  backdropImage: string,
): CSSProperties {
  useLayoutEffect(() => {
    return observeBackdropGeometry(rootRef, backdropImage, ({ image, imageRect, rootRect }) => {
      const projection = projectCoverImage(image, imageRect);
      const root = rootRef.current;

      if (!root) {
        return;
      }

      root.style.setProperty(
        '--wallpaper-header-backdrop-position',
        `${projection.left - rootRect.left}px ${projection.top - rootRect.top}px`,
      );
      root.style.setProperty(
        '--wallpaper-header-backdrop-image',
        `url(${JSON.stringify(image.currentSrc || image.src)})`,
      );
      root.style.setProperty(
        '--wallpaper-header-backdrop-size',
        `${projection.width}px ${projection.height}px`,
      );
    });
  }, [backdropImage, rootRef]);

  return {
    backgroundImage: `var(--wallpaper-header-backdrop-image, url(${JSON.stringify(backdropImage)}))`,
    backgroundPosition: 'var(--wallpaper-header-backdrop-position, 0 0)',
    backgroundSize: `var(--wallpaper-header-backdrop-size, ${WALLPAPER_HEADER_GLASS_SIZE}px ${WALLPAPER_HEADER_GLASS_SIZE}px)`,
  };
}

function useLocalBackdropCanvas(
  rootRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  instanceRef: RefObject<LiquidGlass | null>,
  backdropImage: string,
): void {
  useLayoutEffect(() => {
    return observeBackdropGeometry(rootRef, backdropImage, ({ image, imageRect, rootRect }) => {
      const canvas = canvasRef.current;

      if (!canvas || image.naturalWidth === 0 || image.naturalHeight === 0) {
        return;
      }

      const projection = projectCoverImage(image, imageRect);
      const sourceX = (rootRect.left - projection.left) / projection.scale;
      const sourceY = (rootRect.top - projection.top) / projection.scale;
      const sourceWidth = WALLPAPER_HEADER_GLASS_SIZE / projection.scale;
      const sourceHeight = WALLPAPER_HEADER_GLASS_SIZE / projection.scale;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
      const outputSize = Math.round(WALLPAPER_HEADER_GLASS_SIZE * pixelRatio);
      const context = canvas.getContext('2d');

      if (!context) {
        return;
      }

      if (canvas.width !== outputSize || canvas.height !== outputSize) {
        canvas.width = outputSize;
        canvas.height = outputSize;
      }
      context.clearRect(0, 0, outputSize, outputSize);
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputSize,
        outputSize,
      );
      instanceRef.current?.markChanged(canvas);
    });
  }, [backdropImage, canvasRef, instanceRef, rootRef]);
}

function observeBackdropGeometry(
  rootRef: RefObject<HTMLElement | null>,
  backdropImage: string,
  sync: (context: {
    image: HTMLImageElement;
    imageRect: BackdropRect;
    rootRect: DOMRect;
  }) => void,
): () => void {
  const root = rootRef.current;

  if (!root) {
    return () => undefined;
  }

  const appFrame = root.closest('[data-kernelon-app-frame]');
  const hero = appFrame?.querySelector<HTMLElement>('.wallpaper-home__hero');
  const track = appFrame?.querySelector<HTMLElement>('.wallpaper-home__track');
  const activeIndex = Number(track?.dataset.wallpaperHeroIndex ?? 0);
  const images = Array.from(
    appFrame?.querySelectorAll<HTMLImageElement>('.wallpaper-home__image') ?? [],
  );
  const activeImage = images[activeIndex] ?? images.find((image) => image.currentSrc === backdropImage);

  if (!activeImage || !hero) {
    return () => undefined;
  }

  let frame = 0;
  let followUntil = 0;
  const syncVisibleImage = () => {
    const rootRect = root.getBoundingClientRect();
    const sampleX = rootRect.left + rootRect.width / 2;
    const visibleImage =
      images.find((image) => {
        const rect = image.getBoundingClientRect();
        return rect.left <= sampleX && rect.right >= sampleX;
      }) ?? activeImage;

    if (visibleImage.complete && visibleImage.naturalWidth > 0) {
      const rect = visibleImage.getBoundingClientRect();
      sync({
        image: visibleImage,
        imageRect: {
          height: rect.height,
          left: rect.left,
          top: rect.top,
          width: rect.width,
        },
        rootRect,
      });
    }

    if (window.performance.now() < followUntil) {
      frame = window.requestAnimationFrame(syncVisibleImage);
    }
  };
  const update = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(syncVisibleImage);
  };
  const followTransition = () => {
    followUntil = window.performance.now() + 620;
    update();
  };
  const observer = new ResizeObserver(update);
  observer.observe(root);
  observer.observe(hero);
  track?.addEventListener('transitionrun', followTransition);
  track?.addEventListener('transitionend', update);
  activeImage.addEventListener('load', update);
  appFrame?.addEventListener('scroll', update, { capture: true, passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, { capture: true, passive: true });
  update();

  return () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    track?.removeEventListener('transitionrun', followTransition);
    track?.removeEventListener('transitionend', update);
    activeImage.removeEventListener('load', update);
    appFrame?.removeEventListener('scroll', update, true);
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', update, true);
  };
}

type BackdropRect = Readonly<{
  height: number;
  left: number;
  top: number;
  width: number;
}>;

type CoverProjection = BackdropRect & Readonly<{ scale: number }>;

function projectCoverImage(image: HTMLImageElement, imageRect: BackdropRect): CoverProjection {
  const scale = Math.max(
    imageRect.width / image.naturalWidth,
    imageRect.height / image.naturalHeight,
  );
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  return {
    height,
    left: imageRect.left + (imageRect.width - width) / 2,
    scale,
    top: imageRect.top + (imageRect.height - height) / 2,
    width,
  };
}
