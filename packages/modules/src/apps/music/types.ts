export type MusicProvider = 'netease' | 'qq' | 'podcast' | 'local' | 'demo';
export type MusicSearchMode = 'all' | 'netease' | 'qq' | 'podcast';
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
  kind?: 'song' | 'podcast';
  lyrics?: LyricLine[];
  mediaId?: string;
  originalCoverUrl?: string;
  originalLyrics?: LyricLine[];
  provider: MusicProvider;
  sourceId?: string;
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
  backgroundImage: string;
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
  lyricLineHeight: number;
  lyricOffsetX: number;
  lyricOffsetY: number;
  lyricOffsetZ: number;
  lyricScale: number;
  lyricTiltX: number;
  lyricTiltY: number;
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
  searchHistory: string[];
  visual: VisualSettings;
  volume: number;
}

export interface MusicDiscoverPayload {
  playlists: MusicPlaylist[];
  songs: MusicTrack[];
}

export interface WeatherRadio {
  city: string;
  condition: string;
  mood: string;
  songs: MusicTrack[];
  temperature: number;
  title: string;
}

export interface ResolvedAudio {
  bitrate: number | null;
  level: PlaybackQuality;
  size: number | null;
  url: string;
}
