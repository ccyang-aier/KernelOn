'use client';

import { Glass, type GlassOptics } from '@kernelon/ui/liquid-glass';
import { LiquidGlass } from '@kernelon/ui/liquidglass';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type MouseEventHandler,
  type ReactNode,
  type RefObject,
} from 'react';

const WALLPAPER_HEADER_GLASS_SIZE = 42;
const WALLPAPER_HEADER_GLASS_RADIUS = WALLPAPER_HEADER_GLASS_SIZE / 2;

const samasanteHeaderOptics: Partial<GlassOptics> = {
  mapSize: 512,
  clipToShape: true,
  softEdge: true,
  strength: 0.16,
  depth: 0.2,
  curvature: 0.55,
  bend: 0.25,
  bendWidth: 0.08,
  dispersion: 0.15,
  specular: 1,
  sheenAngle: 50,
  glow: 0.15,
  glowSpread: 1,
  glowFalloff: 1.5,
  sheen: 0.95,
  sheenWidth: 2,
  sheenFalloff: 1.5,
  frost: 3,
  brightness: 0,
};

const ybouaneHeaderConfig = JSON.stringify({
  blurAmount: 0.006,
  refraction: 0.46,
  chromAberration: 0.002,
  edgeHighlight: 0.06,
  specular: 0.015,
  fresnel: 0.2,
  distortion: 0.0025,
  cornerRadius: WALLPAPER_HEADER_GLASS_RADIUS,
  zRadius: 10,
  opacity: 0.96,
  saturation: 0.04,
  tintStrength: 0,
  brightness: 0.006,
  shadowOpacity: 0.12,
  shadowSpread: 3,
  shadowOffsetY: 1,
  floating: false,
  button: true,
  bevelMode: 1,
});

type WallpaperHeaderGlassButtonProps = Readonly<{
  backdropImage: string;
  children: ReactNode;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}>;

export function WallpaperHeaderSamasanteGlassButton({
  backdropImage,
  children,
  label,
  onClick,
}: WallpaperHeaderGlassButtonProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);

  useBufferedBackdropCanvas(rootRef, backdropRef, null, backdropImage);

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
          <canvas aria-hidden="true" className="wallpaper-header-glass-copy" ref={backdropRef} />
        }
        width={WALLPAPER_HEADER_GLASS_SIZE}
      />
      <button
        aria-label={label}
        className="wallpaper-header-glass-button"
        data-wallpaper-glass-control={label.toLowerCase()}
        onClick={onClick}
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
  onClick,
}: WallpaperHeaderGlassButtonProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLSpanElement | null>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);

  useBufferedBackdropCanvas(rootRef, backdropRef, instanceRef, backdropImage);

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
        onClick={onClick}
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

function useBufferedBackdropCanvas(
  rootRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  instanceRef: RefObject<LiquidGlass | null> | null,
  backdropImage: string,
): void {
  const stagingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(0);

  useLayoutEffect(() => {
    return observeBackdropGeometry(
      rootRef,
      backdropImage,
      ({ backgroundColor, layers, rootRect }) => {
        const canvas = canvasRef.current;

        if (!canvas || layers.length === 0) {
          return;
        }

        const stagingCanvas = stagingCanvasRef.current ?? document.createElement('canvas');
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const outputSize = Math.round(WALLPAPER_HEADER_GLASS_SIZE * pixelRatio);
        const stagingContext = stagingCanvas.getContext('2d', { willReadFrequently: true });
        const context = canvas.getContext('2d');

        if (!stagingContext || !context) {
          return;
        }

        stagingCanvasRef.current = stagingCanvas;
        if (stagingCanvas.width !== outputSize || stagingCanvas.height !== outputSize) {
          stagingCanvas.width = outputSize;
          stagingCanvas.height = outputSize;
        }

        stagingContext.clearRect(0, 0, outputSize, outputSize);
        if (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
          stagingContext.fillStyle = backgroundColor;
          stagingContext.fillRect(0, 0, outputSize, outputSize);
        }

        for (const { image, imageRect } of layers) {
          drawBackdropLayer(stagingContext, image, imageRect, rootRect, pixelRatio);
        }

        if (!isFrameFullyOpaque(stagingContext, outputSize)) {
          return;
        }

        if (canvas.width !== outputSize || canvas.height !== outputSize) {
          canvas.width = outputSize;
          canvas.height = outputSize;
        }
        context.globalCompositeOperation = 'copy';
        context.drawImage(stagingCanvas, 0, 0);
        context.globalCompositeOperation = 'source-over';
        frameRef.current += 1;
        canvas.dataset.wallpaperBackdropFrame = String(frameRef.current % 2);
        instanceRef?.current?.markChanged(canvas);
      },
    );
  }, [backdropImage, canvasRef, instanceRef, rootRef]);
}

