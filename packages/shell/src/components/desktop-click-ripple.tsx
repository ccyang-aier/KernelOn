'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

export type DesktopClickRippleShape = 'radial' | 'liquid';

interface DesktopClickRippleAnimation {
  element: HTMLSpanElement;
  timeline: DesktopRippleTimeline;
}

interface DesktopRippleTimeline {
  kill(): void;
}

interface DesktopRipplePoint {
  x: number;
  y: number;
}

interface DesktopClickRippleOptions {
  shape?: DesktopClickRippleShape;
}

type DesktopRippleGsap = (typeof import('gsap'))['gsap'];

let desktopRippleGsapPromise: Promise<DesktopRippleGsap> | null = null;

export function useDesktopClickRipple({
  shape = 'radial',
}: DesktopClickRippleOptions = {}): {
  layerRef: RefObject<HTMLDivElement | null>;
  playRipple(point: DesktopRipplePoint, options?: DesktopClickRippleOptions): void;
} {
  const layerRef = useRef<HTMLDivElement>(null);
  const animationsRef = useRef<DesktopClickRippleAnimation[]>([]);
  const disposedRef = useRef(false);
  const shapeRef = useRef<DesktopClickRippleShape>(shape);

  useEffect(() => {
    shapeRef.current = shape;
  }, [shape]);

  useEffect(() => {
    disposedRef.current = false;
    void loadDesktopRippleGsap();

    return () => {
      disposedRef.current = true;
      animationsRef.current.forEach(({ element, timeline }) => {
        timeline.kill();
        element.remove();
      });
      animationsRef.current = [];
    };
  }, []);

  const playRipple = useCallback(
    ({ x, y }: DesktopRipplePoint, options: DesktopClickRippleOptions = {}) => {
      const rippleLayer = layerRef.current;

      if (!rippleLayer || disposedRef.current) {
        return;
      }

      const rippleElement = createDesktopClickRippleElement(x, y, options.shape ?? shapeRef.current);
      rippleLayer.append(rippleElement);

      let animation: DesktopClickRippleAnimation | null = null;
      void animateDesktopClickRipple(rippleElement, () => {
        rippleElement.remove();

        if (animation) {
          const completedAnimation = animation;
          animationsRef.current = animationsRef.current.filter(
            (item) => item !== completedAnimation,
          );
        }
      })
        .then((timeline) => {
          if (disposedRef.current) {
            timeline.kill();
            rippleElement.remove();
            return;
          }

          animation = { element: rippleElement, timeline };
          animationsRef.current.push(animation);

          if (animationsRef.current.length > 4) {
            const oldestAnimation = animationsRef.current.shift();

            if (oldestAnimation) {
              oldestAnimation.timeline.kill();
              oldestAnimation.element.remove();
            }
          }
        })
        .catch(() => {
          rippleElement.remove();
        });
    },
    [],
  );

  return { layerRef, playRipple };
}

export function DesktopClickRippleLayer({
  layerRef,
}: Readonly<{
  layerRef: RefObject<HTMLDivElement | null>;
}>) {
  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[18] overflow-hidden"
      data-testid="kernelon-desktop-click-ripple-layer"
    />
  );
}

function createDesktopClickRippleElement(
  x: number,
  y: number,
  shape: DesktopClickRippleShape,
): HTMLSpanElement {
  const root = document.createElement('span');
  const size = getDesktopRippleSize(shape);
  root.dataset.rippleShape = shape;
  root.dataset.testid = 'kernelon-desktop-click-ripple';

  applyElementStyles(root, {
    height: `${size.height}px`,
    left: `${x}px`,
    mixBlendMode: 'screen',
    opacity: '0',
    pointerEvents: 'none',
    position: 'absolute',
    top: `${y}px`,
    width: `${size.width}px`,
    willChange: 'opacity, transform',
  });

  if (shape === 'liquid') {
    root.append(...createLiquidRippleParts());
    return root;
  }

  root.append(
    createRadialRipplePart('halo'),
    createRadialRipplePart('outer-ring'),
    createRadialRipplePart('inner-ring'),
    createRadialRipplePart('core'),
  );

  return root;
}

function getDesktopRippleSize(shape: DesktopClickRippleShape): { height: number; width: number } {
  if (shape === 'liquid') {
    return { height: 132, width: 132 };
  }

  return { height: 96, width: 96 };
}

