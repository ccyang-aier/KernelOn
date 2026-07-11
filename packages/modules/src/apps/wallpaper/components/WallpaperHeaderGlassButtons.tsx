'use client';

import { LiquidGlass } from '@kernelon/ui/liquidglass';
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

const WALLPAPER_HEADER_GLASS_SIZE = 42;

export function createFrostedGlassConfig(radius: number): string {
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

type WallpaperHeaderGlassButtonProps = Readonly<{
  backdropImage: string;
  backdropView?: WallpaperGlassBackdropView;
  buttonClassName?: string;
  children: ReactNode;
  contentClassName?: string;
  height?: number;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  pressed?: boolean;
  rootClassName?: string;
  width?: number;
}>;

export function WallpaperLiquidGlassButton({
  backdropImage,
  backdropView = 'home',
  buttonClassName,
  children,
  contentClassName,
  height = WALLPAPER_HEADER_GLASS_SIZE,
  label,
  onClick,
  pressed,
  rootClassName,
  width = WALLPAPER_HEADER_GLASS_SIZE,
}: WallpaperHeaderGlassButtonProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLSpanElement | null>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);
  const [backdropReady, setBackdropReady] = useState(false);
  const [glassStatus, setGlassStatus] = useState<
    'waiting' | 'initializing' | 'warming' | 'true' | 'fallback' | 'error'
  >('waiting');
  const markBackdropReady = useCallback(() => {
    setBackdropReady(true);
    setGlassStatus('initializing');
  }, []);

  useBufferedBackdropCanvas(
    rootRef,
    backdropRef,
    instanceRef,
    backdropImage,
    backdropView,
    markBackdropReady,
  );

  useEffect(() => {
    const root = rootRef.current;
    const surface = surfaceRef.current;

    if (!root || !surface || !backdropReady) {
      return undefined;
    }

    let cancelled = false;
    let instance: LiquidGlass | null = null;
    let readinessFrame = 0;
    const initialize = async () => {
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
      setGlassStatus('warming');
      const backdrop = backdropRef.current;

      if (backdrop) {
        nextInstance.markChanged(backdrop);
      }

      let attempts = 0;
      let stableFrames = 0;
      const verifyOutput = () => {
        if (cancelled) {
          return;
        }

        attempts += 1;
        if (hasRenderedGlassOutput(surface)) {
          stableFrames += 1;
        } else {
          stableFrames = 0;
        }

        if (stableFrames >= 2) {
          setGlassStatus('true');
          return;
        }

        if (attempts >= 12) {
          setGlassStatus('fallback');
          return;
        }

        readinessFrame = window.requestAnimationFrame(verifyOutput);
      };
      readinessFrame = window.requestAnimationFrame(verifyOutput);
    };

    void initialize().catch(() => {
      if (!cancelled) {
        setGlassStatus('error');
      }
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(readinessFrame);
      instance?.destroy();
      instanceRef.current = null;
    };
  }, [backdropReady]);

  return (
    <span
      className={[
        'wallpaper-liquid-glass-root',
        'wallpaper-liquid-glass-root--frosted',
        rootClassName ?? 'wallpaper-header-glass-root',
      ].join(' ')}
      data-wallpaper-backdrop-ready={backdropReady ? 'true' : 'false'}
      data-wallpaper-glass-ready={glassStatus}
      data-wallpaper-glass-engine="ybouane-liquidglass"
      ref={rootRef}
      style={{ height, width }}
      title="liquidglass / Frosted Glass"
    >
      <canvas
        aria-hidden="true"
        className="wallpaper-liquid-glass-backdrop"
        data-wallpaper-glass-backdrop="position-matched"
        ref={backdropRef}
      />
      <span
        aria-hidden="true"
        className="wallpaper-liquid-glass-surface"
        data-config={createFrostedGlassConfig(height / 2)}
        data-liquid-glass-skip-content="true"
        ref={surfaceRef}
      />
      <button
        aria-label={label}
        aria-pressed={pressed}
        className={buttonClassName ?? 'wallpaper-liquid-glass-button wallpaper-header-glass-button'}
        data-liquid-glass-skip-capture="true"
        data-wallpaper-glass-control={label.toLowerCase()}
        onClick={onClick}
        type="button"
      >
        <span aria-hidden="true" className={contentClassName ?? 'wallpaper-header-glass-icon'}>
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
  const startX = Math.floor(output.width * 0.25);
  const endX = Math.ceil(output.width * 0.75);
  const startY = Math.floor(output.height * 0.25);
  const endY = Math.ceil(output.height * 0.75);
  let sampledPixels = 0;
  let visiblePixels = 0;

  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      sampledPixels += 1;
      const alphaIndex = (y * output.width + x) * 4 + 3;
      if ((pixels[alphaIndex] ?? 0) > 8) {
        visiblePixels += 1;
      }
    }
  }

  return sampledPixels > 0 && visiblePixels / sampledPixels >= 0.8;
}

