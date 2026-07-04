'use client';

import { LiquidGlassSimple } from '@kernelon/ui';
import {
  Bell,
  Search,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from 'react';

import {
  kernelOnBrandLogo,
} from '../visual-assets';

export interface KernelOnStatusBarProps {
  spotlightOpen: boolean;
  onToggleSpotlight(): void;
}

export function KernelOnStatusBar({
  spotlightOpen,
  onToggleSpotlight,
}: KernelOnStatusBarProps) {
  return (
    <header
      aria-label="KernelOn status bar"
      className="pointer-events-none fixed inset-x-0 top-0 z-30 w-full"
      data-testid="kernelon-status-bar"
      style={statusBarShellStyle}
    >
      <LiquidGlassSimple
        className="pointer-events-auto h-[40px] w-full text-white shadow-none"
        contentClassName="h-full w-full justify-between px-[14px] pt-[2px]"
        data-testid="kernelon-status-glass"
        filterId="kernelon-status-bar-liquid-glass"
        radius={0}
        shine={false}
      >
        <span
          aria-label="KernelOn product identity"
          className="flex h-[38px] min-w-0 items-center justify-start gap-[8px]"
          data-testid="kernelon-status-brand"
        >
          <img
            alt=""
            className="-ml-[3px] h-[30px] w-[30px] shrink-0 object-contain"
            data-testid="kernelon-status-brand-logo"
            draggable={false}
            src={kernelOnBrandLogo}
            style={statusBrandLogoStyle}
          />
          <span
            className="truncate text-[14px] font-semibold leading-none text-white/96"
            style={statusBrandTextStyle}
          >
            KernelOn
          </span>
        </span>
        <span
          className="flex h-[38px] w-[500px] shrink-0 items-center justify-end gap-[17px]"
          data-testid="kernelon-status-controls"
        >
          <StatusBarIconButton
            Icon={StatusThemeIcon}
            iconClassName="h-[25px] w-[25px]"
            label="Theme"
          />
          <StatusBarIconButton
            Icon={StatusVolumeIcon}
            iconClassName="h-[24px] w-[24px]"
            label="Volume"
          />
          <StatusBarIconButton
            Icon={StatusBluetoothIcon}
            iconClassName="h-[23px] w-[23px]"
            label="Bluetooth"
          />
          <StatusBarIconButton
            Icon={StatusWifiIcon}
            iconClassName="h-[24px] w-[24px]"
            label="Wi-Fi"
          />
          <StatusBarIconButton
            Icon={StatusBatteryIcon}
            iconClassName="h-[26px] w-[31px]"
            label="Battery"
          />
          <StatusBarIconButton
            Icon={Search}
            iconClassName="h-[24px] w-[24px]"
            label="AI Spotlight"
            onClick={onToggleSpotlight}
            pressed={spotlightOpen}
          />
          <StatusBarIconButton
            Icon={Bell}
            badge={
              <span
                className="absolute top-[2px] right-[-2px] size-[7px] rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.96),0_1px_2px_rgba(64,112,131,0.22)]"
                data-testid="kernelon-notification-dot"
              />
            }
            iconClassName="h-[23px] w-[23px]"
            label="Notifications"
          />
          <StatusBarIconButton
            Icon={StatusControlCenterIcon}
            iconClassName="h-[23px] w-[23px]"
            label="Control Center"
          />
          <StatusBarTime />
        </span>
      </LiquidGlassSimple>
    </header>
  );
}

type StatusIconProps = SVGProps<SVGSVGElement>;
type StatusBarIconComponent = ComponentType<StatusIconProps>;

interface StatusBarIconButtonProps {
  Icon: StatusBarIconComponent;
  label: string;
  iconClassName?: string;
  iconVariant?: string;
  badge?: ReactNode;
  pressed?: boolean;
  onClick?: () => void;
}

function StatusBarIconButton({
  Icon,
  label,
  iconClassName = 'h-[23px] w-[23px]',
  iconVariant,
  badge,
  pressed,
  onClick,
}: StatusBarIconButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={typeof pressed === 'boolean' ? pressed : undefined}
      className="relative flex h-[30px] w-[27px] shrink-0 items-center justify-center rounded-full text-white/95 outline-none transition duration-150 ease-out hover:scale-[1.025] focus-visible:ring-2 focus-visible:ring-white/80"
      data-icon-variant={iconVariant}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={iconClassName}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.38}
        style={statusGlyphStyle}
      />
      {badge}
    </button>
  );
}

function StatusThemeIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="kernelon-status-theme-moon-mask">
          <rect fill="white" height="24" width="24" />
          <circle cx="18.1" cy="8.25" fill="black" r="8.15" />
        </mask>
      </defs>
      <circle
        cx="10.7"
        cy="12.35"
        mask="url(#kernelon-status-theme-moon-mask)"
        r="9.05"
      />
    </svg>
  );
}

function StatusVolumeIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3.35 9.15v5.7h4.08l5.22 4.25V4.9L7.43 9.15H3.35z" fill="currentColor" />
      <path
        d="M15.45 8.05c1.1.95 1.72 2.33 1.72 3.95s-.62 3-1.72 3.95M18.48 5.55A8.46 8.46 0 0 1 21.15 12a8.46 8.46 0 0 1-2.67 6.45"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.45"
      />
    </svg>
  );
}

function StatusBluetoothIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m7.2 6.25 9.55 9.55L11.65 21V3l5.1 5.2L7.2 17.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
    </svg>
  );
}

function StatusWifiIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.95 9.1c4.58-3.55 11.52-3.55 16.1 0M7.1 12.65c2.84-2.14 6.96-2.14 9.8 0M10.36 16.2a2.67 2.67 0 0 1 3.28 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.65"
      />
      <circle cx="12" cy="18.85" fill="currentColor" r="1.55" />
    </svg>
  );
}

function StatusBatteryIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 28 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5.15 5.55h13.9a4.25 4.25 0 0 1 4.1 3.15h.7a2.1 2.1 0 0 1 2.08 2.08v2.44a2.1 2.1 0 0 1-2.08 2.08h-.7a4.25 4.25 0 0 1-4.1 3.15H5.15A4.65 4.65 0 0 1 .5 13.8v-3.6a4.65 4.65 0 0 1 4.65-4.65z" />
      <path
        d="m16.4 7.05-7.5 7.32h4.18l-.82 4.62 7.95-8.42h-4.48l.67-3.52z"
        fill="rgba(61,73,69,0.68)"
      />
    </svg>
  );
}

function StatusControlCenterIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );
}

function StatusBarTime() {
  const [date, setDate] = useState(() => new Date());
  const timeLabel = formatStatusBarTime(date);

  useEffect(() => {
    const updateTime = () => setDate(new Date());

    updateTime();
    const intervalId = window.setInterval(updateTime, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <time
      aria-label={`System time ${timeLabel}`}
      className="min-w-[136px] shrink-0 text-right text-[15px] font-semibold leading-none text-white/95"
      data-testid="kernelon-status-time"
      dateTime={date.toISOString()}
      style={statusTimeTextStyle}
      suppressHydrationWarning
    >
      {timeLabel}
    </time>
  );
}

function formatStatusBarTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
    month: 'short',
    weekday: 'short',
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return [
    valueByType.get('weekday'),
    valueByType.get('month'),
    valueByType.get('day'),
    `${valueByType.get('hour')}:${valueByType.get('minute')}`,
    valueByType.get('dayPeriod'),
  ]
    .filter(Boolean)
    .join(' ');
}

const statusBarShellStyle = {
  height: 40,
} as CSSProperties;

const statusBrandLogoStyle = {
  filter:
    'drop-shadow(0 0 2px rgba(255,255,255,0.68)) drop-shadow(0 2px 3px rgba(45,92,111,0.24))',
} as CSSProperties;

const statusBrandTextStyle = {
  letterSpacing: 0,
  textShadow: '0 0 5px rgba(255,255,255,0.52), 0 1px 3px rgba(45,92,111,0.26)',
} as CSSProperties;

const statusTimeTextStyle = {
  letterSpacing: 0,
  textShadow: '0 0 4px rgba(255,255,255,0.48), 0 1px 3px rgba(45,92,111,0.28)',
} as CSSProperties;

const statusGlyphStyle = {
  filter:
    'drop-shadow(0 0 2px rgba(255,255,255,0.74)) drop-shadow(0 2px 2px rgba(45,92,111,0.24))',
} as CSSProperties;
