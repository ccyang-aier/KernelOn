'use client';

import { Eye, EyeOff, Frame, Pause, Play, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

import type { WallpaperAsset } from '../types';

export function SettingsView({
  glassDepth,
  isHeroAutoplayEnabled,
  isHeroDetailsVisible,
  onToggleGlassDepth,
  onToggleHeroAutoplay,
  onToggleHeroDetails,
  onTogglePreviewFit,
  previewFitMode,
  selectedWallpaper,
}: Readonly<{
  glassDepth: 'deep' | 'soft';
  isHeroAutoplayEnabled: boolean;
  isHeroDetailsVisible: boolean;
  onToggleGlassDepth(): void;
  onToggleHeroAutoplay(): void;
  onToggleHeroDetails(): void;
  onTogglePreviewFit(): void;
  previewFitMode: 'fill' | 'fit';
  selectedWallpaper: WallpaperAsset;
}>) {
  return (
    <section aria-label="Wallpaper Settings" className="wallpaper-page wallpaper-page--settings">
      <div className="wallpaper-settings-heading">
        <p>Personalization</p>
        <h1>Your space, your pace.</h1>
        <span>Fine-tune how wallpapers move, fit and feel across your desktop.</span>
      </div>

      <div className="wallpaper-settings-layout">
        <div className="wallpaper-settings-card">
          <div className="wallpaper-settings-card__heading">
            <div>
              <span>Viewing experience</span>
              <strong>Applies instantly</strong>
            </div>
            <span className="wallpaper-settings-card__status">4 preferences</span>
          </div>

          <SettingsRow
            active={isHeroAutoplayEnabled}
            description="Rotate featured wallpapers automatically while Home is open."
            icon={
              isHeroAutoplayEnabled ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />
            }
            label="Auto-rotate featured wallpapers"
            onClick={onToggleHeroAutoplay}
            state={isHeroAutoplayEnabled ? 'On' : 'Off'}
          />
          <SettingsRow
            active={isHeroDetailsVisible}
            description="Show resolution, creator, file size and duration in the Hero."
            icon={isHeroDetailsVisible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
            label="Wallpaper details"
            onClick={onToggleHeroDetails}
            state={isHeroDetailsVisible ? 'Visible' : 'Hidden'}
          />
          <SettingsRow
            active={previewFitMode === 'fill'}
            description="Choose edge-to-edge framing or preserve the full artwork."
            icon={<Frame aria-hidden="true" />}
            label="Preview framing"
            onClick={onTogglePreviewFit}
            state={previewFitMode === 'fill' ? 'Fill' : 'Fit'}
          />
          <SettingsRow
            active={glassDepth === 'deep'}
            description="Control the contrast of frosted surfaces outside the Home view."
            icon={<Sparkles aria-hidden="true" />}
            label="Interface glass"
            onClick={onToggleGlassDepth}
            state={glassDepth === 'deep' ? 'Deep' : 'Soft'}
          />
        </div>

        <aside className="wallpaper-settings-current" aria-label="Current wallpaper">
          <div className="wallpaper-settings-current__media">
            <img alt="" draggable={false} src={selectedWallpaper.image} />
            <div className="wallpaper-settings-current__shade" />
            <span className="wallpaper-settings-current__badge">Current wallpaper</span>
          </div>
          <div className="wallpaper-settings-current__content">
            <span>{selectedWallpaper.category}</span>
            <h2>{selectedWallpaper.title}</h2>
            <p>
              {selectedWallpaper.resolution} · by {selectedWallpaper.author}
            </p>
            <div className="wallpaper-settings-current__chips" aria-label="Current preferences">
              <span>{previewFitMode === 'fill' ? 'Fill frame' : 'Fit artwork'}</span>
              <span>{glassDepth === 'deep' ? 'Deep glass' : 'Soft glass'}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SettingsRow({
  active,
  description,
  icon,
  label,
  onClick,
  state,
}: Readonly<{
  active: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onClick(): void;
  state: string;
}>) {
  return (
    <button
      aria-pressed={active}
      className="wallpaper-settings-row"
      onClick={onClick}
      type="button"
    >
      <span className="wallpaper-settings-row__icon">{icon}</span>
      <span className="wallpaper-settings-row__copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className="wallpaper-settings-row__state">{state}</span>
    </button>
  );
}