function createRadialRipplePart(kind: 'halo' | 'outer-ring' | 'inner-ring' | 'core') {
  const part = document.createElement('span');
  part.dataset.ripplePart = kind;

  const baseStyles = {
    borderRadius: '9999px',
    display: 'block',
    inset: '0',
    opacity: '0',
    position: 'absolute',
    transform: 'scale(0.2)',
    transformOrigin: '50% 50%',
    willChange: 'opacity, transform',
  } satisfies Record<string, string>;

  const stylesByKind = {
    core: {
      background:
        'radial-gradient(circle, rgba(255,255,255,0.72) 0%, rgba(185,231,240,0.38) 50%, rgba(255,255,255,0) 72%)',
      filter: 'blur(0.5px)',
      inset: '35px',
    },
    halo: {
      background:
        'radial-gradient(circle, rgba(255,255,255,0.60) 0%, rgba(182,228,238,0.24) 31%, rgba(255,255,255,0) 68%)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.34), inset 0 0 18px rgba(255,255,255,0.28)',
    },
    'inner-ring': {
      border: '1px solid rgba(255,255,255,0.58)',
      boxShadow: '0 0 12px rgba(255,255,255,0.32)',
      inset: '26px',
    },
    'outer-ring': {
      border: '1px solid rgba(255,255,255,0.70)',
      boxShadow: '0 0 18px rgba(255,255,255,0.38), 0 0 26px rgba(145,208,223,0.22)',
      inset: '10px',
    },
  } satisfies Record<typeof kind, Record<string, string>>;

  applyElementStyles(part, { ...baseStyles, ...stylesByKind[kind] });

  return part;
}

function createLiquidRippleParts(): [HTMLSpanElement, HTMLSpanElement, SVGSVGElement] {
  const haze = document.createElement('span');
  haze.dataset.ripplePart = 'liquid-haze';
  applyElementStyles(haze, {
    background:
      'radial-gradient(circle at center, rgba(255,255,255,0.52) 0%, rgba(184,232,241,0.24) 40%, rgba(255,255,255,0) 74%)',
    borderRadius: '9999px',
    display: 'block',
    filter: 'blur(1.2px)',
    inset: '0',
    opacity: '0',
    position: 'absolute',
    transform: 'scale(0.42)',
    transformOrigin: '50% 50%',
    willChange: 'opacity, transform',
  });

  const focus = document.createElement('span');
  focus.dataset.ripplePart = 'liquid-focus';
  applyElementStyles(focus, {
    background:
      'radial-gradient(circle at center, rgba(255,255,255,0.62) 0%, rgba(194,238,247,0.30) 44%, rgba(255,255,255,0) 74%)',
    borderRadius: '9999px',
    display: 'block',
    filter: 'blur(1px)',
    height: '42px',
    left: '45px',
    opacity: '0',
    position: 'absolute',
    top: '45px',
    transform: 'scale(0.24)',
    transformOrigin: '50% 50%',
    width: '42px',
    willChange: 'opacity, transform',
  });

  const waveField = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  waveField.dataset.ripplePart = 'liquid-wavefield';
  waveField.setAttribute('fill', 'none');
  waveField.setAttribute('preserveAspectRatio', 'none');
  waveField.setAttribute('viewBox', '0 0 132 132');
  applyElementStyles(waveField, {
    filter: 'drop-shadow(0 0 7px rgba(255,255,255,0.42)) drop-shadow(0 0 14px rgba(138,215,231,0.22))',
    height: '132px',
    left: '0',
    overflow: 'visible',
    opacity: '0',
    position: 'absolute',
    top: '0',
    transform: 'scale(0.58)',
    transformOrigin: '50% 50%',
    width: '132px',
    willChange: 'opacity, transform',
  });

  createLiquidWaveSegments().forEach((segment) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.dataset.ripplePart = 'liquid-wave';
    path.dataset.waveDelay = segment.delay.toFixed(3);
    path.dataset.waveRing = String(segment.ringIndex);
    path.dataset.waveSegment = String(segment.segmentIndex);
    path.dataset.waveSpin = segment.spin.toFixed(2);
    path.setAttribute('d', createLiquidWaveSegmentPath(segment));
    path.setAttribute('stroke', segment.stroke);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', segment.strokeWidth);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    applyElementStyles(path, {
      opacity: '0',
      transformOrigin: '50% 50%',
      willChange: 'opacity, stroke-dashoffset, transform',
    });
    waveField.append(path);
  });

  return [haze, focus, waveField];
}

interface LiquidWaveRingPreset {
  count: number;
  phase: number;
  radius: number;
  stroke: string;
  strokeWidthRange: readonly [number, number];
  spanRange: readonly [number, number];
  wobble: number;
}

interface LiquidWaveSegmentConfig {
  delay: number;
  endAngle: number;
  phase: number;
  radius: number;
  ringIndex: number;
  segmentIndex: number;
  spin: number;
  startAngle: number;
  stroke: string;
  strokeWidth: string;
  wobble: number;
}

