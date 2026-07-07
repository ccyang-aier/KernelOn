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
        aberrationIntensity={variant === 'preview' ? 1.72 : 1.62}
        blurAmount={0.34}
        className="wallpaper-home__liquid-action-glass"
        containerBorderMode="external"
        cornerRadius={999}
        displacementScale={variant === 'preview' ? 70 : 64}
        elasticity={0.12}
        mode="prominent"
        padding="0px"
        saturation={180}
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
