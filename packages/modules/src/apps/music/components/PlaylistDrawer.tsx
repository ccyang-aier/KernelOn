import {
  Heart,
  Library,
  ListMusic,
  Pause,
  Pin,
  Play,
  Radio,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

import type { MusicPlaylist, MusicTrack, PlaybackMode } from '../types';
import { Cover } from './SearchPanel';

type DrawerTab = 'queue' | 'playlists' | 'podcasts';

interface PlaylistDrawerProps {
  activeTrackId?: string;
  history: MusicTrack[];
  isLoadingPlaylist: boolean;
  isOpen: boolean;
  isPlaying: boolean;
  likedTrackIds: ReadonlySet<string>;
  mode: PlaybackMode;
  onClearQueue(): void;
  onClose(): void;
  onOpenPlaylist(playlist: MusicPlaylist): void;
  onPlayTrack(track: MusicTrack): void;
  onRemoveTrack(index: number): void;
  onSelectMode(): void;
  playlists: MusicPlaylist[];
  queue: MusicTrack[];
  selectedPlaylist: MusicPlaylist | null;
}

export function PlaylistDrawer({
  activeTrackId,
  history,
  isLoadingPlaylist,
  isOpen,
  isPlaying,
  likedTrackIds,
  mode,
  onClearQueue,
  onClose,
  onOpenPlaylist,
  onPlayTrack,
  onRemoveTrack,
  onSelectMode,
  playlists,
  queue,
  selectedPlaylist,
}: PlaylistDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('queue');

  return (
    <aside aria-label="歌单与队列" className="music-drawer" data-open={isOpen}>
      <header>
        <div>
          <strong>歌单 / 队列</strong>
          <span>QUEUE · 鼠标移开自动隐藏</span>
        </div>
        <div className="music-drawer-header-actions">
          <button aria-label="常开歌单" type="button">
            <Pin />
          </button>
          <button aria-label="关闭歌单面板" onClick={onClose} type="button">
            <X />
          </button>
        </div>
      </header>
      <div className="music-drawer-shortcuts">
        <button onClick={onSelectMode} type="button">
          <Shuffle />
          {modeLabel(mode)}
        </button>
        <button onClick={onClearQueue} type="button">
          <Trash2 />
          清空
        </button>
      </div>
      <nav aria-label="资料库分类">
        <button
          className={tab === 'queue' ? 'active' : ''}
          onClick={() => setTab('queue')}
          type="button"
        >
          <ListMusic />
          当前队列
        </button>
        <button
          className={tab === 'playlists' ? 'active' : ''}
          onClick={() => setTab('playlists')}
          type="button"
        >
          <Library />
          我的歌单
        </button>
        <button
          className={tab === 'podcasts' ? 'active' : ''}
          onClick={() => setTab('podcasts')}
          type="button"
        >
          <Radio />
          我的播客
        </button>
      </nav>
      <div className="music-drawer-content">
        {tab === 'queue' ? (
          <TrackList
            activeTrackId={activeTrackId}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            onPlay={onPlayTrack}
            onRemove={onRemoveTrack}
            tracks={queue}
          />
        ) : null}
        {tab === 'playlists' ? (
          selectedPlaylist ? (
            <div className="music-playlist-detail">
              <button
                className="music-detail-back"
                onClick={() => onOpenPlaylist(selectedPlaylist)}
                type="button"
              >
                ← 返回歌单
              </button>
              <div className="music-detail-head">
                <Cover artwork={selectedPlaylist.coverUrl} title={selectedPlaylist.name} />
                <div>
                  <strong>{selectedPlaylist.name}</strong>
                  <span>{selectedPlaylist.trackCount} 首歌曲</span>
                </div>
              </div>
              {isLoadingPlaylist ? (
                <div className="music-panel-empty">正在加载歌单...</div>
              ) : (
                <TrackList
                  activeTrackId={activeTrackId}
                  isPlaying={isPlaying}
                  likedTrackIds={likedTrackIds}
                  onPlay={onPlayTrack}
                  tracks={selectedPlaylist.songs ?? []}
                />
              )}
            </div>
          ) : (
            <div className="music-playlist-grid">
              {playlists.map((playlist) => (
                <button key={playlist.id} onClick={() => onOpenPlaylist(playlist)} type="button">
                  <Cover artwork={playlist.coverUrl} title={playlist.name} />
                  <span>
                    <strong>{playlist.name}</strong>
                    <small>{playlist.trackCount} 首</small>
                  </span>
                </button>
              ))}
            </div>
          )
        ) : null}
        {tab === 'podcasts' ? (
          <div className="music-podcast-list">
            <div>
              <Radio />
              <strong>声音剧场</strong>
              <span>播客搜索与节目播放沿用音乐队列</span>
            </div>
            {history.slice(0, 6).map((track) => (
              <button key={track.id} onClick={() => onPlayTrack(track)} type="button">
                <Cover artwork={track.coverUrl} title={track.title} />
                <span>
                  <strong>{track.title}</strong>
                  <small>{track.artist}</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function TrackList({
  activeTrackId,
  isPlaying,
  likedTrackIds,
  onPlay,
  onRemove,
  tracks,
}: Readonly<{
  activeTrackId?: string;
  isPlaying: boolean;
  likedTrackIds: ReadonlySet<string>;
  onPlay(track: MusicTrack): void;
  onRemove?(index: number): void;
  tracks: MusicTrack[];
}>) {
  if (!tracks.length) return <div className="music-panel-empty">队列里还没有歌曲</div>;
  return (
    <div className="music-track-list">
      {tracks.map((track, index) => {
        const active = track.id === activeTrackId;
        return (
          <div
            className="music-track-row"
            data-active={active}
            key={`${track.provider}:${track.id}:${index}`}
          >
            <button aria-label={`播放 ${track.title}`} onClick={() => onPlay(track)} type="button">
              <Cover artwork={track.coverUrl} title={track.title} />
              <span>
                <strong>{track.title}</strong>
                <small>{track.artist}</small>
              </span>
              {likedTrackIds.has(track.id) ? <Heart className="liked" /> : null}
              {active && isPlaying ? <Pause /> : <Play />}
            </button>
            {onRemove ? (
              <button
                aria-label={`从队列移除 ${track.title}`}
                className="music-track-remove"
                onClick={() => onRemove(index)}
                type="button"
              >
                <X />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function modeLabel(mode: PlaybackMode) {
  if (mode === 'shuffle') return '随机';
  if (mode === 'loop-one') return '单曲循环';
  return '顺序循环';
}
