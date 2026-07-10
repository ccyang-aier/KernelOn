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
    <section aria-label="壁纸设置" className="wallpaper-page wallpaper-page--settings">
      <div className="wallpaper-settings-heading">
        <p>个性化</p>
        <h1>打造你的专属空间。</h1>
        <span>微调壁纸在桌面上的动态、适配方式与视觉质感。</span>
      </div>

      <div className="wallpaper-settings-layout">
        <div className="wallpaper-settings-card">
          <div className="wallpaper-settings-card__heading">
            <div>
              <span>浏览体验</span>
              <strong>即时生效</strong>
            </div>
            <span className="wallpaper-settings-card__status">4 项偏好</span>
          </div>

          <SettingsRow
            active={isHeroAutoplayEnabled}
            description="主页打开时自动轮换精选壁纸。"
            icon={
              isHeroAutoplayEnabled ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />
            }
            label="自动轮换精选壁纸"
            onClick={onToggleHeroAutoplay}
            state={isHeroAutoplayEnabled ? '开启' : '关闭'}
          />
          <SettingsRow
            active={isHeroDetailsVisible}
            description="在主视觉区域显示分辨率、作者、文件大小和时长。"
            icon={isHeroDetailsVisible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
            label="壁纸详情"
            onClick={onToggleHeroDetails}
            state={isHeroDetailsVisible ? '可见' : '隐藏'}
          />
          <SettingsRow
            active={previewFitMode === 'fill'}
            description="选择铺满窗口，或保留完整作品。"
            icon={<Frame aria-hidden="true" />}
            label="预览画面"
            onClick={onTogglePreviewFit}
            state={previewFitMode === 'fill' ? '铺满' : '适配'}
          />
          <SettingsRow
            active={glassDepth === 'deep'}
            description="控制主页以外磨砂界面的对比度。"
            icon={<Sparkles aria-hidden="true" />}
            label="界面玻璃"
            onClick={onToggleGlassDepth}
            state={glassDepth === 'deep' ? '深色' : '柔和'}
          />
        </div>

        <aside className="wallpaper-settings-current" aria-label="当前壁纸">
          <div className="wallpaper-settings-current__media">
            <img alt="" draggable={false} src={selectedWallpaper.image} />
            <div className="wallpaper-settings-current__shade" />
            <span className="wallpaper-settings-current__badge">当前壁纸</span>
          </div>
          <div className="wallpaper-settings-current__content">
            <span>{selectedWallpaper.category}</span>
            <h2>{selectedWallpaper.title}</h2>
            <p>
              {selectedWallpaper.resolution} · {selectedWallpaper.author}
            </p>
            <div className="wallpaper-settings-current__chips" aria-label="当前偏好">
              <span>{previewFitMode === 'fill' ? '铺满画面' : '完整作品'}</span>
              <span>{glassDepth === 'deep' ? '深色磨砂' : '柔和磨砂'}</span>
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
