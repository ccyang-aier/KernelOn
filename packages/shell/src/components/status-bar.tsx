'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from 'react';

import { kernelOnBrandLogo } from '../visual-assets';
import type { ShellCredentialUser } from './shell-lock-screen';
import { SystemControlPanel } from './system-control-panel';

export interface KernelOnStatusBarProps {
  currentUser?: ShellCredentialUser;
  onCurrentUserChange(user: ShellCredentialUser): void;
  spotlightOpen: boolean;
  onToggleSpotlight(): void;
}

export function KernelOnStatusBar({
  currentUser,
  onCurrentUserChange,
  spotlightOpen,
  onToggleSpotlight,
}: KernelOnStatusBarProps) {
  const [controlCenterOpen, setControlCenterOpen] = useState(false);

  return (
    <>
      <header
        aria-label="KernelOn status bar"
        className="pointer-events-none fixed inset-x-0 top-0 z-30 w-full"
        data-testid="kernelon-status-bar"
        style={statusBarShellStyle}
      >
        <div
          className="pointer-events-auto flex h-[40px] w-full items-start justify-between border-b border-white/20 bg-white/[0.06] px-[14px] pt-[2px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl backdrop-saturate-150"
          data-kernelon-status-material="css-frosted"
          data-testid="kernelon-status-glass"
        >
          <span
            aria-label="KernelOn product identity"
            className="-ml-[4px] flex h-[38px] min-w-0 items-center justify-start gap-[4px]"
            data-testid="kernelon-status-brand"
          >
            <StatusBarFeedbackButton
              aria-label="KernelOn logo"
              className="flex h-[38px] w-[32px] items-center justify-center"
              data-testid="kernelon-status-brand-logo-button"
              label="KernelOn logo"
            >
              <img
                alt=""
                className="h-[30px] w-[30px] shrink-0 object-contain"
                data-testid="kernelon-status-brand-logo"
                draggable={false}
                src={kernelOnBrandLogo}
                style={statusBrandLogoStyle}
              />
            </StatusBarFeedbackButton>
            <StatusBarFeedbackButton
              aria-label="KernelOn wordmark"
              className="flex h-[38px] min-w-0 items-center justify-start px-[2px]"
              data-testid="kernelon-status-brand-wordmark-button"
              label="KernelOn wordmark"
            >
              <span
                className="truncate text-[14px] font-semibold leading-none text-white/96"
                data-testid="kernelon-status-brand-wordmark"
                style={statusBrandTextStyle}
              >
                KernelOn
              </span>
            </StatusBarFeedbackButton>
          </span>
          <span
            className="flex h-[38px] w-[500px] shrink-0 items-center justify-end gap-[17px] max-[720px]:w-auto max-[720px]:gap-[11px] max-[560px]:gap-[8px]"
            data-testid="kernelon-status-controls"
          >
            <StatusBarIconButton
              Icon={StatusThemeIcon}
              buttonClassName="w-[28px] max-[680px]:hidden"
              iconClassName="h-[24px] w-[24px]"
              label="Theme"
            />
            <StatusBarIconButton
              Icon={StatusVolumeIcon}
              buttonClassName="w-[27px] max-[680px]:hidden"
              iconClassName="h-[24px] w-[25px]"
              label="Volume"
            />
            <StatusBarIconButton
              Icon={StatusBluetoothIcon}
              buttonClassName="w-[27px] max-[680px]:hidden"
              iconClassName="h-[23px] w-[23px]"
              label="Bluetooth"
            />
            <StatusBarIconButton
              Icon={StatusWifiIcon}
              iconClassName="h-[25px] w-[25px]"
              label="Wi-Fi"
            />
            <StatusBarIconButton
              Icon={StatusBatteryIcon}
              buttonClassName="w-[34px]"
              iconClassName="h-[24px] w-[30px]"
              label="Battery"
            />
            <StatusBarIconButton
              Icon={StatusSearchIcon}
              iconClassName="h-[24px] w-[24px]"
              label="AI Spotlight"
              onClick={onToggleSpotlight}
              pressed={spotlightOpen}
            />
            <StatusBarIconButton
              Icon={StatusBellIcon}
              badge={
                <span
                  className="pointer-events-none absolute top-[3px] right-[-3px] size-[6.6px] rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.96),0_1px_2px_rgba(64,112,131,0.22)]"
                  data-testid="kernelon-notification-dot"
                />
              }
              buttonClassName="mr-[4px] w-[27px]"
              iconClassName="h-[23px] w-[23px]"
              label="Notifications"
            />
            <StatusBarIconButton
              Icon={StatusControlCenterIcon}
              iconClassName="h-[23px] w-[23px]"
              label="Control Center"
              onClick={() => setControlCenterOpen((open) => !open)}
              pressed={controlCenterOpen}
            />
            <StatusBarTime />
          </span>
        </div>
      </header>
      <SystemControlPanel
        onClose={() => setControlCenterOpen(false)}
        onUserChange={onCurrentUserChange}
        onOpenSpotlight={onToggleSpotlight}
        open={controlCenterOpen}
        user={currentUser}
      />
    </>
  );
}

