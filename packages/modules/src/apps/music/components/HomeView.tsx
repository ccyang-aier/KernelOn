import { Library, Search, Sparkles, Upload } from 'lucide-react';

import type { MusicPlaylist, MusicTrack, WeatherRadio } from '../types';
import { Cover } from './SearchPanel';

interface HomeViewProps {
  history: MusicTrack[];
  isLoading: boolean;
  onImport(): void;
  onOpenLibrary(): void;
  onOpenVisuals(): void;
  onPlay(track: MusicTrack): void;
  onPlayPlaylist(playlist: MusicPlaylist): void;
  onPlayWeather(): void;
  onSearch(): void;
  playlists: MusicPlaylist[];
  songs: MusicTrack[];
  weather: WeatherRadio | null;
}

export function HomeView({
  history,
  isLoading,
  onImport,
  onOpenLibrary,
  onOpenVisuals,
  onPlay,
  onPlayPlaylist,
  onSearch,
  playlists,
  songs,
}: HomeViewProps) {
  const leadPlaylist = playlists[0];
  const latest = history[0] ?? songs[3] ?? songs[0];
  const recommendations = songs.slice(0, 5);

  return (
    <section aria-label="Mineradio home" className="music-home">
      <div className="music-home-grid">
        <HomeCard
          artwork={leadPlaylist?.coverUrl ?? songs[0]?.coverUrl}
          eyebrow="LIBRARY"
          onClick={onOpenLibrary}
          title="我的歌单"
          subtitle={
            leadPlaylist ? `${leadPlaylist.trackCount} 首 · 云音乐私人雷达` : '打开资料库浏览歌单'
          }
        />
        <HomeCard
          artwork={songs[0]?.coverUrl}
          eyebrow="DAILY"
          onClick={() => songs[0] && onPlay(songs[0])}
          title={songs[0]?.title ?? '每日推荐'}
          subtitle={isLoading ? '正在整理今日歌曲' : (songs[0]?.artist ?? '点击播放今日队列')}
        />
        <HomeCard
          artwork={songs[1]?.coverUrl}
          eyebrow="SONG"
          onClick={() => songs[1] && onPlay(songs[1])}
          title={songs[1]?.title ?? '私人电台'}
          subtitle={songs[1]?.artist ?? '从推荐和歌单里开播'}
        />
        <HomeCard
          artwork={latest?.coverUrl}
          eyebrow="CONTINUE"
          onClick={() => latest && onPlay(latest)}
          title="继续听"
          subtitle={latest ? `${latest.title} · ${latest.artist}` : '最近播放会出现在这里'}
        />
        <HomeCard
          artwork={songs[2]?.coverUrl}
          eyebrow="PROFILE"
          onClick={() => songs[2] && onPlay(songs[2])}
          title="听歌画像"
          subtitle="播放几首后生成偏好"
        />
        <HomeCard
          artwork={leadPlaylist?.coverUrl ?? songs[4]?.coverUrl}
          eyebrow="PLAYLIST"
          onClick={() => leadPlaylist && onPlayPlaylist(leadPlaylist)}
          title={leadPlaylist?.name ?? '那些被单曲循环无数次的歌'}
          subtitle={leadPlaylist ? `${leadPlaylist.trackCount} 首 · 精选歌单` : '从热门歌单开始'}
        />
      </div>

      <section aria-label="你的歌单与推荐" className="music-home-recommendations">
        <header className="music-home-section-head">
          <div>
            <strong>你的歌单与推荐</strong>
            <span>{isLoading ? '正在更新推荐' : '刚刚更新 · 点击即可播放'}</span>
          </div>
          <nav aria-label="首页快捷操作" className="music-home-quick-actions">
            <button aria-label="搜索歌曲" onClick={onSearch} type="button">
              <Search />
            </button>
            <button aria-label="导入本地音乐" onClick={onImport} type="button">
              <Upload />
            </button>
            <button aria-label="打开视觉控制台" onClick={onOpenVisuals} type="button">
              <Sparkles />
            </button>
          </nav>
        </header>
        <div className="music-home-tile-row">
          {recommendations.length
            ? recommendations.map((track) => (
                <button
                  className="music-home-tile"
                  key={`${track.provider}:${track.id}`}
                  onClick={() => onPlay(track)}
                  type="button"
                >
                  <Cover artwork={track.coverUrl} title={track.title} />
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </button>
              ))
            : Array.from({ length: 5 }, (_, index) => (
                <button
                  className="music-home-tile music-home-tile-skeleton"
                  disabled
                  key={index}
                  type="button"
                >
                  <span aria-hidden="true" />
                  <strong>正在整理推荐</strong>
                </button>
              ))}
        </div>
      </section>
    </section>
  );
}

function HomeCard({
  artwork,
  eyebrow,
  onClick,
  subtitle,
  title,
}: Readonly<{
  artwork?: string;
  eyebrow: string;
  onClick(): void;
  subtitle: string;
  title: string;
}>) {
  return (
    <button className="music-home-card" onClick={onClick} type="button">
      <span className="music-home-card-copy">
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
      <span className="music-home-card-art">
        {artwork ? <Cover artwork={artwork} title={title} /> : <Library />}
      </span>
    </button>
  );
}
