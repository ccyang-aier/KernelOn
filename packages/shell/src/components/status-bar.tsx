'use client';

import {
  Bell,
  LayoutGrid,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from 'react';

import {
  kernelOnBrandLogo,
  kernelOnStatusAvatar,
} from '../visual-assets';

export interface KernelOnStatusBarProps {
  launcherOpen: boolean;
  spotlightOpen: boolean;
  onToggleLauncher(): void;
  onToggleSpotlight(): void;
}

export function KernelOnStatusBar({
  launcherOpen,
  spotlightOpen,
  onToggleLauncher,
  onToggleSpotlight,
}: KernelOnStatusBarProps) {
  return (
    <header
      aria-label="KernelOn status bar"
      className="pointer-events-none fixed inset-x-0 top-[2px] z-30 w-full"
      data-testid="kernelon-status-bar"
      style={statusBarShellStyle}
    >
      <div className="pointer-events-auto flex h-[38px] w-full items-center justify-between pl-[14px]">
        <div
          aria-label="KernelOn product identity"
          className="flex h-full min-w-0 items-center gap-[8px]"
          data-testid="kernelon-status-brand"
        >
          <img
            alt=""
            className="h-[20px] w-[30px] shrink-0 object-contain"
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
        </div>
        <div
          className="flex h-[38px] w-[320px] shrink-0 items-center justify-end gap-[18px] pr-[10px]"
          data-testid="kernelon-status-controls"
        >
          <StatusBarIconButton
            Icon={LayoutGrid}
            iconClassName="h-[21px] w-[21px]"
            label="Launchpad"
            onClick={onToggleLauncher}
            pressed={launcherOpen}
          />
          <StatusBarIconButton
            Icon={StatusSyncIcon}
            iconClassName="h-[24px] w-[25px]"
            iconVariant="material-symbols-light:cloud-done-outline-rounded"
            label="Sync status"
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
            Icon={SlidersHorizontal}
            iconClassName="h-[23px] w-[23px]"
            label="Control Center"
          />
          <StatusBarProfileButton />
        </div>
      </div>
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

function StatusSyncIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.344 14.875L8.56 13.091q-.147-.147-.345-.156t-.363.155q-.165.166-.165.357q0 .192.165.357l1.933 1.938q.242.243.565.243t.566-.243l4.032-4.032q.146-.146.156-.35t-.156-.37t-.36-.165t-.36.166zM6.5 19q-1.871 0-3.185-1.306Q2 16.39 2 14.517q0-1.719 1.175-3.051t2.921-1.431q.337-2.185 2.01-3.61T12 5q2.502 0 4.251 1.749T18 11v1h.616q1.436.046 2.41 1.055T22 15.5q0 1.471-1.014 2.486T18.5 19z" />
    </svg>
  );
}

function StatusBarProfileButton() {
  return (
    <button
      aria-label="KernelOn profile"
      className="relative flex size-[32px] shrink-0 items-center justify-center rounded-full outline-none transition duration-150 ease-out hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/80"
      title="KernelOn profile"
      type="button"
    >
      <span className="absolute inset-0 rounded-full bg-white/82 shadow-[0_0_5px_rgba(255,255,255,0.88),0_1px_3px_rgba(39,84,103,0.24)]" />
      <span className="relative block size-[28px] overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.74)]">
        <img
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          src={kernelOnStatusAvatar}
        />
      </span>
    </button>
  );
}

const statusBarShellStyle = {
  height: 38,
} as CSSProperties;

const statusBrandLogoStyle = {
  filter:
    'drop-shadow(0 0 2px rgba(255,255,255,0.68)) drop-shadow(0 2px 3px rgba(45,92,111,0.24))',
} as CSSProperties;

const statusBrandTextStyle = {
  letterSpacing: 0,
  textShadow: '0 0 5px rgba(255,255,255,0.52), 0 1px 3px rgba(45,92,111,0.26)',
} as CSSProperties;

const statusGlyphStyle = {
  filter:
    'drop-shadow(0 0 2px rgba(255,255,255,0.74)) drop-shadow(0 2px 2px rgba(45,92,111,0.24))',
} as CSSProperties;
