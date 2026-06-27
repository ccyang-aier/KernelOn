import type { ReactNode } from 'react';

export interface ModuleChromeProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function ModuleChrome({ title, description, children }: ModuleChromeProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--ko-ink)]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--ko-muted)]">{description}</p>
      </div>
      {children ? <div className="grid gap-2">{children}</div> : null}
    </section>
  );
}

export function MetricRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--ko-border)] bg-white/70 px-3 py-2">
      <span className="text-xs text-[var(--ko-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--ko-ink)]">{value}</span>
    </div>
  );
}
