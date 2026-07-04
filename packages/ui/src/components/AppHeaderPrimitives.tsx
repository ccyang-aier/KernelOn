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
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium outline-none transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/90 disabled:cursor-not-allowed disabled:opacity-45',
        selected
          ? 'border-white/72 bg-white/82 text-[#1f2937] shadow-[0_7px_18px_rgba(36,52,68,0.13),inset_0_1px_0_rgba(255,255,255,0.82)]'
          : 'border-white/46 bg-white/42 text-[#1f2937]/78 hover:border-white/68 hover:bg-white/66 hover:text-[#111827]',
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
        'inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-white/48 bg-white/36 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_7px_18px_rgba(38,55,72,0.08)]',
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
        'inline-flex h-9 min-w-[142px] max-w-[220px] shrink items-center gap-2 rounded-full border border-white/52 bg-white/50 px-3 text-[#1f2937]/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_7px_18px_rgba(38,55,72,0.08)] focus-within:border-white/80 focus-within:bg-white/72 focus-within:ring-2 focus-within:ring-white/76',
        className,
      )}
    >
      {leadingIcon ? <span className="shrink-0 text-[#1f2937]/56">{leadingIcon}</span> : null}
      <input
        className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#111827] outline-none placeholder:text-[#1f2937]/52"
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
      <div className="truncate text-[13px] font-semibold leading-[1.15] text-[#172033]/86">
        {title}
      </div>
      {subtitle || status ? (
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium leading-none text-[#5f6d7d]/78">
          {subtitle ? <span className="truncate">{subtitle}</span> : null}
          {status ? <span className="shrink-0">{status}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
