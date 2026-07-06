'use client';

import { MonitorPlay, Pause, Play, Sparkles, WandSparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export function SettingsView({
  glassDepth,
  isHeroAutoplayEnabled,
  onToggleGlassDepth,
  onToggleHeroAutoplay,
  onTogglePreviewFit,
  previewFitMode,
  selectedWallpaperTitle,
}: Readonly<{
  glassDepth: 'deep' | 'soft';
  isHeroAutoplayEnabled: boolean;
  onToggleGlassDepth(): void;
  onToggleHeroAutoplay(): void;
  onTogglePreviewFit(): void;
  previewFitMode: 'fill' | 'fit';
  selectedWallpaperTitle: string;
}>) {
  return (
    <section aria-label="Wallpaper Settings" className="wallpaper-page wallpaper-page--settings">
      <div className="wallpaper-settings-heading">
        <p>Wallpaper Settings</p>
        <h1>Settings</h1>
      </div>

      <div className="wallpaper-settings-grid">
        <SettingsTile
          icon={<MonitorPlay aria-hidden="true" />}
          label="Preview Fit"
          onClick={onTogglePreviewFit}
          state={previewFitMode === 'fill' ? 'Fill' : 'Fit'}
          tone="cyan"
        />
        <SettingsTile
          icon={isHeroAutoplayEnabled ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          label="Hero Motion"
          onClick={onToggleHeroAutoplay}
          state={isHeroAutoplayEnabled ? 'Auto' : 'Still'}
          tone="green"
        />
        <SettingsTile
          icon={<Sparkles aria-hidden="true" />}
          label="Glass Depth"
          onClick={onToggleGlassDepth}
          state={glassDepth === 'deep' ? 'Deep' : 'Soft'}
          tone="amber"
        />
      </div>

      <div className="wallpaper-settings-panel">
        <div>
          <WandSparkles aria-hidden="true" />
          <span>Current Selection</span>
        </div>
        <strong>{selectedWallpaperTitle}</strong>
      </div>
    </section>
  );
}

function SettingsTile({
  icon,
  label,
  onClick,
  state,
  tone,
}: Readonly<{
  icon: ReactNode;
  label: string;
  onClick(): void;
  state: string;
  tone: 'amber' | 'cyan' | 'green';
}>) {
  return (
    <button
      className="wallpaper-settings-tile"
      data-wallpaper-settings-tone={tone}
      onClick={onClick}
      type="button"
    >
      <span className="wallpaper-settings-tile__icon">{icon}</span>
      <span>{label}</span>
      <strong>{state}</strong>
    </button>
  );
}
