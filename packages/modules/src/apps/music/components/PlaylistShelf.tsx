import { Pause, Play } from 'lucide-react';
import { useState, type WheelEvent } from 'react';

import type { MusicPlaylist, VisualSettings } from '../types';
import { Cover } from './SearchPanel';

interface PlaylistShelfProps {
  isPlaying: boolean;
  onOpen(playlist: MusicPlaylist): void;
  playlists: MusicPlaylist[];
  visual: VisualSettings;
}

export function PlaylistShelf({ isPlaying, onOpen, playlists, visual }: PlaylistShelfProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (visual.shelfMode === 'off' || playlists.length === 0) return null;
  const activeIndex = Math.min(selectedIndex, playlists.length - 1);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (Math.abs(event.deltaY) < 2) return;
    setSelectedIndex((current) =>
      Math.min(playlists.length - 1, Math.max(0, current + (event.deltaY > 0 ? 1 : -1))),
    );
  };

  return (
    <div
      aria-label="3D 歌单架"
      className="music-playlist-shelf"
      data-mode={visual.shelfMode}
      onWheel={handleWheel}
      style={
        {
          '--shelf-accent': visual.shelfAccentColor,
          '--shelf-angle': `${visual.shelfAngleY}deg`,
          '--shelf-opacity': visual.shelfOpacity,
          '--shelf-scale': visual.shelfSize,
        } as React.CSSProperties
      }
    >
      <div className="music-shelf-track">
        {playlists.slice(0, 7).map((playlist, index) => {
          const offset = index - activeIndex;
          const distance = Math.abs(offset);
          return (
            <button
              aria-pressed={index === activeIndex}
              className="music-shelf-card"
              key={playlist.id}
              onClick={() => (index === activeIndex ? onOpen(playlist) : setSelectedIndex(index))}
              style={{
                filter: `brightness(${Math.max(0.46, 1 - distance * 0.18)})`,
                opacity: Math.max(0.12, 1 - distance * 0.17),
                transform: `translate3d(calc(-50% + ${offset * 64}px),calc(-50% + ${distance * 13}px),${distance * -80}px) rotateY(${offset * -13}deg) scale(${Math.max(0.62, 1 - distance * 0.09)})`,
                zIndex: index === activeIndex ? 4 : Math.max(0, 3 - distance),
              }}
              type="button"
            >
              <Cover artwork={playlist.coverUrl} title={playlist.name} />
              <span>
                <strong>{playlist.name}</strong>
                <small>{playlist.trackCount} TRACKS</small>
              </span>
              <i>{isPlaying && index === activeIndex ? <Pause /> : <Play />}</i>
            </button>
          );
        })}
      </div>
      <div className="music-shelf-caption">
        <span>
          {activeIndex + 1} / {Math.min(playlists.length, 7)}
        </span>
        <strong>{playlists[activeIndex]?.name}</strong>
      </div>
    </div>
  );
}
