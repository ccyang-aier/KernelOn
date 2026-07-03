'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

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

type DesktopRippleGsap = (typeof import('gsap'))['gsap'];

let desktopRippleGsapPromise: Promise<DesktopRippleGsap> | null = null;

export function useDesktopClickRipple(): {
  layerRef: RefObject<HTMLDivElement | null>;
  playRipple(point: DesktopRipplePoint): void;
} {
  const layerRef = useRef<HTMLDivElement>(null);
  const animationsRef = useRef<DesktopClickRippleAnimation[]>([]);
  const disposedRef = useRef(false);

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

  const playRipple = useCallback(({ x, y }: DesktopRipplePoint) => {
    const rippleLayer = layerRef.current;

    if (!rippleLayer || disposedRef.current) {
      return;
    }

    const rippleElement = createDesktopClickRippleElement(x, y);
    rippleLayer.append(rippleElement);

    let animation: DesktopClickRippleAnimation | null = null;
    void animateDesktopClickRipple(rippleElement, () => {
      rippleElement.remove();

      if (animation) {
        const completedAnimation = animation;
        animationsRef.current = animationsRef.current.filter((item) => item !== completedAnimation);
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
  }, []);

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

function createDesktopClickRippleElement(x: number, y: number): HTMLSpanElement {
  const root = document.createElement('span');
  root.dataset.testid = 'kernelon-desktop-click-ripple';

  applyElementStyles(root, {
    borderRadius: '9999px',
    height: '96px',
    left: `${x}px`,
    mixBlendMode: 'screen',
    opacity: '0',
    pointerEvents: 'none',
    position: 'absolute',
    top: `${y}px`,
    width: '96px',
    willChange: 'opacity, transform',
  });

  root.append(
    createDesktopRipplePart('halo'),
    createDesktopRipplePart('outer-ring'),
    createDesktopRipplePart('inner-ring'),
    createDesktopRipplePart('core'),
  );

  return root;
}

function createDesktopRipplePart(kind: 'halo' | 'outer-ring' | 'inner-ring' | 'core') {
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

function animateDesktopClickRipple(
  root: HTMLSpanElement,
  onComplete: () => void,
): Promise<DesktopRippleTimeline> {
  return loadDesktopRippleGsap().then((gsap) => {
    const halo = root.querySelector('[data-ripple-part="halo"]');
    const outerRing = root.querySelector('[data-ripple-part="outer-ring"]');
    const innerRing = root.querySelector('[data-ripple-part="inner-ring"]');
    const core = root.querySelector('[data-ripple-part="core"]');
    const motionScale = prefersReducedMotion() ? 0.68 : 1;
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
      .addLabel('touch', 0)
      .addLabel('inner-wave', 0.045 * motionScale)
      .addLabel('outer-wave', 0.13 * motionScale)
      .addLabel('halo-wave', 0.22 * motionScale)
      .fromTo(
        core,
        { autoAlpha: 0, scale: 0.18 },
        {
          autoAlpha: 0.72,
          duration: 0.1 * motionScale,
          ease: 'power2.out',
          scale: 0.42,
        },
        'touch',
      )
      .to(
        core,
        {
          autoAlpha: 0,
          duration: 0.34 * motionScale,
          ease: 'power2.out',
          scale: 0.8,
        },
        0.1 * motionScale,
      )
      .fromTo(
        innerRing,
        { autoAlpha: 0, rotation: -4, scale: 0.08 },
        {
          autoAlpha: 0.76,
          duration: 0.13 * motionScale,
          ease: 'power2.out',
          scale: 0.24,
        },
        'inner-wave',
      )
      .to(
        innerRing,
        {
          autoAlpha: 0,
          duration: 0.78 * motionScale,
          ease: 'power2.out',
          rotation: 6,
          scale: 0.98,
        },
        0.17 * motionScale,
      )
      .fromTo(
        outerRing,
        { autoAlpha: 0, scale: 0.12 },
        {
          autoAlpha: 0.88,
          duration: 0.16 * motionScale,
          ease: 'power2.out',
          scale: 0.3,
        },
        'outer-wave',
      )
      .to(
        outerRing,
        {
          autoAlpha: 0,
          duration: 0.92 * motionScale,
          ease: 'sine.out',
          scale: 1.12,
        },
        0.28 * motionScale,
      )
      .fromTo(
        halo,
        { autoAlpha: 0, scale: 0.18 },
        {
          autoAlpha: 0.48,
          duration: 0.18 * motionScale,
          ease: 'power2.out',
          scale: 0.38,
        },
        'halo-wave',
      )
      .to(
        halo,
        {
          autoAlpha: 0,
          duration: 1.04 * motionScale,
          ease: 'power2.out',
          scale: 1.24,
        },
        0.4 * motionScale,
      );

    return {
      kill: () => timeline.kill(),
    };
  });
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function loadDesktopRippleGsap(): Promise<DesktopRippleGsap> {
  desktopRippleGsapPromise ??= import('gsap').then((module) => module.gsap);

  return desktopRippleGsapPromise;
}

function applyElementStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.assign(element.style, styles);
}
