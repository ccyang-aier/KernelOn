import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../class-names';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: ReactNode;
  selected?: boolean;
}

export function IconButton({
  children,
  className,
  selected = false,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-md border text-[var(--ko-muted)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ko-ring)]',
        selected
          ? 'border-[var(--ko-accent)] bg-[var(--ko-accent-soft)] text-[var(--ko-accent)]'
          : 'border-transparent hover:border-[var(--ko-border)] hover:bg-white/75 hover:text-[var(--ko-ink)]',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
