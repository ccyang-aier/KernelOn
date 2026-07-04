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
            iconClassName="h-[21px] w-[21px]"
            label="Theme"
          />
          <StatusBarIconButton
            Icon={StatusVolumeIcon}
            iconClassName="h-[24px] w-[24px]"
            label="Volume"
          />
          <StatusBarIconButton
            Icon={StatusBluetoothIcon}
            iconClassName="h-[21px] w-[21px]"
            label="Bluetooth"
          />
          <StatusBarIconButton
            Icon={StatusWifiIcon}
            iconClassName="h-[24px] w-[24px]"
            label="Wi-Fi"
          />
          <StatusBarIconButton
            Icon={StatusBatteryIcon}
            iconClassName="h-[25px] w-[25px]"
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
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c3.91 0 7.24-2.5 8.48-6a7.58 7.58 0 0 1-4.98 1.84A7.34 7.34 0 0 1 8.16 9.5c0-1.9.72-3.63 1.9-4.93A8.9 8.9 0 0 1 12 3z" />
    </svg>
  );
}

function StatusVolumeIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 9v6h4l5 5V4L7 9H3z" />
      <path d="M14 8.05v7.9A4.47 4.47 0 0 0 16.5 12 4.47 4.47 0 0 0 14 8.05z" />
      <path d="M14 3.23v2.06A7.01 7.01 0 0 1 19 12a7.01 7.01 0 0 1-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function StatusBluetoothIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71L13.41 12l4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z" />
    </svg>
  );
}

function StatusWifiIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m1 9 2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9z" />
      <path d="m9 17 3 3.01L15 17c-1.65-1.66-4.34-1.66-6 0z" />
      <path d="m5 13 2 2c2.76-2.76 7.24-2.76 10 0l2-2c-3.86-3.86-10.13-3.86-14 0z" />
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
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.6 7.5h11.8c.95 0 1.75.78 1.75 1.75v.65h.75c.62 0 1.1.48 1.1 1.1v2c0 .62-.48 1.1-1.1 1.1h-.75v.65c0 .97-.8 1.75-1.75 1.75H4.6a2.1 2.1 0 0 1-2.1-2.1V9.6c0-1.16.94-2.1 2.1-2.1z" />
      <path
        d="m12.9 8.75-4.1 4.6h2.65l-.55 3.05 4.3-5h-2.75l.45-2.65z"
        fill="rgba(57,65,62,0.52)"
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
