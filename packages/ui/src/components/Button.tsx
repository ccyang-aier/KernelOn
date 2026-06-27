import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../class-names';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

const variantClassNames = {
  primary:
    'bg-[var(--ko-accent)] text-white shadow-[0_12px_30px_rgba(23,111,93,0.22)] hover:bg-[var(--ko-accent-strong)]',
  secondary:
    'border border-[var(--ko-border)] bg-white/82 text-[var(--ko-ink)] shadow-[0_10px_24px_rgba(17,24,39,0.06)] hover:bg-white',
  ghost: 'text-[var(--ko-muted)] hover:bg-black/[0.04] hover:text-[var(--ko-ink)]',
};

const sizeClassNames = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export function Button({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ko-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        variantClassNames[variant],
        sizeClassNames[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
