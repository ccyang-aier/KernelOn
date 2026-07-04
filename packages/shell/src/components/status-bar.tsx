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
            iconClassName="h-[24px] w-[24px]"
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
            buttonClassName="w-[35px]"
            iconClassName="h-[25px] w-[35px]"
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
  buttonClassName?: string;
  iconClassName?: string;
  iconVariant?: string;
  badge?: ReactNode;
  pressed?: boolean;
  onClick?: () => void;
}

function StatusBarIconButton({
  Icon,
  label,
  buttonClassName = 'w-[27px]',
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
      className={`relative flex h-[30px] ${buttonClassName} shrink-0 items-center justify-center rounded-full text-white/95 outline-none transition duration-150 ease-out hover:scale-[1.025] focus-visible:ring-2 focus-visible:ring-white/80`}
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
          <circle cx="17.45" cy="8.15" fill="black" r="8.2" />
        </mask>
      </defs>
      <circle
        cx="10.35"
        cy="12.75"
        mask="url(#kernelon-status-theme-moon-mask)"
        r="8.65"
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
        d="M4 7.95c4.56-3.2 11.44-3.2 16 0M7.15 12.15c2.78-1.92 6.92-1.92 9.7 0M10.18 16.05c1.02-.7 2.62-.7 3.64 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.48"
      />
      <circle cx="12" cy="20.35" fill="currentColor" r="1.34" />
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
      viewBox="0 0 50 29"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.1 4.45h27.6c4.04 0 7.42 3.02 8 7.02h1.38a4.45 4.45 0 0 1 4.42 4.45v.66a4.45 4.45 0 0 1-4.42 4.45H43.7c-.58 4.03-3.96 7.08-8 7.08H8.1A8.1 8.1 0 0 1 0 20.01v-7.46a8.1 8.1 0 0 1 8.1-8.1Z"
      />
      <path
        d="M28.65 1.5 15.2 15.18h7.98l-3.5 12.48 15.2-14.9H26.8L28.65 1.5Z"
        fill="rgba(55,65,61,0.76)"
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
