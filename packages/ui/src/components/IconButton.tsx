import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../class-names';

const iconButtonVariants = cva(
  'inline-flex size-10 items-center justify-center rounded-md border text-[var(--ko-muted)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ko-ring)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      selected: {
        true: 'border-[var(--ko-accent)] bg-[var(--ko-accent-soft)] text-[var(--ko-accent)]',
        false:
          'border-transparent hover:border-[var(--ko-border)] hover:bg-white/75 hover:text-[var(--ko-ink)]',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

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
    <button className={cn(iconButtonVariants({ selected }), className)} type={type} {...props}>
      {children}
    </button>
  );
}
