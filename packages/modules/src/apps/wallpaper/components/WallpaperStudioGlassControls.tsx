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
  backgroundScrollRef?: RefObject<HTMLElement | null>;
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
  backgroundScrollRef,
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
      backgroundScrollRef={backgroundScrollRef}
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
  backgroundScrollRef,
  onChange,
  value,
}: Readonly<{
  backgroundHostRef: RefObject<HTMLElement | null>;
  backgroundImage: string;
  backgroundScrollRef?: RefObject<HTMLElement | null>;
  onChange(view: WallpaperView): void;
  value: WallpaperView;
}>) {
  return (
    <LiquidGlassStudioSurface
      backgroundHostRef={backgroundHostRef}
      backgroundImage={backgroundImage}
      backgroundScrollRef={backgroundScrollRef}
      className="wallpaper-studio-glass-segment-surface"
      height={42}
      interactive
      radius={999}
      tone="header"
      width={WALLPAPER_SEGMENT_WIDTH}
    >
      <div
        aria-label="Wallpaper views"
        className="wallpaper-studio-glass-segment"
        role="group"
      >
        {wallpaperViewOptions.map((option) => (
          <button
            aria-current={option.value === value ? 'page' : undefined}
            aria-pressed={option.value === value}
            className="wallpaper-studio-glass-button wallpaper-studio-glass-segment-button"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </LiquidGlassStudioSurface>
  );
}

const WALLPAPER_SEGMENT_WIDTH = 304;

const wallpaperViewOptions: Array<{ label: string; value: WallpaperView }> = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];

export function WallpaperHeaderGlassSlots({
  activeView,
  backgroundHostRef,
  backgroundImage,
  backgroundScrollRef,
  onFocusSearch,
  onLicense,
  onSettings,
  onShare,
  onViewChange,
}: Readonly<{
  activeView: WallpaperHeaderView;
  backgroundHostRef: RefObject<HTMLElement | null>;
  backgroundImage: string;
  backgroundScrollRef?: RefObject<HTMLElement | null>;
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
        backgroundScrollRef={backgroundScrollRef}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onFocusSearch}
        tone="header"
        width={42}
      >
        <Search aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, backgroundScrollRef, onFocusSearch],
  );
  const segmentControl = useMemo(
    () =>
      segmentView ? (
        <WallpaperStudioGlassSegment
          backgroundHostRef={backgroundHostRef}
          backgroundImage={backgroundImage}
          backgroundScrollRef={backgroundScrollRef}
          onChange={onViewChange}
          value={segmentView}
        />
      ) : null,
    [backgroundHostRef, backgroundImage, backgroundScrollRef, onViewChange, segmentView],
  );
  const licenseControl = useMemo(
    () => (
      <WallpaperStudioGlassButton
        ariaLabel="License"
        backgroundHostRef={backgroundHostRef}
        backgroundImage={backgroundImage}
        backgroundScrollRef={backgroundScrollRef}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onLicense}
        tone="header"
        width={42}
      >
        <KeyRound aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, backgroundScrollRef, onLicense],
  );
  const shareControl = useMemo(
    () => (
      <WallpaperStudioGlassButton
        ariaLabel="Share"
        backgroundHostRef={backgroundHostRef}
        backgroundImage={backgroundImage}
        backgroundScrollRef={backgroundScrollRef}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onShare}
        tone="header"
        width={42}
      >
        <Share2 aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, backgroundScrollRef, onShare],
  );
  const settingsControl = useMemo(
    () => (
      <WallpaperStudioGlassButton
        ariaLabel="Settings"
        backgroundHostRef={backgroundHostRef}
        backgroundImage={backgroundImage}
        backgroundScrollRef={backgroundScrollRef}
        className="wallpaper-studio-glass-icon-surface"
        onClick={onSettings}
        tone="header"
        width={42}
      >
        <Settings aria-hidden="true" />
      </WallpaperStudioGlassButton>
    ),
    [backgroundHostRef, backgroundImage, backgroundScrollRef, onSettings],
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
