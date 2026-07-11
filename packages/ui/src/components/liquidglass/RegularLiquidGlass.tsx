'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from 'react';

import { LiquidGlass } from './LiquidGlass.js';

export interface RegularLiquidGlassProps {
  backdropImageSelector: string;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  radius?: number;
}

export function RegularLiquidGlass({
  backdropImageSelector,
  children,
  className = '',
  interactive = false,
  radius = 14,
}: Readonly<RegularLiquidGlassProps>) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLSpanElement | null>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);
  const [backdropReady, setBackdropReady] = useState(false);
  const [glassReady, setGlassReady] = useState(false);
  const markFirstCommit = useCallback(() => setBackdropReady(true), []);

  useRegularGlassBackdrop({
    backdropImageSelector,
    backdropRef,
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

    void LiquidGlass.init({ root, glassElements: [surface], prefetchFonts: false })
      .then((nextInstance) => {
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
      })
      .catch(() => setGlassReady(false));

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(readinessFrame);
      instance?.destroy();
      instanceRef.current = null;
    };
  }, [backdropReady]);

  return (
    <span
      className={`group relative isolate block rounded-[inherit] ${interactive ? 'transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]' : ''} ${className}`}
      data-glass-ready={glassReady ? 'true' : 'false'}
      ref={rootRef}
      style={{ borderRadius: radius }}
    >
      <canvas
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full rounded-[inherit] opacity-0"
        ref={backdropRef}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[1] rounded-[inherit] transition-opacity duration-150 ${glassReady ? 'opacity-100' : 'opacity-0'}`}
        data-config={createRegularGlassConfig(radius, interactive)}
        data-liquid-glass-skip-content="true"
        ref={surfaceRef}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[2] rounded-[inherit] bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.14),transparent_38%)] shadow-[0_6px_14px_rgba(3,8,12,0.12)] backdrop-blur-[1px] transition-opacity duration-150 ${glassReady ? 'opacity-0' : 'opacity-100'}`}
        data-liquid-glass-skip-capture="true"
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[3] rounded-[inherit] border border-white/45 bg-white/[0.015] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-colors duration-200 ${interactive ? 'group-hover:bg-white/10' : 'group-focus-within:border-white/65'}`}
        data-liquid-glass-skip-capture="true"
      />
      <span
        className="absolute inset-0 z-[4] block rounded-[inherit]"
        data-liquid-glass-skip-capture="true"
      >
        {children}
      </span>
    </span>
  );
}

export function createRegularGlassConfig(radius: number, interactive: boolean): string {
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
    button: interactive,
    bevelMode: 0,
  });
}

function useRegularGlassBackdrop({
  backdropImageSelector,
  backdropRef,
  instanceRef,
  onFirstCommit,
  rootRef,
}: Readonly<{
  backdropImageSelector: string;
  backdropRef: RefObject<HTMLCanvasElement | null>;
  instanceRef: RefObject<LiquidGlass | null>;
  onFirstCommit(): void;
  rootRef: RefObject<HTMLSpanElement | null>;
}>): void {
  const stagingRef = useRef<HTMLCanvasElement | null>(null);
  const committedRef = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const image = document.querySelector<HTMLImageElement>(backdropImageSelector);
    if (!root || !image) return undefined;

    let frame = 0;
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
        staging.width = width;
        staging.height = height;
        stagingContext.clearRect(0, 0, width, height);
        drawCoverSample(stagingContext, image, imageRect, rootRect, intersection, dpr);
        if (!isFullyOpaque(stagingContext, width, height)) return;

        canvas.width = width;
        canvas.height = height;
        outputContext.globalCompositeOperation = 'copy';
        outputContext.drawImage(staging, 0, 0);
        outputContext.globalCompositeOperation = 'source-over';
        instanceRef.current?.markChanged(canvas);
        if (!committedRef.current) {
          committedRef.current = true;
          onFirstCommit();
        }
      });
    };

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resizeObserver?.observe(root);
    image.addEventListener('load', update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { capture: true, passive: true });
    update();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      image.removeEventListener('load', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [backdropImageSelector, backdropRef, instanceRef, onFirstCommit, rootRef]);
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
