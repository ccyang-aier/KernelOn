import {
  ChevronDown,
  Disc3,
  Heart,
  ListMusic,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { qualityLabels } from '../data';
import type { MusicTrack, PlaybackMode, PlaybackQuality } from '../types';
import { Cover } from './SearchPanel';

interface PlayerBarProps {
  currentTime: number;
  duration: number;
  immersive: boolean;
  isLiked: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  mode: PlaybackMode;
  onCycleMode(): void;
  onNext(): void;
  onOpenTrackDetail(): void;
  onOpenQueue(): void;
  onPrevious(): void;
  onQualityChange(quality: PlaybackQuality): void;
  onSeek(time: number): void;
  onToggleImmersive(): void;
  onToggleLike(): void;
  onTogglePlay(): void;
  onVolumeChange(volume: number): void;
  quality: PlaybackQuality;
  queueLength: number;
  track: MusicTrack | null;
  volume: number;
}

export function PlayerBar({
  currentTime,
  duration,
  immersive,
  isLiked,
  isLoading,
  isPlaying,
  mode,
  onCycleMode,
  onNext,
  onOpenTrackDetail,
  onOpenQueue,
  onPrevious,
  onQualityChange,
  onSeek,
  onToggleImmersive,
  onToggleLike,
  onTogglePlay,
  onVolumeChange,
  quality,
  queueLength,
  track,
  volume,
}: PlayerBarProps) {
  const ModeIcon = mode === 'shuffle' ? Shuffle : mode === 'loop-one' ? Repeat1 : Repeat;
  const VolumeIcon = volume <= 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="music-player-wrap">
      <div aria-hidden="true" className="music-player-glass-filter" />
      <div className="music-player-bar">
        <div className="music-player-track">
          <button
            aria-label="打开歌曲详情"
            className="music-track-detail-trigger"
            disabled={!track}
            onClick={onOpenTrackDetail}
            type="button"
          >
            <Cover artwork={track?.coverUrl ?? ''} title={track?.title ?? 'M'} />
          </button>
          <div>
            <strong>{track?.title ?? '当前队列'}</strong>
            <button disabled={!track} onClick={onToggleLike} type="button">
              <span>{track?.artist ?? `${queueLength} 首`}</span>
              {isLiked ? <Heart className="liked" /> : null}
            </button>
          </div>
          <label className="music-quality-control">
            {qualityLabels[quality]}
            <ChevronDown />
            <select
              aria-label="播放音质"
              onChange={(event) => onQualityChange(event.target.value as PlaybackQuality)}
              value={quality}
            >
              {Object.entries(qualityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="music-player-controls">
          <button aria-label={modeLabel(mode)} onClick={onCycleMode} type="button">
            <ModeIcon />
          </button>
          <button aria-label="上一首" onClick={onPrevious} type="button">
            <SkipBack />
          </button>
          <button
            aria-label="播放/暂停"
            className="music-play-button"
            disabled={!track}
            onClick={onTogglePlay}
            type="button"
          >
            {isLoading ? <Disc3 className="music-spin" /> : isPlaying ? <Pause /> : <Play />}
          </button>
          <button aria-label="下一首" onClick={onNext} type="button">
            <SkipForward />
          </button>
          <button aria-label="当前队列" onClick={onOpenQueue} type="button">
            <ListMusic />
            <small>{queueLength}</small>
          </button>
        </div>
        <div className="music-player-modes">
          <label className="music-volume-control">
            <VolumeIcon />
            <input
              aria-label="音量"
              max={1}
              min={0}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              step={0.01}
              type="range"
              value={volume}
            />
          </label>
          <button
            aria-label={immersive ? '退出全沉浸式' : '全沉浸式'}
            onClick={onToggleImmersive}
            type="button"
          >
            {immersive ? <Minimize2 /> : <Maximize2 />}
          </button>
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <input
          aria-label="播放进度"
          className="music-progress"
          max={Math.max(1, duration)}
          min={0}
          onChange={(event) => onSeek(Number(event.target.value))}
          step={0.1}
          style={{ '--progress': `${progress * 100}%` } as React.CSSProperties}
          type="range"
          value={Math.min(currentTime, Math.max(1, duration))}
        />
      </div>
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

function modeLabel(mode: PlaybackMode) {
  if (mode === 'shuffle') return '随机播放';
  if (mode === 'loop-one') return '单曲循环';
  return '顺序循环';
}
