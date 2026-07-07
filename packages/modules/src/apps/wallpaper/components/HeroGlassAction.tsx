'use client';

import { LiquidGlassSvgFilter } from '@kernelon/ui';
import type { ReactNode } from 'react';

type HeroGlassActionVariant = 'preview' | 'like';

export function HeroGlassAction({
  children,
  variant,
}: Readonly<{
  children: ReactNode;
  variant: HeroGlassActionVariant;
}>) {
  return (
    <span
      className={`wallpaper-home__glass-action wallpaper-home__glass-action--${variant}`}
      data-wallpaper-hero-action-glass={variant}
    >
      <LiquidGlassSvgFilter
        appearanceClassName={wallpaperGlassAppearanceClassName}
        blurAmount={0.5}
        className="wallpaper-home__liquid-action-glass"
        displacementScale={104}
        elasticity={0}
        padding={heroActionGlassPadding[variant]}
        saturation={140}
        style={heroActionGlassPlacements[variant]}
      >
        {children}
      </LiquidGlassSvgFilter>
    </span>
  );
}

const heroActionGlassPlacements = {
  preview: {
    position: 'absolute',
    left: 95,
    top: 21,
  },
  like: {
    position: 'absolute',
    left: 40,
    top: 21,
  },
} as const;

const heroActionGlassPadding = {
  preview: '0px 20px',
  like: '0px 16px',
} as const;

const wallpaperGlassAppearanceClassName =
  '[--ko-liquid-glass-border-strong:rgba(255,255,255,0.24)] [--ko-liquid-glass-border-soft:rgba(255,255,255,0.09)]';
