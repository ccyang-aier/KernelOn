'use client';

import { ArrowLeft, KeyRound, Search, Settings, Share2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { viewLabels } from '../data';
import type { WallpaperView } from '../types';
import {
  WallpaperHeaderSamasanteGlassButton,
  WallpaperHeaderYbouaneGlassButton,
} from './WallpaperHeaderGlassButtons';

type WallpaperHeaderView = WallpaperView | 'preview';

export function WallpaperFrostedHeaderControls({
  activeView,
  children,
  glassBackdropImage,
  isSearchOpen,
  onBack,
  onSearchChange,
  onSearchOpenChange,
  onSettings,
  onViewChange,
  searchQuery,
}: Readonly<{
  activeView: WallpaperHeaderView;
  children(slots: Readonly<Record<string, ReactNode>>): ReactNode;
  glassBackdropImage: string;
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
      <WallpaperHeaderSamasanteGlassButton backdropImage={glassBackdropImage} label="License">
        <KeyRound aria-hidden="true" />
      </WallpaperHeaderSamasanteGlassButton>
    ),
    [glassBackdropImage],
  );

  const shareControl = useMemo(
    () => (
      <WallpaperHeaderYbouaneGlassButton backdropImage={glassBackdropImage} label="Share">
        <Share2 aria-hidden="true" />
      </WallpaperHeaderYbouaneGlassButton>
    ),
    [glassBackdropImage],
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

  const slots = useMemo(
    () => ({
      'wallpaper-back-control': activeView === 'preview' ? backControl : null,
      'wallpaper-license-control': licenseControl,
      'wallpaper-primary-control': primaryControl,
      'wallpaper-search-control': activeView === 'preview' ? searchControl : null,
      'wallpaper-settings-control': activeView === 'preview' ? settingsControl : null,
      'wallpaper-share-control': shareControl,
    }),
    [
      activeView,
      backControl,
      licenseControl,
      primaryControl,
      searchControl,
      settingsControl,
      shareControl,
    ],
  );

  return children(slots);
}

const wallpaperViewOptions: Array<{ label: string; value: WallpaperView }> = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];
