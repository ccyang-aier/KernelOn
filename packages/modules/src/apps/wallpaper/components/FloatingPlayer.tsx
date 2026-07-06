'use client';

import {
  Heart,
  MonitorPlay,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react';

import type { PlaybackSpeed, PlayerTrack, WallpaperView } from '../types';

export function FloatingPlayer({
  activeView,
  displayMode,
  isLiked,
  isMuted,
  isPlaying,
  onNext,
  onPlayPause,
  onPrevious,
  onSpeedCycle,
  onToggleDisplayMode,
  onToggleLike,
  onToggleMute,
  progressPercent,
  speed,
  track,
}: Readonly<{
  activeView: WallpaperView;
  displayMode: 'fit' | 'fill';
  isLiked: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  onNext(): void;
  onPlayPause(): void;
  onPrevious(): void;
  onSpeedCycle(): void;
  onToggleDisplayMode(): void;
  onToggleLike(): void;
  onToggleMute(): void;
  progressPercent: number;
  speed: PlaybackSpeed;
  track: PlayerTrack;
}>) {
  return (
    <aside className={`wallpaper-player wallpaper-player--${activeView}`}>
      <div className="wallpaper-player__info">
        {track.image ? (
          <img alt="" draggable={false} src={track.image} />
        ) : (
          <i className="wallpaper-player__fallback-thumb" />
        )}
        <div>
          <strong>{track.title}</strong>
          <span>
            <i />
            {track.device}
          </span>
        </div>
      </div>
      <div className="wallpaper-player__controls">
        <button
          aria-label={`Display mode: ${displayMode}`}
          data-player-active={displayMode === 'fill'}
          onClick={onToggleDisplayMode}
          type="button"
        >
          <MonitorPlay aria-hidden="true" />
        </button>
        <button
          aria-label={isLiked ? 'Unlike playing wallpaper' : 'Favorite playing wallpaper'}
          aria-pressed={isLiked}
          data-player-active={isLiked}
          onClick={onToggleLike}
          type="button"
        >
          <Heart aria-hidden="true" />
        </button>
        <button
          aria-label={isMuted ? 'Unmute wallpaper audio' : 'Mute wallpaper audio'}
          aria-pressed={isMuted}
          data-player-active={!isMuted}
          onClick={onToggleMute}
          type="button"
        >
          <Music aria-hidden="true" />
        </button>
        <button aria-label="Previous wallpaper" onClick={onPrevious} type="button">
          <SkipBack aria-hidden="true" />
        </button>
        <button
          aria-label={isPlaying ? 'Pause wallpaper' : 'Play wallpaper'}
          onClick={onPlayPause}
          type="button"
        >
          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <button aria-label="Next wallpaper" onClick={onNext} type="button">
          <SkipForward aria-hidden="true" />
        </button>
        <button
          aria-label={`Playback speed ${speed}`}
          className="wallpaper-player__speed"
          onClick={onSpeedCycle}
          type="button"
        >
          {speed}
        </button>
      </div>
      <span aria-hidden="true" className="wallpaper-player__progress">
        <i style={{ width: `${progressPercent}%` }} />
      </span>
    </aside>
  );
}
