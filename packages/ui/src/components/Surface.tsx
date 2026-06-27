import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../class-names';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'panel' | 'glass';
}

export function Surface({ children, className, tone = 'panel', ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        'border border-[var(--ko-border)] shadow-[0_20px_60px_rgba(17,24,39,0.08)]',
        tone === 'glass' ? 'bg-white/72 backdrop-blur-xl' : 'bg-[var(--ko-surface)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