type StatusIconProps = SVGProps<SVGSVGElement>;
type StatusBarIconComponent = ComponentType<StatusIconProps>;
type StatusBarGsap = (typeof import('gsap'))['gsap'];

interface StatusBarFeedbackTimeline {
  kill(): void;
}

interface StatusBarFeedbackTargets {
  root: HTMLElement;
  aura: HTMLElement;
  glyph: HTMLElement;
}

let statusBarGsapPromise: Promise<StatusBarGsap> | null = null;

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
    <StatusBarFeedbackButton
      badge={badge}
      className={`flex h-[30px] ${buttonClassName} items-center justify-center`}
      data-icon-variant={iconVariant}
      label={label}
      onClick={onClick}
      pressed={pressed}
    >
      <Icon
        aria-hidden="true"
        className={iconClassName}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.38}
        style={statusGlyphStyle}
      />
    </StatusBarFeedbackButton>
  );
}

interface StatusBarFeedbackButtonProps {
  children: ReactNode;
  label: string;
  badge?: ReactNode;
  className?: string;
  glyphClassName?: string;
  pressed?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  'data-icon-variant'?: string;
  'data-testid'?: string;
}

function StatusBarFeedbackButton({
  children,
  label,
  badge,
  className = '',
  glyphClassName = '',
  pressed,
  onClick,
  'aria-label': ariaLabel,
  'data-icon-variant': iconVariant,
  'data-testid': testId,
}: StatusBarFeedbackButtonProps) {
  const { auraRef, glyphRef, playFeedback, rootRef } = useStatusBarPressFeedback();

  const handleClick = useCallback(() => {
    playFeedback();
    onClick?.();
  }, [onClick, playFeedback]);

  return (
    <button
      ref={rootRef}
      aria-label={ariaLabel ?? label}
      aria-pressed={typeof pressed === 'boolean' ? pressed : undefined}
      className={`relative shrink-0 overflow-visible rounded-full border-0 bg-transparent text-white/95 outline-none transition-[box-shadow,color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/80 ${className}`}
      data-icon-variant={iconVariant}
      data-kernelon-status-feedback="gsap-press"
      data-testid={testId}
      onClick={handleClick}
      title={label}
      type="button"
    >
      <span
        ref={auraRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-5px] opacity-0"
        data-kernelon-status-feedback-aura="true"
        style={statusFeedbackAuraStyle}
      />
      <span
        ref={glyphRef}
        className={`relative z-10 flex items-center justify-center ${glyphClassName}`}
        data-kernelon-status-feedback-glyph="true"
      >
        {children}
      </span>
      {badge}
    </button>
  );
}

function useStatusBarPressFeedback() {
  const rootRef = useRef<HTMLButtonElement>(null);
  const auraRef = useRef<HTMLSpanElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<StatusBarFeedbackTimeline | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    void loadStatusBarGsap();

    return () => {
      disposedRef.current = true;
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, []);

  const playFeedback = useCallback(() => {
    const root = rootRef.current;
    const aura = auraRef.current;
    const glyph = glyphRef.current;

    if (!root || !aura || !glyph || disposedRef.current) {
      return;
    }

    timelineRef.current?.kill();
    timelineRef.current = null;

    void animateStatusBarPress({ root, aura, glyph })
      .then((timeline) => {
        if (disposedRef.current) {
          timeline.kill();
          return;
        }

        timelineRef.current = timeline;
      })
      .catch(() => undefined);
  }, []);

  return { auraRef, glyphRef, playFeedback, rootRef };
}

function animateStatusBarPress({
  root,
  aura,
  glyph,
}: StatusBarFeedbackTargets): Promise<StatusBarFeedbackTimeline> {
  return loadStatusBarGsap().then((gsap) => {
    const reducedMotion = prefersReducedMotion();
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        gsap.set([root, aura, glyph], {
          clearProps: 'opacity,visibility,transform,filter',
        });
      },
    });

    gsap.set([root, aura, glyph], {
      force3D: true,
      transformOrigin: '50% 50%',
    });

    if (reducedMotion) {
      timeline
        .fromTo(
          aura,
          { autoAlpha: 0, scale: 0.98 },
          { autoAlpha: 0.38, duration: 0.1, ease: 'sine.out', scale: 1 },
          0,
        )
        .to(aura, { autoAlpha: 0, duration: 0.2, ease: 'sine.out' }, 0.1);
    } else {
      timeline
        .addLabel('press', 0)
        .fromTo(
          aura,
          { autoAlpha: 0, scale: 0.42 },
          { autoAlpha: 0.72, duration: 0.12, ease: 'sine.out', scale: 1.05 },
          'press',
        )
        .to(aura, { autoAlpha: 0, duration: 0.34, ease: 'power2.out', scale: 1.62 }, 0.08)
        .to(root, { duration: 0.08, ease: 'power2.out', scale: 0.91, y: 0.75 }, 'press')
        .to(root, { duration: 0.14, ease: 'back.out(2.2)', scale: 1.07, y: -0.35 }, 0.08)
        .to(root, { duration: 0.28, ease: 'elastic.out(1.05, 0.58)', scale: 1, y: 0 }, 0.18)
        .fromTo(
          glyph,
          { scale: 0.84 },
          { duration: 0.18, ease: 'back.out(2.4)', scale: 1.1 },
          'press+=0.03',
        )
        .to(glyph, { duration: 0.22, ease: 'elastic.out(1, 0.62)', scale: 1 }, 0.18);
    }

    return {
      kill() {
        timeline.kill();
        gsap.set([root, aura, glyph], {
          clearProps: 'opacity,visibility,transform,filter',
        });
      },
    };
  });
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function loadStatusBarGsap(): Promise<StatusBarGsap> {
  statusBarGsapPromise ??= import('gsap').then((module) => module.gsap);

  return statusBarGsapPromise;
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
      <circle cx="10.35" cy="12.75" mask="url(#kernelon-status-theme-moon-mask)" r="8.65" />
    </svg>
  );
}

function StatusVolumeIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      viewBox="-0.6 0 25.2 24"
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
      <g transform="translate(0 1.25)">
        <path
          d="M4.15 8.1c4.45-3.02 11.25-3.02 15.7 0M7.35 12.95c2.67-1.78 6.63-1.78 9.3 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.65"
        />
        <rect fill="currentColor" height="2.85" rx="1.42" width="4.2" x="9.9" y="17.05" />
      </g>
    </svg>
  );
}

function StatusBatteryIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      viewBox="0 0 40 29"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="kernelon-status-battery-bolt-outline-gap">
          <rect fill="black" height="29" width="40" />
          <path
            d="M6.9 4.9h23.28c3.34 0 6.15 2.53 6.5 5.86h.48A2.84 2.84 0 0 1 40 13.62v1.76a2.84 2.84 0 0 1-2.84 2.86h-.48c-.35 3.36-3.16 5.94-6.5 5.94H6.9A6.9 6.9 0 0 1 0 17.28V11.8a6.9 6.9 0 0 1 6.9-6.9Z"
            fill="white"
          />
          <path
            d="M23.35 4.32 12.62 15.68h6.68l-3.02 9.05 12.88-13.1h-6.9l1.09-7.31Z"
            fill="none"
            stroke="black"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5.8"
          />
        </mask>
      </defs>
      <path
        d="M6.9 4.9h23.28c3.34 0 6.15 2.53 6.5 5.86h.48A2.84 2.84 0 0 1 40 13.62v1.76a2.84 2.84 0 0 1-2.84 2.86h-.48c-.35 3.36-3.16 5.94-6.5 5.94H6.9A6.9 6.9 0 0 1 0 17.28V11.8a6.9 6.9 0 0 1 6.9-6.9Z"
        fill="currentColor"
        mask="url(#kernelon-status-battery-bolt-outline-gap)"
      />
      <path
        d="M23.35 4.32 12.62 15.68h6.68l-3.02 9.05 12.88-13.1h-6.9l1.09-7.31Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StatusSearchIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M10.72 3.1a7.62 7.62 0 0 0 0 15.24 7.58 7.58 0 0 0 4.46-1.44l3.34 3.33a1.22 1.22 0 0 0 1.72-1.72l-3.33-3.34a7.58 7.58 0 0 0 1.43-4.45 7.62 7.62 0 0 0-7.62-7.62Zm0 2.35a5.27 5.27 0 1 0 0 10.54 5.27 5.27 0 0 0 0-10.54Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function StatusBellIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3.1a5.45 5.45 0 0 0-5.45 5.45v2.46c0 1.38-.48 2.68-1.36 3.73l-.93 1.11A1.25 1.25 0 0 0 5.22 17.9h13.56a1.25 1.25 0 0 0 .96-2.05l-.93-1.11a5.8 5.8 0 0 1-1.36-3.73V8.55A5.45 5.45 0 0 0 12 3.1Z" />
      <path d="M9.2 19.2a2.92 2.92 0 0 0 5.6 0H9.2Z" />
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
    const intervalId = window.setInterval(updateTime, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <StatusBarFeedbackButton
      className="flex h-[30px] min-w-[136px] items-center justify-end px-[4px] max-[460px]:hidden"
      data-testid="kernelon-status-time-button"
      glyphClassName="items-center justify-end"
      label={`System time ${timeLabel}`}
    >
      <time
        aria-hidden="true"
        className="text-right text-[15px] font-normal leading-none text-white/95"
        data-testid="kernelon-status-time"
        dateTime={date.toISOString()}
        style={statusTimeTextStyle}
        suppressHydrationWarning
      >
        {timeLabel}
      </time>
    </StatusBarFeedbackButton>
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
  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.68)) drop-shadow(0 2px 3px rgba(45,92,111,0.24))',
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
  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.74)) drop-shadow(0 2px 2px rgba(45,92,111,0.24))',
} as CSSProperties;

const statusFeedbackAuraStyle = {
  background: 'transparent',
  borderRadius: 999,
  boxShadow: 'none',
  mixBlendMode: 'screen',
  willChange: 'opacity, transform',
} as CSSProperties;
