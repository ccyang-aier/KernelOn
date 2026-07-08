'use client';

import { AppHeaderSlot } from '@kernelon/shell';
import { ArrowLeft, KeyRound, Search, Settings, Share2 } from 'lucide-react';

import { viewLabels } from '../data';
import type { WallpaperView } from '../types';

type WallpaperHeaderView = WallpaperView | 'preview';

export function WallpaperFrostedHeaderControls({
  activeView,
  onBack,
  onFocusSearch,
  onLicense,
  onSettings,
  onShare,
  onViewChange,
}: Readonly<{
  activeView: WallpaperHeaderView;
  onBack(): void;
  onFocusSearch(): void;
  onLicense(): void;
  onSettings(): void;
  onShare(): void;
  onViewChange(view: WallpaperView): void;
}>) {
  const segmentView = activeView === 'preview' ? null : activeView;

  return (
    <>
      {activeView === 'preview' ? (
        <AppHeaderSlot id="wallpaper-back-control">
          <button
            aria-label="Back"
            className="wallpaper-frosted-button wallpaper-frosted-button--icon"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
        </AppHeaderSlot>
      ) : null}

      <AppHeaderSlot id="wallpaper-search-control">
        <button
          aria-label="Search"
          className="wallpaper-frosted-button wallpaper-frosted-button--icon"
          onClick={onFocusSearch}
          type="button"
        >
          <Search aria-hidden="true" />
        </button>
      </AppHeaderSlot>

      {segmentView ? (
        <AppHeaderSlot id="wallpaper-view-control">
          <div
            aria-label="Wallpaper views"
            className="wallpaper-frosted-segment"
            role="group"
          >
            {wallpaperViewOptions.map((option) => {
              const selected = option.value === segmentView;

              return (
                <button
                  aria-current={selected ? 'page' : undefined}
                  aria-pressed={selected}
                  className="wallpaper-frosted-segment__button"
                  key={option.value}
                  onClick={() => onViewChange(option.value)}
                  type="button"
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </AppHeaderSlot>
      ) : null}

      <AppHeaderSlot id="wallpaper-license-control">
        <button
          aria-label="License"
          className="wallpaper-frosted-button wallpaper-frosted-button--icon"
          onClick={onLicense}
          type="button"
        >
          <KeyRound aria-hidden="true" />
        </button>
      </AppHeaderSlot>

      <AppHeaderSlot id="wallpaper-share-control">
        <button
          aria-label="Share"
          className="wallpaper-frosted-button wallpaper-frosted-button--icon"
          onClick={onShare}
          type="button"
        >
          <Share2 aria-hidden="true" />
        </button>
      </AppHeaderSlot>

      {activeView === 'preview' ? (
        <AppHeaderSlot id="wallpaper-settings-control">
          <button
            aria-label="Settings"
            className="wallpaper-frosted-button wallpaper-frosted-button--icon"
            onClick={onSettings}
            type="button"
          >
            <Settings aria-hidden="true" />
          </button>
        </AppHeaderSlot>
      ) : null}
    </>
  );
}

const wallpaperViewOptions: Array<{ label: string; value: WallpaperView }> = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];
