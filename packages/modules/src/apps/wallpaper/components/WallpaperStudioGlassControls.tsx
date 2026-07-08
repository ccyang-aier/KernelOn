'use client';

import { AppHeaderSlot } from '@kernelon/shell';
import { LiquidGlassStudioSurface } from '@kernelon/ui/liquid-glass-studio-surface';
import { KeyRound, Search, Settings, Share2 } from 'lucide-react';
import { useMemo, type ReactNode, type RefObject } from 'react';

import { viewLabels } from '../data';
import type { WallpaperView } from '../types';

type WallpaperHeaderView = WallpaperView | 'preview';

interface WallpaperStudioGlassButtonProps {
  backgroundHostRef: RefObject<HTMLElement | null>;
  backgroundImage: string;
  children: ReactNode;
  height?: number;
  radius?: number;
  tone?: 'hero' | 'header' | 'subtle';
  width: number;
  ariaCurrent?: 'page';
  ariaLabel?: string;
  ariaPressed?: boolean;
  className?: string;
  onClick(): void;
}

export function WallpaperStudioGlassButton({
  ariaCurrent,
  ariaLabel,
  ariaPressed,
  backgroundHostRef,
  backgroundImage,
  children,
  className = '',
  height = 42,
  onClick,
  radius = 999,
  tone = 'hero',
  width,
}: WallpaperStudioGlassButtonProps) {
  return (
    <LiquidGlassStudioSurface
      backgroundHostRef={backgroundHostRef}
      backgroundImage={backgroundImage}
      className={className}
      height={height}
      interactive
      radius={radius}
      tone={tone}
      width={width}
    >
      <button
        aria-current={ariaCurrent}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        className="wallpaper-studio-glass-button"
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
    </LiquidGlassStudioSurface>
  );
}

export function WallpaperStudioGlassSegment({
  backgroundHostRef,
  backgroundImage,
  onChange,
  value,
}: Readonly<{
  backgroundHostRef: RefObject<HTMLElement | null>;
  backgroundImage: string;
  onChange(view: WallpaperView): void;
  value: WallpaperView;
}>) {
  return (
    <div
      aria-label="Wallpaper views"
      className="wallpaper-studio-glass-segment"
      role="group"
    >
      {wallpaperViewOptions.map((option) => (
        <WallpaperStudioGlassButton
          ariaCurrent={option.value === value ? 'page' : undefined}
          ariaPressed={option.value === value}
          backgroundHostRef={backgroundHostRef}
          backgroundImage={backgroundImage}
          className="wallpaper-studio-glass-segment-button-surface"
          height={42}
          key={option.value}
          onClick={() => onChange(option.value)}
          tone="header"
          width={WALLPAPER_SEGMENT_BUTTON_WIDTH}
        >
          <span>{option.label}</span>
        </WallpaperStudioGlassButton>
      ))}
    </div>
  );
}

export function WallpaperHeaderGlassSlots({
  activeView,
  backgroundHostRef,
  backgroundImage,
  onFocusSearch,
  onLicense,
  onSettings,
  onShare,
  onViewChange,
}: Readonly<{
  activeView: WallpaperHeaderView;
  backgroundHostRef: RefObject<HTMLElement | null>;
  backgroundImage: string;
  onFocusSearch(): void;
  onLicense(): void;
  onSettings(): void;
  onShare(): void;
  onViewChange(view: WallpaperView): void;
}>) {
  const segmentView = activeView === 'preview' ? null : activeView;
  const searchControl = useMemo(
    () => (
      <WallpaperStudioGlassButton
        ariaLabel="Search"
        backgroundHostRef={backgroundHostRef}
        backgroundImage={backgroundImage}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onFocusSearch}
        tone="header"
        width={42}
      >
        <Search aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, onFocusSearch],
  );
  const segmentControl = useMemo(
    () =>
      segmentView ? (
        <WallpaperStudioGlassSegment
          backgroundHostRef={backgroundHostRef}
          backgroundImage={backgroundImage}
          onChange={onViewChange}
          value={segmentView}
        />
      ) : null,
    [backgroundHostRef, backgroundImage, onViewChange, segmentView],
  );
  const licenseControl = useMemo(
    () => (
      <WallpaperStudioGlassButton
        ariaLabel="License"
        backgroundHostRef={backgroundHostRef}
        backgroundImage={backgroundImage}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onLicense}
        tone="header"
        width={42}
      >
        <KeyRound aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, onLicense],
  );
  const shareControl = useMemo(
    () => (
      <WallpaperStudioGlassButton
        ariaLabel="Share"
        backgroundHostRef={backgroundHostRef}
        backgroundImage={backgroundImage}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onShare}
        tone="header"
        width={42}
      >
        <Share2 aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, onShare],
  );
  const settingsControl = useMemo(
    () => (
      <WallpaperStudioGlassButton
        ariaLabel="Settings"
        backgroundHostRef={backgroundHostRef}
        backgroundImage={backgroundImage}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onSettings}
        tone="header"
        width={42}
      >
        <Settings aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, onSettings],
  );

  return (
    <>
      <AppHeaderSlot id="wallpaper-search-control">{searchControl}</AppHeaderSlot>

      {segmentView ? (
        <AppHeaderSlot id="wallpaper-view-control">{segmentControl}</AppHeaderSlot>
      ) : null}

      <AppHeaderSlot id="wallpaper-license-control">{licenseControl}</AppHeaderSlot>

      <AppHeaderSlot id="wallpaper-share-control">{shareControl}</AppHeaderSlot>

      {activeView === 'preview' ? (
        <AppHeaderSlot id="wallpaper-settings-control">{settingsControl}</AppHeaderSlot>
      ) : null}
    </>
  );
}

const WALLPAPER_SEGMENT_BUTTON_WIDTH = 96;

const wallpaperViewOptions: Array<{ label: string; value: WallpaperView }> = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];
