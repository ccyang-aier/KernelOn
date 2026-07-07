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
        className="wallpaper-home__liquid-action-glass"
        padding="0px"
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
