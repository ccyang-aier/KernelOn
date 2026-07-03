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
    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.50)) drop-shadow(0 0 22px rgba(138,215,231,0.30))',
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

  LIQUID_WAVE_PATHS.forEach((pathConfig, index) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.dataset.ripplePart = 'liquid-wave';
    path.dataset.waveIndex = String(index);
    path.setAttribute('d', pathConfig.d);
    path.setAttribute('pathLength', '1');
    path.setAttribute('stroke', pathConfig.stroke);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', pathConfig.strokeWidth);
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

const LIQUID_WAVE_PATHS = [
  {
    d: 'M 66 18 C 72 20 78 17 84 21 C 91 24 96 28 101 33 C 107 38 112 43 113 51 C 115 57 113 62 116 67 C 115 73 116 79 112 86 C 108 92 103 96 99 101 C 93 106 87 110 80 111 C 74 113 69 110 63 114 C 57 112 51 113 45 109 C 39 105 33 101 29 95 C 25 90 19 84 18 77 C 17 71 20 66 17 60 C 19 54 19 48 23 42 C 27 36 32 32 38 28 C 44 25 49 20 56 20 C 61 19 64 16 66 18 Z',
    stroke: 'rgba(255,255,255,0.90)',
    strokeWidth: '2.75',
  },
  {
    d: 'M 66 31 C 72 33 77 30 83 34 C 90 37 96 42 99 49 C 103 56 101 62 103 69 C 101 76 97 83 91 88 C 86 94 78 96 70 99 C 63 97 56 99 49 94 C 43 90 37 84 34 77 C 31 70 33 63 31 57 C 34 50 37 43 43 39 C 49 34 57 31 66 31 Z',
    stroke: 'rgba(214,248,255,0.74)',
    strokeWidth: '2',
  },
  {
    d: 'M 66 44 C 71 45 75 43 80 47 C 85 50 89 55 90 61 C 92 67 88 72 87 78 C 82 82 76 84 70 87 C 63 85 58 87 52 83 C 47 79 43 75 41 69 C 40 63 43 58 44 53 C 49 49 55 45 66 44 Z',
    stroke: 'rgba(255,255,255,0.54)',
    strokeWidth: '1.6',
  },
  {
    d: 'M 66 10 C 75 12 83 9 92 14 C 103 19 112 26 118 37 C 124 48 122 58 125 68 C 123 79 120 91 111 101 C 102 111 92 117 80 122 C 69 124 58 121 47 119 C 35 115 25 108 18 97 C 11 86 8 75 9 62 C 10 50 15 39 23 30 C 32 20 44 14 56 12 C 61 11 64 8 66 10 Z',
    stroke: 'rgba(255,255,255,0.72)',
    strokeWidth: '1.25',
  },
] as const;

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
    path.style.strokeDasharray = resolveLiquidWaveDashPattern(length);
    path.style.strokeDashoffset = `${length * 0.22}`;
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
    const startScale = [0.46, 0.58, 0.7, 0.38][index] ?? 0.5;
    const endScale = [1.08, 1.0, 0.92, 1.16][index] ?? 1;
    const endRotation = [-2, 2, -1, 3][index] ?? 0;

    timeline.fromTo(
      path,
      {
        autoAlpha: index === 0 ? 0.88 : 0.7,
        rotation: 0,
        scale: startScale,
        strokeDashoffset: length * 0.22,
      },
      {
        autoAlpha: 0,
        duration: (0.86 + index * 0.08) * motionScale,
        ease: 'power2.out',
        rotation: endRotation,
        scale: endScale,
        strokeDashoffset: -length * 0.22,
      },
      index * 0.035 * motionScale,
    );
  });

  return {
    kill: () => timeline.kill(),
  };
}

function resolveLiquidWaveDashPattern(length: number): string {
  return `${length * 0.92} ${length * 0.08}`;
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