const LIQUID_WAVE_RING_PRESETS = [
  {
    count: 6,
    phase: 0.2,
    radius: 49,
    stroke: 'rgba(255,255,255,0.92)',
    strokeWidthRange: [2.15, 2.65],
    spanRange: [34, 52],
    wobble: 1.35,
  },
  {
    count: 4,
    phase: 1.35,
    radius: 31,
    stroke: 'rgba(214,248,255,0.62)',
    strokeWidthRange: [1.25, 1.85],
    spanRange: [26, 46],
    wobble: 0.95,
  },
] satisfies LiquidWaveRingPreset[];

function createLiquidWaveSegments(): LiquidWaveSegmentConfig[] {
  return LIQUID_WAVE_RING_PRESETS.flatMap((ring, ringIndex) => {
    const ringOffset = randomBetween(-24, 24);
    const angleStep = 360 / ring.count;

    return Array.from({ length: ring.count }, (_, segmentIndex) => {
      const centerAngle =
        -90 + ringOffset + segmentIndex * angleStep + randomBetween(-angleStep * 0.1, angleStep * 0.1);
      const span = randomBetween(ring.spanRange[0], ring.spanRange[1]);

      return {
        delay: ringIndex * 0.035 + segmentIndex * 0.012 + randomBetween(0, 0.035),
        endAngle: centerAngle + span / 2,
        phase: ring.phase + randomBetween(0, Math.PI * 2),
        radius: ring.radius + randomBetween(-1.8, 1.8),
        ringIndex,
        segmentIndex,
        spin: randomBetween(-1.6, 1.6),
        startAngle: centerAngle - span / 2,
        stroke: ring.stroke,
        strokeWidth: randomBetween(ring.strokeWidthRange[0], ring.strokeWidthRange[1]).toFixed(2),
        wobble: ring.wobble * randomBetween(0.8, 1.25),
      };
    });
  });
}

function createLiquidWaveSegmentPath({
  endAngle,
  phase,
  radius,
  startAngle,
  wobble,
}: LiquidWaveSegmentConfig): string {
  const pointCount = 5;
  const points = Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const angle = startAngle + (endAngle - startAngle) * progress;
    const waveOffset =
      Math.sin(phase + progress * Math.PI * 2.3) * wobble +
      Math.sin(phase * 0.7 + progress * Math.PI * 5.4) * wobble * 0.32;

    return polarToLiquidPoint(angle, radius + waveOffset);
  });
  const [firstPoint, ...restPoints] = points;

  return restPoints.reduce((path, point, index) => {
    const previousPoint = points[index];
    const previousAngle = startAngle + (endAngle - startAngle) * (index / (pointCount - 1));
    const currentAngle = startAngle + (endAngle - startAngle) * ((index + 1) / (pointCount - 1));
    const controlLength = radius * 0.1;
    const firstControl = tangentControlPoint(previousPoint, previousAngle, controlLength);
    const secondControl = tangentControlPoint(point, currentAngle, -controlLength);

    return `${path} C ${formatPathPoint(firstControl)} ${formatPathPoint(secondControl)} ${formatPathPoint(point)}`;
  }, `M ${formatPathPoint(firstPoint)}`);
}

function polarToLiquidPoint(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;

  return {
    x: 66 + Math.cos(radians) * radius,
    y: 66 + Math.sin(radians) * radius,
  };
}

function tangentControlPoint(
  point: { x: number; y: number },
  angle: number,
  distance: number,
): { x: number; y: number } {
  const tangentRadians = ((angle + 90) * Math.PI) / 180;

  return {
    x: point.x + Math.cos(tangentRadians) * distance,
    y: point.y + Math.sin(tangentRadians) * distance,
  };
}

