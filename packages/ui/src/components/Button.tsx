import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../class-names';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ko-ring)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--ko-accent)] text-white shadow-[0_12px_30px_rgba(23,111,93,0.22)] hover:bg-[var(--ko-accent-strong)]',
        secondary:
          'border border-[var(--ko-border)] bg-white/82 text-[var(--ko-ink)] shadow-[0_10px_24px_rgba(17,24,39,0.06)] hover:bg-white',
        ghost: 'text-[var(--ko-muted)] hover:bg-black/[0.04] hover:text-[var(--ko-ink)]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children: ReactNode;
}

export function Button({
  asChild = false,
  children,
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : type}
      {...props}
    >
      {children}
    </Comp>
  );
}
