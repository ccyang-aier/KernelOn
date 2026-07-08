'use client';

import type { ReactNode } from 'react';

type HeroFrostedActionVariant = 'preview' | 'like';

export function HeroFrostedAction({
  children,
  variant,
}: Readonly<{
  children: ReactNode;
  variant: HeroFrostedActionVariant;
}>) {
  return (
    <span
      className={`wallpaper-home__frosted-action wallpaper-home__frosted-action--${variant}`}
      data-wallpaper-hero-action-frosted={variant}
    >
      {children}
    </span>
  );
}