function formatPathPoint({ x, y }: { x: number; y: number }): string {
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function animateDesktopClickRipple(
  root: HTMLSpanElement,
  onComplete: () => void,
): Promise<DesktopRippleTimeline> {
  return loadDesktopRippleGsap().then((gsap) => {
    const motionScale = prefersReducedMotion() ? 0.68 : 1;

    if (root.dataset.rippleShape === 'liquid') {
      return animateLiquidDesktopClickRipple(root, gsap, onComplete, motionScale);
    }

    return animateRadialDesktopClickRipple(root, gsap, onComplete, motionScale);
  });
}

function animateLiquidDesktopClickRipple(
  root: HTMLSpanElement,
  gsap: DesktopRippleGsap,
  onComplete: () => void,
  motionScale: number,
): DesktopRippleTimeline {
  const haze = root.querySelector('[data-ripple-part="liquid-haze"]');
  const focus = root.querySelector('[data-ripple-part="liquid-focus"]');
  const waveField = root.querySelector('[data-ripple-part="liquid-wavefield"]');
  const waves = Array.from(
    root.querySelectorAll<SVGPathElement>('[data-ripple-part="liquid-wave"]'),
  );
  const timeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete,
  });

  gsap.set(root, {
    autoAlpha: 1,
    force3D: true,
    rotation: -2,
    scale: 0.96,
    transformOrigin: '50% 50%',
    xPercent: -50,
    yPercent: -50,
  });
  gsap.set(waveField, {
    autoAlpha: 1,
    force3D: true,
    rotation: -3,
    scale: 0.5,
    transformOrigin: '50% 50%',
  });

  const waveLengths = waves.map((path) => {
    const length = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 1;
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    return length;
  });

  timeline
    .fromTo(
      haze,
      { autoAlpha: 0.48, scale: 0.38 },
      {
        autoAlpha: 0,
        duration: 1.16 * motionScale,
        ease: 'power2.out',
        scale: 1.08,
      },
      0,
    )
    .fromTo(
      focus,
      { autoAlpha: 0.62, scaleX: 0.32, scaleY: 0.22 },
      {
        autoAlpha: 0,
        duration: 0.54 * motionScale,
        ease: 'power2.out',
        scaleX: 1.18,
        scaleY: 0.7,
      },
      0,
    )
    .to(
      waveField,
      {
        duration: 1.12 * motionScale,
        ease: 'sine.out',
        rotation: 2,
        scale: 1.1,
      },
      0,
    );

  waves.forEach((path, index) => {
    const length = waveLengths[index] ?? 1;
    const ringIndex = Number(path.dataset.waveRing ?? 0);
    const segmentIndex = Number(path.dataset.waveSegment ?? 0);
    const segmentDelay = Number(path.dataset.waveDelay ?? 0);
    const segmentSpin = Number(path.dataset.waveSpin ?? 0);
    const startScale = [0.42, 0.56, 0.7, 0.36][ringIndex] ?? 0.5;
    const endScale = [1.08, 1.0, 0.92, 1.14][ringIndex] ?? 1;
    const endRotation = ([-2, 2, -1, 3][ringIndex] ?? 0) + segmentSpin;

    timeline.fromTo(
      path,
      {
        autoAlpha: ringIndex === 0 ? 0.88 : 0.68,
        rotation: 0,
        scale: startScale,
        strokeDashoffset: length,
      },
      {
        autoAlpha: 0,
        duration: (0.78 + ringIndex * 0.11 + segmentIndex * 0.018) * motionScale,
        ease: 'power2.out',
        rotation: endRotation,
        scale: endScale,
        strokeDashoffset: -length * 0.18,
      },
      segmentDelay * motionScale,
    );
  });

  return {
    kill: () => timeline.kill(),
  };
}

function animateRadialDesktopClickRipple(
  root: HTMLSpanElement,
  gsap: DesktopRippleGsap,
  onComplete: () => void,
  motionScale: number,
): DesktopRippleTimeline {
  const halo = root.querySelector('[data-ripple-part="halo"]');
  const outerRing = root.querySelector('[data-ripple-part="outer-ring"]');
  const innerRing = root.querySelector('[data-ripple-part="inner-ring"]');
  const core = root.querySelector('[data-ripple-part="core"]');
  const timeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete,
  });

  gsap.set(root, {
    autoAlpha: 1,
    force3D: true,
    scale: 0.92,
    transformOrigin: '50% 50%',
    xPercent: -50,
    yPercent: -50,
  });

  timeline
    .fromTo(
      halo,
      { autoAlpha: 0.54, scale: 0.14 },
      {
        autoAlpha: 0,
        duration: 1.34 * motionScale,
        ease: 'power2.out',
        scale: 1.22,
      },
      0,
    )
    .fromTo(
      outerRing,
      { autoAlpha: 0.92, scale: 0.16 },
      {
        autoAlpha: 0,
        duration: 1.12 * motionScale,
        ease: 'sine.out',
        scale: 1.12,
      },
      0.02 * motionScale,
    )
    .fromTo(
      innerRing,
      { autoAlpha: 0.72, rotation: -4, scale: 0.1 },
      {
        autoAlpha: 0,
        duration: 0.86 * motionScale,
        ease: 'power2.out',
        rotation: 6,
        scale: 0.96,
      },
      0.08 * motionScale,
    )
    .fromTo(
      core,
      { autoAlpha: 0.7, scale: 0.26 },
      {
        autoAlpha: 0,
        duration: 0.46 * motionScale,
        ease: 'power2.out',
        scale: 0.78,
      },
      0,
    );

  return {
    kill: () => timeline.kill(),
  };
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function loadDesktopRippleGsap(): Promise<DesktopRippleGsap> {
  desktopRippleGsapPromise ??= import('gsap').then((module) => module.gsap);

  return desktopRippleGsapPromise;
}

function applyElementStyles(element: HTMLElement | SVGElement, styles: Record<string, string>): void {
  Object.assign(element.style, styles);
}
