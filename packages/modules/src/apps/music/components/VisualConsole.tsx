import {
  Camera,
  ChevronRight,
  Download,
  Gauge,
  ImagePlus,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { visualPresets } from '../data';
import type { VisualSettings } from '../types';

interface VisualConsoleProps {
  isOpen: boolean;
  onChange(next: VisualSettings): void;
  onChooseBackground(): void;
  onClearBackground(): void;
  onClose(): void;
  onExport(): void;
  onImport(): void;
  onReset(): void;
  onSaveArchive(): void;
  visual: VisualSettings;
}

export function VisualConsole({
  isOpen,
  onChange,
  onChooseBackground,
  onClearBackground,
  onClose,
  onExport,
  onImport,
  onReset,
  onSaveArchive,
  visual,
}: VisualConsoleProps) {
  const [tab, setTab] = useState<'visual' | 'lyrics' | 'shelf'>('visual');
  const set = <Key extends keyof VisualSettings>(key: Key, value: VisualSettings[Key]) =>
    onChange({ ...visual, [key]: value });

  return (
    <aside aria-label="视觉控制台" className="music-fx-console" data-open={isOpen}>
      <header>
        <div>
          <strong>视觉控制台</strong>
          <span>MINERADIO VISUALS · 实时调节</span>
        </div>
        <button aria-label="关闭视觉控制台" onClick={onClose} type="button">
          <X />
        </button>
      </header>
      <nav aria-label="视觉控制分类">
        <button
          className={tab === 'visual' ? 'active' : ''}
          onClick={() => setTab('visual')}
          type="button"
        >
          <Sparkles />
          视觉
        </button>
        <button
          className={tab === 'lyrics' ? 'active' : ''}
          onClick={() => setTab('lyrics')}
          type="button"
        >
          <Palette />
          歌词
        </button>
        <button
          className={tab === 'shelf' ? 'active' : ''}
          onClick={() => setTab('shelf')}
          type="button"
        >
          <Camera />
          歌单架
        </button>
      </nav>
      <div className="music-fx-scroll">
        {tab === 'visual' ? (
          <>
            <SectionLabel>视觉预设</SectionLabel>
            <div className="music-preset-grid">
              {visualPresets.map((preset) => (
                <button
                  className={visual.preset === preset.id ? 'active' : ''}
                  key={preset.id}
                  onClick={() => set('preset', preset.id)}
                  type="button"
                >
                  <Sparkles />
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
            <SectionLabel>用户存档</SectionLabel>
            <div className="music-fx-actions">
              <button onClick={onSaveArchive} type="button">
                <Save />
                保存当前
              </button>
              <button onClick={onExport} type="button">
                <Download />
                导出
              </button>
              <button onClick={onImport} type="button">
                <Upload />
                导入
              </button>
            </div>
            <SectionLabel>自定义颜色</SectionLabel>
            <ColorControl
              label="界面高亮"
              onChange={(value) => set('uiAccentColor', value)}
              value={visual.uiAccentColor}
            />
            <ColorControl
              label="视觉主色"
              onChange={(value) => set('visualTintColor', value)}
              value={visual.visualTintColor}
            />
            <ColorControl
              label="背景颜色"
              onChange={(value) => set('backgroundColor', value)}
              value={visual.backgroundColor}
            />
            <div className="music-fx-actions">
              <button onClick={onChooseBackground} type="button">
                <ImagePlus />
                选择背景
              </button>
              <button disabled={!visual.backgroundImage} onClick={onClearBackground} type="button">
                <Trash2 />
                清除背景
              </button>
            </div>
            <SectionLabel>主控</SectionLabel>
            <RangeControl
              label="视觉强度"
              max={1.6}
              min={0.2}
              onChange={(value) => set('intensity', value)}
              step={0.01}
              value={visual.intensity}
            />
            <RangeControl
              label="空间景深"
              max={1.8}
              min={0.2}
              onChange={(value) => set('depth', value)}
              step={0.01}
              value={visual.depth}
            />
            <RangeControl
              label="粒子大小"
              max={2.2}
              min={0.5}
              onChange={(value) => set('pointSize', value)}
              step={0.01}
              value={visual.pointSize}
            />
            <RangeControl
              label="流动速度"
              max={2.5}
              min={0.2}
              onChange={(value) => set('speed', value)}
              step={0.01}
              value={visual.speed}
            />
            <RangeControl
              label="扭曲"
              max={0.6}
              min={0}
              onChange={(value) => set('twist', value)}
              step={0.01}
              value={visual.twist}
            />
            <RangeControl
              label="散射"
              max={0.5}
              min={0}
              onChange={(value) => set('scatter', value)}
              step={0.01}
              value={visual.scatter}
            />
            <RangeControl
              label="玻璃色差"
              max={140}
              min={0}
              onChange={(value) => set('controlGlassChromaticOffset', value)}
              step={1}
              value={visual.controlGlassChromaticOffset}
            />
            <ToggleControl
              label="电影镜头"
              onChange={(value) => set('cinema', value)}
              value={visual.cinema}
            />
            <ToggleControl
              label="粒子辉光"
              onChange={(value) => set('bloom', value)}
              value={visual.bloom}
            />
          </>
        ) : null}
        {tab === 'lyrics' ? (
          <>
            <SectionLabel>歌词质感</SectionLabel>
            <ColorControl
              label="歌词颜色"
              onChange={(value) => set('lyricColor', value)}
              value={visual.lyricColor}
            />
            <ColorControl
              label="高亮颜色"
              onChange={(value) => set('lyricHighlightColor', value)}
              value={visual.lyricHighlightColor}
            />
            <ColorControl
              label="辉光颜色"
              onChange={(value) => set('lyricGlowColor', value)}
              value={visual.lyricGlowColor}
            />
            <RangeControl
              label="歌词大小"
              max={1.65}
              min={0.35}
              onChange={(value) => set('lyricScale', value)}
              step={0.01}
              value={visual.lyricScale}
            />
            <RangeControl
              label="字间距"
              max={0.18}
              min={-0.04}
              onChange={(value) => set('lyricLetterSpacing', value)}
              step={0.005}
              value={visual.lyricLetterSpacing}
            />
            <RangeControl
              label="行高"
              max={1.8}
              min={0.8}
              onChange={(value) => set('lyricLineHeight', value)}
              step={0.01}
              value={visual.lyricLineHeight}
            />
            <RangeControl
              label="字体重量"
              max={900}
              min={500}
              onChange={(value) => set('lyricWeight', value)}
              step={100}
              value={visual.lyricWeight}
            />
            <RangeControl
              label="歌词辉光"
              max={0.85}
              min={0}
              onChange={(value) => set('lyricGlowStrength', value)}
              step={0.01}
              value={visual.lyricGlowStrength}
            />
            <SectionLabel>位置与角度</SectionLabel>
            <RangeControl
              label="左右位置"
              max={360}
              min={-360}
              onChange={(value) => set('lyricOffsetX', value)}
              step={1}
              value={visual.lyricOffsetX}
            />
            <RangeControl
              label="上下位置"
              max={260}
              min={-260}
              onChange={(value) => set('lyricOffsetY', value)}
              step={1}
              value={visual.lyricOffsetY}
            />
            <RangeControl
              label="前后景深"
              max={320}
              min={-320}
              onChange={(value) => set('lyricOffsetZ', value)}
              step={1}
              value={visual.lyricOffsetZ}
            />
            <RangeControl
              label="上下角度"
              max={35}
              min={-35}
              onChange={(value) => set('lyricTiltX', value)}
              step={1}
              value={visual.lyricTiltX}
            />
            <RangeControl
              label="左右角度"
              max={35}
              min={-35}
              onChange={(value) => set('lyricTiltY', value)}
              step={1}
              value={visual.lyricTiltY}
            />
            <ToggleControl
              label="歌词辉光"
              onChange={(value) => set('lyricGlow', value)}
              value={visual.lyricGlow}
            />
            <ToggleControl
              label="粒子歌词"
              onChange={(value) => set('particleLyrics', value)}
              value={visual.particleLyrics}
            />
          </>
        ) : null}
        {tab === 'shelf' ? (
          <>
            <SectionLabel>3D 歌单架</SectionLabel>
            <div className="music-segmented-control">
              {(['off', 'side', 'stage'] as const).map((mode) => (
                <button
                  className={visual.shelfMode === mode ? 'active' : ''}
                  key={mode}
                  onClick={() => set('shelfMode', mode)}
                  type="button"
                >
                  {{ off: '关闭', side: '侧栏', stage: '舞台' }[mode]}
                </button>
              ))}
            </div>
            <ColorControl
              label="歌单架颜色"
              onChange={(value) => set('shelfAccentColor', value)}
              value={visual.shelfAccentColor}
            />
            <RangeControl
              label="歌单架大小"
              max={1.45}
              min={0.65}
              onChange={(value) => set('shelfSize', value)}
              step={0.01}
              value={visual.shelfSize}
            />
            <RangeControl
              label="Y 轴角度"
              max={30}
              min={-30}
              onChange={(value) => set('shelfAngleY', value)}
              step={1}
              value={visual.shelfAngleY}
            />
            <RangeControl
              label="透明度"
              max={1}
              min={0.25}
              onChange={(value) => set('shelfOpacity', value)}
              step={0.01}
              value={visual.shelfOpacity}
            />
            <div className="music-fx-note">
              <Gauge />
              静态镜头默认 -15°，滚轮只在歌单架热区切换中心卡片。
            </div>
          </>
        ) : null}
      </div>
      <footer>
        <button onClick={onReset} type="button">
          <RotateCcw />
          恢复默认
        </button>
        <span>拖拽视觉舞台旋转 · 双击回正</span>
      </footer>
    </aside>
  );
}

function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="music-fx-section-label">
      {children}
      <ChevronRight />
    </div>
  );
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: Readonly<{
  label: string;
  max: number;
  min: number;
  onChange(value: number): void;
  step: number;
  value: number;
}>) {
  return (
    <label className="music-range-control">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <output>{step >= 1 ? Math.round(value) : value.toFixed(step < 0.01 ? 3 : 2)}</output>
    </label>
  );
}

function ColorControl({
  label,
  onChange,
  value,
}: Readonly<{ label: string; onChange(value: string): void; value: string }>) {
  return (
    <label className="music-color-control">
      <span>
        {label}
        <small>{value.toUpperCase()}</small>
      </span>
      <input onChange={(event) => onChange(event.target.value)} type="color" value={value} />
    </label>
  );
}

function ToggleControl({
  label,
  onChange,
  value,
}: Readonly<{ label: string; onChange(value: boolean): void; value: boolean }>) {
  return (
    <button
      aria-pressed={value}
      className="music-toggle-control"
      onClick={() => onChange(!value)}
      type="button"
    >
      <span>{label}</span>
      <i>
        <b />
      </i>
    </button>
  );
}
