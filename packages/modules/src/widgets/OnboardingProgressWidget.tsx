import type { WidgetSurfaceProps } from '@kernelon/shell';

export default function OnboardingProgressWidget({ widget }: WidgetSurfaceProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-[var(--ko-ink)]">{widget.name}</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--ko-muted)]">{widget.description}</p>
      </div>
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-[var(--ko-accent-soft)]">
          <div className="h-2 w-3/4 rounded-full bg-[var(--ko-accent)]" />
        </div>
        <div className="text-xs text-[var(--ko-muted)]">12 位新人 · 76% 完成</div>
      </div>
    </div>
  );
}
