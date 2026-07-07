'use client';

import { AppHeaderSlot } from '@kernelon/shell';
import { LiquidGlassStudioSurface } from '@kernelon/ui/liquid-glass-studio-surface';
import { KeyRound, Search, Settings, Share2 } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';

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
  ariaLabel?: string;
  ariaPressed?: boolean;
  className?: string;
  onClick(): void;
}

export function WallpaperStudioGlassButton({
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
  const selectedIndex = Math.max(
    0,
    wallpaperViewOptions.findIndex((option) => option.value === value),
  );

  return (
    <LiquidGlassStudioSurface
      backgroundHostRef={backgroundHostRef}
      backgroundImage={backgroundImage}
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
        <span
          aria-hidden="true"
          className="wallpaper-studio-glass-segment__indicator"
          style={{
            transform: `translate3d(${selectedIndex * WALLPAPER_SEGMENT_BUTTON_WIDTH}px, 0, 0)`,
          }}
        />
        {wallpaperViewOptions.map((option) => (
          <button
            aria-current={option.value === value ? 'page' : undefined}
            aria-pressed={option.value === value}
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

  return (
    <>
      <AppHeaderSlot id="wallpaper-search-control">
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
      </AppHeaderSlot>

      {segmentView ? (
        <AppHeaderSlot id="wallpaper-view-control">
          <WallpaperStudioGlassSegment
            backgroundHostRef={backgroundHostRef}
            backgroundImage={backgroundImage}
            onChange={onViewChange}
            value={segmentView}
          />
        </AppHeaderSlot>
      ) : null}

      <AppHeaderSlot id="wallpaper-license-control">
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
      </AppHeaderSlot>

      <AppHeaderSlot id="wallpaper-share-control">
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
      </AppHeaderSlot>

      {activeView === 'preview' ? (
        <AppHeaderSlot id="wallpaper-settings-control">
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
        </AppHeaderSlot>
      ) : null}
    </>
  );
}

const WALLPAPER_SEGMENT_BUTTON_WIDTH = 96;
const WALLPAPER_SEGMENT_WIDTH = WALLPAPER_SEGMENT_BUTTON_WIDTH * 3 + 8;

const wallpaperViewOptions: Array<{ label: string; value: WallpaperView }> = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];
