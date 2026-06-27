import type { WidgetSurfaceProps } from '@kernelon/shell';

export default function MentorLoadWidget({ widget }: WidgetSurfaceProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-[var(--ko-ink)]">{widget.name}</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--ko-muted)]">{widget.description}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['18', '可用'],
          ['3', '高载'],
          ['5', '待配'],
        ].map(([value, label]) => (
          <div className="rounded-md bg-white/75 px-2 py-2" key={label}>
            <div className="text-sm font-semibold text-[var(--ko-ink)]">{value}</div>
            <div className="mt-1 text-[10px] text-[var(--ko-muted)]">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
