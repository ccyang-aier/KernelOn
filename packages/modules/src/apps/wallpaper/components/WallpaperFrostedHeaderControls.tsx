'use client';

import { AppHeaderSlot } from '@kernelon/shell';
import { Glass, type GlassOptics } from '@kernelon/ui/liquid-glass';
import { ArrowLeft, KeyRound, Search, Settings, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { viewLabels } from '../data';
import type { WallpaperView } from '../types';

type WallpaperHeaderView = WallpaperView | 'preview';

export function WallpaperFrostedHeaderControls({
  activeView,
  isSearchOpen,
  onBack,
  onSearchChange,
  onSearchOpenChange,
  onSettings,
  onViewChange,
  searchQuery,
}: Readonly<{
  activeView: WallpaperHeaderView;
  isSearchOpen: boolean;
  onBack(): void;
  onSearchChange(query: string): void;
  onSearchOpenChange(isOpen: boolean): void;
  onSettings(): void;
  onViewChange(view: WallpaperView): void;
  searchQuery: string;
}>) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const segmentView = activeView === 'preview' ? null : activeView;

  const handleViewChange = useCallback(
    (view: WallpaperView) => {
      onSearchOpenChange(false);
      onViewChange(view);
    },
    [onSearchOpenChange, onViewChange],
  );

  useEffect(() => {
    if (!isSearchOpen) {
      return undefined;
    }

    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 120);

    return () => window.clearTimeout(timer);
  }, [isSearchOpen]);

  const backControl = useMemo(
    () => (
      <button
        aria-label="Back"
        className="wallpaper-frosted-button wallpaper-frosted-button--icon"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft aria-hidden="true" />
      </button>
    ),
    [onBack],
  );

  const searchControl = useMemo(
    () => (
      <div
        className="wallpaper-frosted-search"
        data-wallpaper-search-open={isSearchOpen ? 'true' : 'false'}
      >
        <button
          aria-label={isSearchOpen ? 'Focus search' : 'Search'}
          className="wallpaper-frosted-search__button"
          onClick={() => {
            onSearchOpenChange(true);
            window.setTimeout(() => searchInputRef.current?.focus(), 90);
          }}
          type="button"
        >
          <Search aria-hidden="true" />
        </button>
        <input
          aria-label="Search wallpapers"
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          onFocus={() => onSearchOpenChange(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onSearchOpenChange(false);
            }
          }}
          placeholder="Search wallpapers"
          ref={searchInputRef}
          tabIndex={isSearchOpen ? 0 : -1}
          type="search"
          value={searchQuery}
        />
      </div>
    ),
    [isSearchOpen, onSearchChange, onSearchOpenChange, searchQuery],
  );

  const navigationControl = useMemo(() => {
    if (!segmentView) {
      return null;
    }

    return (
      <div
        className="wallpaper-frosted-navigation"
        data-wallpaper-search-open={isSearchOpen ? 'true' : 'false'}
      >
        <button
          aria-hidden={isSearchOpen ? undefined : true}
          aria-label="Show wallpaper navigation"
          className="wallpaper-frosted-menu-button"
          onClick={() => onSearchOpenChange(false)}
          tabIndex={isSearchOpen ? 0 : -1}
          type="button"
        >
          <span>{viewLabels[segmentView]}</span>
        </button>
        <div
          aria-hidden={isSearchOpen ? true : undefined}
          className="wallpaper-frosted-header-center"
        >
          <div
            aria-label="Wallpaper views"
            className="wallpaper-frosted-segment"
            data-wallpaper-view={segmentView}
            role="group"
          >
            <span aria-hidden="true" className="wallpaper-frosted-segment__indicator" />
            {wallpaperViewOptions.map((option) => {
              const selected = option.value === segmentView;

              return (
                <button
                  aria-current={selected ? 'page' : undefined}
                  aria-pressed={selected}
                  className="wallpaper-frosted-segment__button"
                  key={option.value}
                  onClick={() => handleViewChange(option.value)}
                  tabIndex={isSearchOpen ? -1 : 0}
                  type="button"
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [handleViewChange, isSearchOpen, onSearchOpenChange, segmentView]);

  const primaryControl = useMemo(() => {
    if (!navigationControl) {
      return null;
    }

    return (
      <div
        className="wallpaper-frosted-primary"
        data-wallpaper-search-open={isSearchOpen ? 'true' : 'false'}
      >
        {searchControl}
        {navigationControl}
      </div>
    );
  }, [isSearchOpen, navigationControl, searchControl]);

  const licenseControl = useMemo(
    () => (
      <WallpaperHeaderLiquidGlassButton label="License">
        <KeyRound aria-hidden="true" />
      </WallpaperHeaderLiquidGlassButton>
    ),
    [],
  );

  const shareControl = useMemo(
    () => (
      <WallpaperHeaderLiquidGlassButton label="Share">
        <Share2 aria-hidden="true" />
      </WallpaperHeaderLiquidGlassButton>
    ),
    [],
  );

  const settingsControl = useMemo(
    () => (
      <button
        aria-label="Settings"
        className="wallpaper-frosted-button wallpaper-frosted-button--icon"
        onClick={onSettings}
        type="button"
      >
        <Settings aria-hidden="true" />
      </button>
    ),
    [onSettings],
  );

  return (
    <>
      {activeView === 'preview' ? (
        <AppHeaderSlot id="wallpaper-back-control">{backControl}</AppHeaderSlot>
      ) : null}

      {activeView === 'preview' ? (
        <AppHeaderSlot id="wallpaper-search-control">{searchControl}</AppHeaderSlot>
      ) : null}

      {primaryControl ? (
        <AppHeaderSlot id="wallpaper-primary-control">{primaryControl}</AppHeaderSlot>
      ) : null}

      <AppHeaderSlot id="wallpaper-license-control">{licenseControl}</AppHeaderSlot>

      <AppHeaderSlot id="wallpaper-share-control">{shareControl}</AppHeaderSlot>

      {activeView === 'preview' ? (
        <AppHeaderSlot id="wallpaper-settings-control">{settingsControl}</AppHeaderSlot>
      ) : null}
    </>
  );
}

const wallpaperViewOptions: Array<{ label: string; value: WallpaperView }> = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];

const wallpaperHeaderIconGlassOptics: Partial<GlassOptics> = {
  mapSize: 256,
  depth: 0.64,
  curvature: 0.34,
  strength: 0.18,
  dispersion: 0.18,
  bend: 0.58,
  bendWidth: 0.08,
  frost: 3.2,
  brightness: 0.34,
  specular: 1,
  sheen: 0.5,
  sheenAngle: 48,
  sheenWidth: 2,
  glow: 0.12,
  glowSpread: 1,
  glowFalloff: 0.7,
};

function WallpaperHeaderLiquidGlassButton({
  children,
  label,
}: Readonly<{
  children: ReactNode;
  label: string;
}>) {
  return (
    <button
      aria-label={label}
      className="wallpaper-frosted-button wallpaper-frosted-button--icon wallpaper-frosted-button--liquid-glass"
      type="button"
    >
      <Glass
        aria-hidden="true"
        className="wallpaper-frosted-button__liquid-glass"
        height={42}
        optics={wallpaperHeaderIconGlassOptics}
        radius={21}
        width={42}
      >
        <span className="wallpaper-frosted-button__liquid-icon">{children}</span>
      </Glass>
    </button>
  );
}
