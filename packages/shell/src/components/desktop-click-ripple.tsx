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

const DESKTOP_RIPPLE_WAVE_COUNT = 3;
const DESKTOP_RIPPLE_WAVE_STAGGER = 0.28;
const DESKTOP_RIPPLE_RING_REVEAL_DURATION = 0.18;
const DESKTOP_RIPPLE_HALO_REVEAL_DURATION = 0.22;

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
    ...Array.from({ length: DESKTOP_RIPPLE_WAVE_COUNT }, (_, index) =>
      createDesktopRipplePart('wave-halo', index),
    ),
    ...Array.from({ length: DESKTOP_RIPPLE_WAVE_COUNT }, (_, index) =>
      createDesktopRipplePart('wave-ring', index),
    ),
    createDesktopRipplePart('core'),
  );

  return root;
}

function createDesktopRipplePart(kind: 'core' | 'wave-halo' | 'wave-ring', waveIndex?: number) {
  const part = document.createElement('span');
  part.dataset.ripplePart = kind;

  if (waveIndex !== undefined) {
    part.dataset.rippleWave = String(waveIndex);
  }

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
      zIndex: '3',
    },
    'wave-halo': {
      background:
        'radial-gradient(circle, rgba(255,255,255,0.42) 0%, rgba(182,228,238,0.20) 34%, rgba(255,255,255,0) 70%)',
      filter: 'blur(1px)',
      inset: '4px',
      zIndex: '1',
    },
    'wave-ring': {
      border: '1px solid rgba(255,255,255,0.68)',
      boxShadow: '0 0 14px rgba(255,255,255,0.34), 0 0 24px rgba(145,208,223,0.20)',
      inset: '12px',
      zIndex: '2',
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
    const core = root.querySelector('[data-ripple-part="core"]');
    const waveHalos = Array.from(
      root.querySelectorAll<HTMLElement>('[data-ripple-part="wave-halo"]'),
    );
    const waveRings = Array.from(
      root.querySelectorAll<HTMLElement>('[data-ripple-part="wave-ring"]'),
    );
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
      .fromTo(
        core,
        { autoAlpha: 0, scale: 0.18 },
        {
          autoAlpha: 0.72,
          duration: 0.12 * motionScale,
          ease: 'power2.out',
          scale: 0.42,
        },
        'touch',
      )
      .to(
        core,
        {
          autoAlpha: 0,
          duration: 0.48 * motionScale,
          ease: 'power2.out',
          scale: 0.8,
        },
        0.12 * motionScale,
      );

    waveRings.forEach((ring, index) => {
      const waveStart = (0.06 + index * DESKTOP_RIPPLE_WAVE_STAGGER) * motionScale;

      timeline
        .fromTo(
          ring,
          { autoAlpha: 0, scale: 0.12 + index * 0.02 },
          {
            autoAlpha: 0.82 - index * 0.1,
            duration: DESKTOP_RIPPLE_RING_REVEAL_DURATION * motionScale,
            ease: 'power2.out',
            scale: 0.26 + index * 0.03,
          },
          waveStart,
        )
        .to(
          ring,
          {
            autoAlpha: 0,
            duration: (1.08 + index * 0.12) * motionScale,
            ease: 'sine.out',
            scale: 1.06 + index * 0.1,
          },
          waveStart + DESKTOP_RIPPLE_RING_REVEAL_DURATION * motionScale,
        );
    });

    waveHalos.forEach((halo, index) => {
      const waveStart = (0.12 + index * DESKTOP_RIPPLE_WAVE_STAGGER) * motionScale;

      timeline
        .fromTo(
          halo,
          { autoAlpha: 0, scale: 0.16 + index * 0.02 },
          {
            autoAlpha: 0.36 - index * 0.06,
            duration: DESKTOP_RIPPLE_HALO_REVEAL_DURATION * motionScale,
            ease: 'power2.out',
            scale: 0.34 + index * 0.04,
          },
          waveStart,
        )
        .to(
          halo,
          {
            autoAlpha: 0,
            duration: (1.18 + index * 0.14) * motionScale,
            ease: 'power2.out',
            scale: 1.2 + index * 0.12,
          },
          waveStart + DESKTOP_RIPPLE_HALO_REVEAL_DURATION * motionScale,
        );
    });

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