function drawBackdropLayer(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  imageRect: BackdropRect,
  rootRect: DOMRect,
  pixelRatio: number,
): void {
  const intersection = intersectRects(imageRect, rootRect);

  if (!intersection) {
    return;
  }

  const projection = projectCoverImage(image, imageRect);
  const sourceX = (intersection.left - projection.left) / projection.scale;
  const sourceY = (intersection.top - projection.top) / projection.scale;
  const sourceWidth = intersection.width / projection.scale;
  const sourceHeight = intersection.height / projection.scale;
  const destinationX = (intersection.left - rootRect.left) * pixelRatio;
  const destinationY = (intersection.top - rootRect.top) * pixelRatio;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    destinationX,
    destinationY,
    intersection.width * pixelRatio,
    intersection.height * pixelRatio,
  );
}

function isFrameFullyOpaque(context: CanvasRenderingContext2D, size: number): boolean {
  const pixels = context.getImageData(0, 0, size, size).data;

  for (let index = 3; index < pixels.length; index += 4) {
    if ((pixels[index] ?? 0) < 250) {
      return false;
    }
  }

  return true;
}

function observeBackdropGeometry(
  rootRef: RefObject<HTMLElement | null>,
  _backdropImage: string,
  sync: (context: {
    backgroundColor: string;
    layers: ReadonlyArray<BackdropLayer>;
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
  const images = Array.from(
    appFrame?.querySelectorAll<HTMLImageElement>('.wallpaper-home__image') ?? [],
  );
  if (!hero || images.length === 0) {
    return () => undefined;
  }

  let frame = 0;
  let followUntil = 0;
  const syncVisibleImage = () => {
    const rootRect = root.getBoundingClientRect();
    const layers = images.flatMap<BackdropLayer>((image) => {
      if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
        return [];
      }

      const rect = image.getBoundingClientRect();
      const imageRect = { height: rect.height, left: rect.left, top: rect.top, width: rect.width };

      return intersectRects(imageRect, rootRect) ? [{ image, imageRect }] : [];
    });

    if (layers.length > 0) {
      sync({
        backgroundColor: window.getComputedStyle(track ?? hero).backgroundColor,
        layers,
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
  for (const image of images) {
    image.addEventListener('load', update);
  }
  appFrame?.addEventListener('scroll', update, { capture: true, passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, { capture: true, passive: true });
  update();

  return () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    track?.removeEventListener('transitionrun', followTransition);
    track?.removeEventListener('transitionend', update);
    for (const image of images) {
      image.removeEventListener('load', update);
    }
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

type BackdropLayer = Readonly<{
  image: HTMLImageElement;
  imageRect: BackdropRect;
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

function intersectRects(left: BackdropRect, right: BackdropRect): BackdropRect | null {
  const intersectionLeft = Math.max(left.left, right.left);
  const intersectionTop = Math.max(left.top, right.top);
  const intersectionRight = Math.min(left.left + left.width, right.left + right.width);
  const intersectionBottom = Math.min(left.top + left.height, right.top + right.height);

  if (intersectionRight <= intersectionLeft || intersectionBottom <= intersectionTop) {
    return null;
  }

  return {
    height: intersectionBottom - intersectionTop,
    left: intersectionLeft,
    top: intersectionTop,
    width: intersectionRight - intersectionLeft,
  };
}
