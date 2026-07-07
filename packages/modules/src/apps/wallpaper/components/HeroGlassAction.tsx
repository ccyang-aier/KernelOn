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
        blurAmount={0.38}
        className="wallpaper-home__liquid-action-glass"
        displacementScale={82}
        padding="0px"
        saturation={165}
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
