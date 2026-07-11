'use client';

import type { MouseEventHandler, ReactNode } from 'react';

type HeroFrostedActionVariant = 'preview' | 'like';

export function HeroFrostedAction({
  children,
  label,
  onClick,
  pressed,
  variant,
}: Readonly<{
  children: ReactNode;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  pressed?: boolean;
  variant: HeroFrostedActionVariant;
}>) {
  return (
    <span className={`wallpaper-home__frosted-action wallpaper-home__frosted-action--${variant}`}>
      <button
        aria-label={label}
        aria-pressed={pressed}
        className={`wallpaper-home__frosted-button wallpaper-home__frosted-button--${variant}`}
        onClick={onClick}
        type="button"
      >
        <span aria-hidden="true" className="wallpaper-home__frosted-content">
          {children}
        </span>
      </button>
    </span>
  );
}