function useBufferedBackdropCanvas(
  rootRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  instanceRef: RefObject<LiquidGlass | null>,
  backdropImage: string,
  backdropView: WallpaperGlassBackdropView,
  onFirstCommit: () => void,
): void {
  const stagingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(0);

  useLayoutEffect(() => {
    return observeBackdropGeometry(
      rootRef,
      backdropImage,
      backdropView,
      ({ ambient, backgroundColor, layers, rootRect }) => {
        const canvas = canvasRef.current;

        if (!canvas || layers.length === 0) {
          return;
        }

        const stagingCanvas = stagingCanvasRef.current ?? document.createElement('canvas');
        const sampleRect = rootRect;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const outputWidth = Math.max(1, Math.round(sampleRect.width * pixelRatio));
        const outputHeight = Math.max(1, Math.round(sampleRect.height * pixelRatio));
        const stagingContext = stagingCanvas.getContext('2d', { willReadFrequently: true });
        const context = canvas.getContext('2d');

        if (!stagingContext || !context) {
          return;
        }

        stagingCanvasRef.current = stagingCanvas;
        if (stagingCanvas.width !== outputWidth || stagingCanvas.height !== outputHeight) {
          stagingCanvas.width = outputWidth;
          stagingCanvas.height = outputHeight;
        }

        stagingContext.clearRect(0, 0, outputWidth, outputHeight);
        if (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
          stagingContext.fillStyle = backgroundColor;
          stagingContext.fillRect(0, 0, outputWidth, outputHeight);
        }

        for (const { image, imageRect } of layers) {
          if (ambient) {
            drawAmbientBackdropLayer(
              stagingContext,
              image,
              imageRect,
              sampleRect,
              pixelRatio,
              ambient,
            );
          } else {
            drawBackdropLayer(stagingContext, image, imageRect, sampleRect, pixelRatio);
          }
        }

        if (ambient) {
          paintAmbientBackdrop(stagingContext, sampleRect, pixelRatio, ambient);
        }

        if (!isFrameFullyOpaque(stagingContext, outputWidth, outputHeight)) {
          return;
        }

        if (canvas.width !== outputWidth || canvas.height !== outputHeight) {
          canvas.width = outputWidth;
          canvas.height = outputHeight;
        }
        context.globalCompositeOperation = 'copy';
        context.drawImage(stagingCanvas, 0, 0);
        context.globalCompositeOperation = 'source-over';
        const isFirstCommit = frameRef.current === 0;
        frameRef.current += 1;
        canvas.dataset.wallpaperBackdropFrame = String(frameRef.current % 2);
        instanceRef.current?.markChanged(canvas);
        if (isFirstCommit) {
          onFirstCommit();
        }
      },
    );
  }, [backdropImage, backdropView, canvasRef, instanceRef, onFirstCommit, rootRef]);
}

