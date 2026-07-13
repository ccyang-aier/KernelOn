import {
  AudioLines,
  CloudSun,
  Disc3,
  Library,
  ListMusic,
  Mic2,
  Radio,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';

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
  onPlayWeather,
  onSearch,
  playlists,
  songs,
  weather,
}: HomeViewProps) {
  const leadPlaylist = playlists[0];
  const latest = history[0] ?? songs[0];

  return (
    <section aria-label="Mineradio home" className="music-home">
      <div className="music-home-hero">
        <div className="music-construction-mark">
          <span />
          此处施工
          <br />
          请期待
          <span />
        </div>
        <button onClick={onOpenVisuals} type="button">
          展开播放器控制台
        </button>
        <div className="music-home-wave" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index} style={{ animationDelay: `${index * -55}ms` }} />
          ))}
        </div>
      </div>

      <div className="music-home-grid">
        <HomeCard
          Icon={CloudSun}
          eyebrow="WEATHER RADIO"
          onClick={weather?.songs.length ? onPlayWeather : onOpenLibrary}
          title={weather ? `${weather.city} · ${weather.temperature}°` : '天气电台'}
          subtitle={weather ? `${weather.condition} · ${weather.mood}` : '正在感知城市天气'}
        />
        <HomeCard
          Icon={Disc3}
          eyebrow="DAILY"
          onClick={() => songs[0] && onPlay(songs[0])}
          title="每日推荐"
          subtitle={isLoading ? '正在整理今日歌曲' : '从精选推荐开始播放'}
          artwork={songs[0]?.coverUrl}
        />
        <HomeCard
          Icon={Radio}
          eyebrow="SONG"
          onClick={() => songs[1] && onPlay(songs[1])}
          title="私人电台"
          subtitle="从推荐和歌单里开播"
          artwork={songs[1]?.coverUrl}
        />
        <HomeCard
          Icon={AudioLines}
          eyebrow="CONTINUE"
          onClick={() => latest && onPlay(latest)}
          title="继续听"
          subtitle={latest ? `${latest.title} · ${latest.artist}` : '最近播放会出现在这里'}
          artwork={latest?.coverUrl}
        />
        <HomeCard
          Icon={Sparkles}
          eyebrow="PROFILE"
          onClick={() => songs[2] && onPlay(songs[2])}
          title="听歌画像"
          subtitle="播放几首后生成偏好"
          artwork={songs[2]?.coverUrl}
        />
        <HomeCard
          Icon={ListMusic}
          eyebrow="PLAYLIST"
          onClick={() => leadPlaylist && onPlayPlaylist(leadPlaylist)}
          title={leadPlaylist?.name ?? '更多歌曲'}
          subtitle={
            leadPlaylist ? `${leadPlaylist.trackCount} 首 · 精选歌单` : '播放后会继续补全推荐'
          }
          artwork={leadPlaylist?.coverUrl}
        />
      </div>

      <div className="music-home-start">
        <div>
          <strong>先从这里开始</strong>
          <span>搜索、导入或从推荐歌单进入视觉舞台</span>
        </div>
        <div className="music-home-actions">
          <button onClick={onOpenLibrary} type="button">
            <Library />
            浏览歌单
          </button>
          <button onClick={onSearch} type="button">
            <Search />
            搜索一首歌
          </button>
          <button onClick={onImport} type="button">
            <Upload />
            导入本地音乐
          </button>
          <button onClick={onOpenLibrary} type="button">
            <Mic2 />
            搜索播客
          </button>
          <button onClick={onOpenVisuals} type="button">
            <Sparkles />
            看看视觉舞台
          </button>
        </div>
      </div>
    </section>
  );
}

function HomeCard({
  Icon,
  artwork,
  eyebrow,
  onClick,
  subtitle,
  title,
}: Readonly<{
  Icon: typeof CloudSun;
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
        {artwork ? <Cover artwork={artwork} title={title} /> : <Icon />}
      </span>
    </button>
  );
}
