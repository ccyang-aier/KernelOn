import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';

import { cn } from '../class-names';

export interface AppHeaderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  selected?: boolean;
}

export function AppHeaderButton({
  children,
  className,
  selected = false,
  type = 'button',
  ...props
}: AppHeaderButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium outline-none transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[var(--ko-app-header-focus-ring)] disabled:cursor-not-allowed disabled:opacity-45',
        selected
          ? 'border-[var(--ko-app-header-border-strong)] bg-[var(--ko-app-header-surface-strong)] text-[var(--ko-app-header-ink)] shadow-[var(--ko-app-header-control-shadow-selected)]'
          : 'border-[var(--ko-app-header-border)] bg-[var(--ko-app-header-surface-muted)] text-[var(--ko-app-header-ink)] hover:border-[var(--ko-app-header-border-strong)] hover:bg-[var(--ko-app-header-surface)] hover:text-[var(--ko-app-header-ink-strong)]',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export interface AppHeaderGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AppHeaderGroup({ children, className, ...props }: AppHeaderGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[var(--ko-app-header-border)] bg-[var(--ko-app-header-surface-muted)] p-0.5 shadow-[var(--ko-app-header-control-shadow)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AppHeaderSegmentedControlOption {
  label: string;
  value: string;
}

export interface AppHeaderSegmentedControlProps extends HTMLAttributes<HTMLDivElement> {
  options: AppHeaderSegmentedControlOption[];
  value: string;
  onValueChange?(value: string): void;
}

export function AppHeaderSegmentedControl({
  className,
  onValueChange,
  options,
  value,
  ...props
}: AppHeaderSegmentedControlProps) {
  return (
    <AppHeaderGroup className={className} role="group" {...props}>
      {options.map((option) => (
        <AppHeaderButton
          aria-pressed={option.value === value}
          className="h-7 px-2.5"
          key={option.value}
          onClick={() => onValueChange?.(option.value)}
          selected={option.value === value}
        >
          {option.label}
        </AppHeaderButton>
      ))}
    </AppHeaderGroup>
  );
}

export interface AppHeaderSearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
}

export function AppHeaderSearchField({
  className,
  leadingIcon,
  type = 'search',
  ...props
}: AppHeaderSearchFieldProps) {
  return (
    <label
      className={cn(
        'inline-flex h-9 min-w-[142px] max-w-[220px] shrink items-center gap-2 rounded-full border border-[var(--ko-app-header-border)] bg-[var(--ko-app-header-surface)] px-3 text-[var(--ko-app-header-ink)] shadow-[var(--ko-app-header-control-shadow)] focus-within:border-[var(--ko-app-header-border-strong)] focus-within:bg-[var(--ko-app-header-surface-strong)] focus-within:ring-2 focus-within:ring-[var(--ko-app-header-focus-ring)]',
        className,
      )}
    >
      {leadingIcon ? (
        <span className="shrink-0 text-[var(--ko-app-header-placeholder)]">{leadingIcon}</span>
      ) : null}
      <input
        className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[var(--ko-app-header-ink-strong)] outline-none placeholder:text-[var(--ko-app-header-placeholder)]"
        type={type}
        {...props}
      />
    </label>
  );
}

export interface AppHeaderTitleBlockProps extends HTMLAttributes<HTMLDivElement> {
  subtitle?: string;
  title: string;
  status?: string;
}

export function AppHeaderTitleBlock({
  className,
  status,
  subtitle,
  title,
  ...props
}: AppHeaderTitleBlockProps) {
  return (
    <div className={cn('min-w-0 select-none', className)} {...props}>
      <div className="truncate text-[13px] font-semibold leading-[1.15] text-[var(--ko-app-header-ink)]">
        {title}
      </div>
      {subtitle || status ? (
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium leading-none text-[var(--ko-app-header-ink-muted)]">
          {subtitle ? <span className="truncate">{subtitle}</span> : null}
          {status ? <span className="shrink-0">{status}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