function drawAmbientBackdropLayer(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  imageRect: BackdropRect,
  rootRect: DOMRect,
  pixelRatio: number,
  ambient: AmbientBackdrop,
): void {
  const projection = projectCoverImage(image, imageRect);

  context.save();
  context.filter = scaleCanvasFilter(ambient.filter, pixelRatio);
  context.globalAlpha = ambient.imageOpacity;
  context.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    (projection.left - rootRect.left) * pixelRatio,
    (projection.top - rootRect.top) * pixelRatio,
    projection.width * pixelRatio,
    projection.height * pixelRatio,
  );
  context.restore();
}

function scaleCanvasFilter(filter: string, pixelRatio: number): string {
  return filter.replace(/blur\(([\d.]+)px\)/g, (_match, amount: string) => {
    return `blur(${Number(amount) * pixelRatio}px)`;
  });
}

function paintAmbientBackdrop(
  context: CanvasRenderingContext2D,
  rootRect: DOMRect,
  pixelRatio: number,
  ambient: AmbientBackdrop,
): void {
  const { hostRect, overlayOpacity, view } = ambient;

  context.save();
  context.globalAlpha = overlayOpacity;
  if (view === 'settings') {
    fillLinearGradient(
      context,
      rootRect,
      hostRect,
      pixelRatio,
      112,
      'rgba(18, 42, 48, 0.62)',
      'rgba(80, 24, 42, 0.48)',
    );
    fillRadialGradient(
      context,
      rootRect,
      hostRect,
      pixelRatio,
      50,
      28,
      31,
      'rgba(255, 255, 255, 0.12)',
    );
    fillRadialGradient(
      context,
      rootRect,
      hostRect,
      pixelRatio,
      18,
      68,
      46,
      'rgba(194, 69, 104, 0.28)',
    );
    fillRadialGradient(
      context,
      rootRect,
      hostRect,
      pixelRatio,
      76,
      18,
      38,
      'rgba(112, 196, 218, 0.26)',
    );
  } else {
    fillLinearGradient(
      context,
      rootRect,
      hostRect,
      pixelRatio,
      115,
      'rgba(24, 30, 35, 0.58)',
      'rgba(21, 29, 25, 0.64)',
    );
    fillRadialGradient(
      context,
      rootRect,
      hostRect,
      pixelRatio,
      79,
      28,
      36,
      'rgba(183, 173, 150, 0.23)',
    );
    fillRadialGradient(
      context,
      rootRect,
      hostRect,
      pixelRatio,
      24,
      20,
      34,
      'rgba(210, 224, 232, 0.18)',
    );
  }
  context.restore();
}

