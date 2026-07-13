export type MusicProvider = 'netease' | 'qq' | 'local' | 'demo';
export type PlaybackMode = 'sequence' | 'loop-one' | 'shuffle';
export type PlaybackQuality = 'standard' | 'exhigh' | 'lossless' | 'hires';
export type VisualPresetId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ShelfMode = 'off' | 'side' | 'stage';

export interface MusicTrack {
  album: string;
  artist: string;
  audioUrl?: string;
  coverUrl: string;
  durationMs: number;
  fee?: number;
  id: string;
  lyrics?: LyricLine[];
  provider: MusicProvider;
  title: string;
}

export interface MusicPlaylist {
  coverUrl: string;
  description: string;
  id: string;
  name: string;
  playCount: number;
  songs?: MusicTrack[];
  trackCount: number;
}

export interface LyricLine {
  endTime?: number;
  text: string;
  time: number;
  translated?: string;
  words?: LyricWord[];
}

export interface LyricWord {
  duration: number;
  text: string;
  time: number;
}

export interface VisualPresetMeta {
  description: string;
  id: VisualPresetId;
  name: string;
}

export interface VisualSettings {
  backgroundColor: string;
  backgroundOpacity: number;
  bloom: boolean;
  cinema: boolean;
  colorBoost: number;
  controlGlassChromaticOffset: number;
  depth: number;
  intensity: number;
  lyricColor: string;
  lyricGlow: boolean;
  lyricGlowColor: string;
  lyricGlowStrength: number;
  lyricHighlightColor: string;
  lyricLetterSpacing: number;
  lyricScale: number;
  lyricWeight: number;
  particleLyrics: boolean;
  pointSize: number;
  preset: VisualPresetId;
  scatter: number;
  shelfAccentColor: string;
  shelfAngleY: number;
  shelfMode: ShelfMode;
  shelfOpacity: number;
  shelfSize: number;
  speed: number;
  twist: number;
  uiAccentColor: string;
  visualTintColor: string;
}

export interface PersistedMusicState {
  likedTrackIds: string[];
  listenHistory: MusicTrack[];
  mode: PlaybackMode;
  quality: PlaybackQuality;
  queue: MusicTrack[];
  visual: VisualSettings;
  volume: number;
}

export interface MusicDiscoverPayload {
  playlists: MusicPlaylist[];
  songs: MusicTrack[];
}

export interface ResolvedAudio {
  bitrate: number | null;
  level: PlaybackQuality;
  size: number | null;
  url: string;
}
