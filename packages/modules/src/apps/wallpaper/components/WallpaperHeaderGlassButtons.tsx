'use client';

import { Glass, type GlassOptics } from '@kernelon/ui/liquid-glass';
import { LiquidGlass } from '@kernelon/ui/liquidglass';
import { useEffect, useRef, type ReactNode } from 'react';

const WALLPAPER_HEADER_GLASS_SIZE = 42;
const WALLPAPER_HEADER_GLASS_RADIUS = WALLPAPER_HEADER_GLASS_SIZE / 2;

const samasanteHeaderOptics: Partial<GlassOptics> = {
  mapSize: 256,
  clipToShape: true,
  softEdge: true,
  depth: 0.82,
  curvature: 0.46,
  strength: 0.18,
  dispersion: 0.32,
  bend: 0.78,
  bendWidth: 0.14,
  frost: 1.6,
  brightness: 0.12,
  specular: 1.05,
  sheen: 0.68,
  sheenAngle: 42,
  sheenWidth: 2.25,
  sheenFalloff: 1.45,
  glow: 0.18,
  glowSpread: 0.82,
  glowFalloff: 0.85,
  edgeShadow: '0 8px 18px rgba(3, 8, 12, 0.16)',
};

const ybouaneHeaderConfig = JSON.stringify({
  blurAmount: 0.16,
  refraction: 0.9,
  chromAberration: 0.028,
  edgeHighlight: 0.075,
  specular: 0.46,
  fresnel: 0.88,
  distortion: 0.014,
  cornerRadius: WALLPAPER_HEADER_GLASS_RADIUS,
  zRadius: 18,
  opacity: 0.98,
  saturation: 0.18,
  tintStrength: 0.02,
  brightness: 0.055,
  shadowOpacity: 0.2,
  shadowSpread: 6,
  shadowOffsetY: 2,
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
  return (
    <span
      className="wallpaper-header-glass-root wallpaper-header-glass-root--samasante"
      data-wallpaper-glass-engine="samasante-liquid-glass"
      title="samasante/liquid-glass"
    >
      <Glass
        aria-hidden="true"
        behind="#506875"
        brightnessInFilter
        className="wallpaper-header-glass-lens wallpaper-header-glass-lens--samasante"
        filterResolution={2}
        height={WALLPAPER_HEADER_GLASS_SIZE}
        optics={samasanteHeaderOptics}
        radius={WALLPAPER_HEADER_GLASS_RADIUS}
        refract={
          <span
            aria-hidden="true"
            className="wallpaper-header-glass-copy"
            style={{ backgroundImage: `url(${backdropImage})` }}
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
  const backdropRef = useRef<HTMLImageElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const backdrop = backdropRef.current;
    const button = buttonRef.current;

    if (!root || !backdrop || !button) {
      return undefined;
    }

    let cancelled = false;
    let instance: LiquidGlass | null = null;
    const animationFrame = window.requestAnimationFrame(() => {
      const initialize = async () => {
        await waitForImage(backdrop);

        if (cancelled) {
          return;
        }

        const nextInstance = await LiquidGlass.init({
          root,
          glassElements: [button],
        });

        if (cancelled) {
          nextInstance.destroy();
          return;
        }

        instance = nextInstance;
        instanceRef.current = nextInstance;
        root.dataset.wallpaperGlassReady = 'true';
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
      instance?.destroy();
      instanceRef.current = null;
      delete root.dataset.wallpaperGlassReady;
    };
  }, []);

  useEffect(() => {
    const backdrop = backdropRef.current;

    if (!backdrop) {
      return;
    }

    const refreshBackdrop = async () => {
      await waitForImage(backdrop);
      instanceRef.current?.markChanged(backdrop);
    };

    void refreshBackdrop();
  }, [backdropImage]);

  return (
    <span
      className="wallpaper-header-glass-root wallpaper-header-glass-root--ybouane"
      data-wallpaper-glass-engine="ybouane-liquidglass"
      ref={rootRef}
      title="ybouane/liquidglass"
    >
      <img
        alt=""
        aria-hidden="true"
        className="wallpaper-header-glass-backdrop"
        crossOrigin="anonymous"
        draggable={false}
        ref={backdropRef}
        src={backdropImage}
      />
      <button
        aria-label={label}
        className="wallpaper-header-glass-button wallpaper-header-glass-button--ybouane"
        data-config={ybouaneHeaderConfig}
        data-wallpaper-glass-control={label.toLowerCase()}
        ref={buttonRef}
        type="button"
      >
        <span aria-hidden="true" className="wallpaper-header-glass-icon">
          {children}
        </span>
      </button>
    </span>
  );
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
  if (!image.complete) {
    await new Promise<void>((resolve) => {
      const settle = () => resolve();

      image.addEventListener('load', settle, { once: true });
      image.addEventListener('error', settle, { once: true });
    });
  }

  if (typeof image.decode === 'function') {
    await image.decode().catch(() => undefined);
  }
}
