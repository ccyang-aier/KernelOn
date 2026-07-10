'use client';

import type { MouseEventHandler, ReactNode } from 'react';

import {
  samasanteClearPillOptics,
  WallpaperHeaderSamasanteGlassButton,
  WallpaperHeaderYbouaneGlassButton,
} from './WallpaperHeaderGlassButtons';

type HeroFrostedActionVariant = 'preview' | 'like';

export function HeroFrostedAction({
  backdropImage,
  children,
  label,
  onClick,
  pressed,
  variant,
}: Readonly<{
  backdropImage: string;
  children: ReactNode;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  pressed?: boolean;
  variant: HeroFrostedActionVariant;
}>) {
  const sharedProps = {
    backdropImage,
    buttonClassName: `wallpaper-liquid-glass-button wallpaper-home__liquid-button wallpaper-home__liquid-button--${variant}`,
    children,
    contentClassName: 'wallpaper-home__liquid-content',
    height: 42,
    label,
    onClick,
    optics: variant === 'preview' ? samasanteClearPillOptics : undefined,
    pressed,
    rootClassName: `wallpaper-home__liquid-action wallpaper-home__liquid-action--${variant}`,
    width: variant === 'preview' ? 190 : 80,
  } as const;

  return variant === 'preview' ? (
    <WallpaperHeaderSamasanteGlassButton {...sharedProps} />
  ) : (
    <WallpaperHeaderYbouaneGlassButton {...sharedProps} />
  );
}
