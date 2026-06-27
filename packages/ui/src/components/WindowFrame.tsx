import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../class-names';
import { Surface } from './Surface';

export interface WindowFrameProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function WindowFrame({ title, children, actions, className, ...props }: WindowFrameProps) {
  return (
    <Surface className={cn('overflow-hidden rounded-lg', className)} tone="glass" {...props}>
      <div className="flex h-11 items-center justify-between border-b border-[var(--ko-border)] px-4">
        <div className="min-w-0 text-sm font-semibold text-[var(--ko-ink)]">{title}</div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </Surface>
  );
}
