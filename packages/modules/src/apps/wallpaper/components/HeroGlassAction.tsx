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
        aberrationIntensity={variant === 'preview' ? 2.08 : 1.92}
        blurAmount={0.04}
        className="wallpaper-home__liquid-action-glass"
        containerBorderMode="external"
        cornerRadius={999}
        displacementScale={variant === 'preview' ? 98 : 88}
        elasticity={0.09}
        mode="prominent"
        padding="0px"
        saturation={224}
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