function fillLinearGradient(
  context: CanvasRenderingContext2D,
  rootRect: DOMRect,
  hostRect: BackdropRect,
  pixelRatio: number,
  angle: number,
  startColor: string,
  endColor: string,
): void {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const halfLength = (Math.abs(hostRect.width * dx) + Math.abs(hostRect.height * dy)) / 2;
  const centerX = (hostRect.left + hostRect.width / 2 - rootRect.left) * pixelRatio;
  const centerY = (hostRect.top + hostRect.height / 2 - rootRect.top) * pixelRatio;
  const gradient = context.createLinearGradient(
    centerX - dx * halfLength * pixelRatio,
    centerY - dy * halfLength * pixelRatio,
    centerX + dx * halfLength * pixelRatio,
    centerY + dy * halfLength * pixelRatio,
  );
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  context.fillStyle = gradient;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

function fillRadialGradient(
  context: CanvasRenderingContext2D,
  rootRect: DOMRect,
  hostRect: BackdropRect,
  pixelRatio: number,
  centerXPercent: number,
  centerYPercent: number,
  fadePercent: number,
  color: string,
): void {
  const centerX = hostRect.left + hostRect.width * (centerXPercent / 100);
  const centerY = hostRect.top + hostRect.height * (centerYPercent / 100);
  const radius = Math.max(
    Math.hypot(centerX - hostRect.left, centerY - hostRect.top),
    Math.hypot(centerX - (hostRect.left + hostRect.width), centerY - hostRect.top),
    Math.hypot(centerX - hostRect.left, centerY - (hostRect.top + hostRect.height)),
    Math.hypot(
      centerX - (hostRect.left + hostRect.width),
      centerY - (hostRect.top + hostRect.height),
    ),
  );
  const gradient = context.createRadialGradient(
    (centerX - rootRect.left) * pixelRatio,
    (centerY - rootRect.top) * pixelRatio,
    0,
    (centerX - rootRect.left) * pixelRatio,
    (centerY - rootRect.top) * pixelRatio,
    radius * pixelRatio,
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(fadePercent / 100, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
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

function isFrameFullyOpaque(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): boolean {
  const pixels = context.getImageData(0, 0, width, height).data;

  for (let index = 3; index < pixels.length; index += 4) {
    if ((pixels[index] ?? 0) < 250) {
      return false;
    }
  }

  return true;
}

function observeBackdropGeometry(
  rootRef: RefObject<HTMLElement | null>,
  backdropImage: string,
  backdropView: WallpaperGlassBackdropView,
  sync: (context: {
    ambient?: AmbientBackdrop;
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
  const wallpaperRoot = appFrame?.querySelector<HTMLElement>('.wallpaper-ux');
  if (backdropView === 'explore' || backdropView === 'settings') {
    if (!wallpaperRoot) {
      return () => undefined;
    }

    const image = new Image();
    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
          return;
        }

        const rootRect = root.getBoundingClientRect();
        const hostDomRect = wallpaperRoot.getBoundingClientRect();
        const hostRect = rectFromDomRect(hostDomRect);
        const beforeStyle = window.getComputedStyle(wallpaperRoot, '::before');
        const afterStyle = window.getComputedStyle(wallpaperRoot, '::after');
        const imageRect = scaleBackdropRect(hostRect, readTransformScale(beforeStyle.transform));

        sync({
          ambient: {
            filter:
              beforeStyle.filter === 'none'
                ? 'blur(34px) saturate(1.08) brightness(0.74)'
                : beforeStyle.filter,
            hostRect,
            imageOpacity: readOpacity(beforeStyle.opacity),
            overlayOpacity: readOpacity(afterStyle.opacity),
            view: backdropView,
          },
          backgroundColor: window.getComputedStyle(wallpaperRoot).backgroundColor,
          layers: [{ image, imageRect }],
          rootRect,
        });
      });
    };
    const resizeObserver = new ResizeObserver(update);
    const mutationObserver = new MutationObserver(update);
    resizeObserver.observe(root);
    resizeObserver.observe(wallpaperRoot);
    mutationObserver.observe(wallpaperRoot, {
      attributeFilter: [
        'class',
        'data-wallpaper-active-view',
        'data-wallpaper-glass-depth',
        'style',
      ],
      attributes: true,
    });
    image.addEventListener('load', update);
    image.src = backdropImage;
    if (image.complete) {
      update();
    }
    window.addEventListener('resize', update);

    return () => {
      window.cancelAnimationFrame(frame);
      image.removeEventListener('load', update);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
    };
  }

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

type WallpaperGlassBackdropView = 'explore' | 'home' | 'preview' | 'settings';

type AmbientBackdrop = Readonly<{
  filter: string;
  hostRect: BackdropRect;
  imageOpacity: number;
  overlayOpacity: number;
  view: 'explore' | 'settings';
}>;

function rectFromDomRect(rect: DOMRect): BackdropRect {
  return { height: rect.height, left: rect.left, top: rect.top, width: rect.width };
}

function readOpacity(value: string): number {
  const opacity = Number.parseFloat(value);

  return Number.isFinite(opacity) ? opacity : 1;
}

function readTransformScale(transform: string): number {
  const match = transform.match(/^matrix\(([\d.-]+),/);
  const scale = match ? Number.parseFloat(match[1] ?? '') : 1;

  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function scaleBackdropRect(rect: BackdropRect, scale: number): BackdropRect {
  const width = rect.width * scale;
  const height = rect.height * scale;

  return {
    height,
    left: rect.left - (width - rect.width) / 2,
    top: rect.top - (height - rect.height) / 2,
    width,
  };
}

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
