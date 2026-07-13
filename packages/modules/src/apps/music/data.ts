import type { MusicPlaylist, MusicTrack, VisualPresetMeta, VisualSettings } from './types';

export const visualPresets: VisualPresetMeta[] = [
  { id: 0, name: 'emily专辑封面', description: '封面粒子 · 快速入场' },
  { id: 6, name: '安魂', description: '骷髅 · YUI7W' },
  { id: 5, name: '星河', description: '壁纸粒子 · 音乐律动' },
  { id: 4, name: '唱片', description: '唱片 · 圆形封面' },
  { id: 2, name: '星球', description: '星球 · 雕塑感' },
  { id: 1, name: '滚筒', description: '隧道 · 沉浸感' },
  { id: 3, name: '虚空', description: '无粒子 · 自定义背景' },
];

export const defaultVisualSettings: VisualSettings = {
  backgroundColor: '#000000',
  backgroundOpacity: 1,
  bloom: false,
  cinema: true,
  colorBoost: 1.1,
  controlGlassChromaticOffset: 90,
  depth: 1,
  intensity: 0.85,
  lyricColor: '#a9b8c8',
  lyricGlow: true,
  lyricGlowColor: '#008aff',
  lyricGlowStrength: 0.28,
  lyricHighlightColor: '#fac900',
  lyricLetterSpacing: 0,
  lyricScale: 1,
  lyricWeight: 900,
  particleLyrics: true,
  pointSize: 1,
  preset: 0,
  scatter: 0,
  shelfAccentColor: '#ffffff',
  shelfAngleY: -15,
  shelfMode: 'side',
  shelfOpacity: 1,
  shelfSize: 1,
  speed: 1,
  twist: 0,
  uiAccentColor: '#ffffff',
  visualTintColor: '#9db8cf',
};

export const demoTracks: MusicTrack[] = [
  {
    album: 'Private Visual Radio',
    artist: 'Mineradio',
    coverUrl: '',
    durationMs: 28_000,
    id: 'demo-aurora',
    lyrics: [
      { time: 0, text: 'Welcome to Mineradio' },
      { time: 4.2, text: '让封面、歌词和粒子跟着音乐动起来' },
      { time: 9.1, text: '漂浮在黑色星河里的私人电台' },
      { time: 14.4, text: 'Every beat becomes a little light' },
      { time: 20.1, text: 'KernelOn · private visual radio' },
    ],
    provider: 'demo',
    title: 'Aurora Signal',
  },
  {
    album: 'Private Visual Radio',
    artist: 'Mineradio',
    coverUrl: '',
    durationMs: 32_000,
    id: 'demo-neon-rain',
    lyrics: [
      { time: 0, text: '霓虹落进夜色' },
      { time: 5.2, text: '低频在城市边缘呼吸' },
      { time: 10.8, text: '把今天留在玻璃之后' },
      { time: 17.6, text: '再向星河深处行驶' },
      { time: 24.5, text: 'Neon rain, stay for a while' },
    ],
    provider: 'demo',
    title: 'Neon Rain',
  },
  {
    album: 'Private Visual Radio',
    artist: 'Mineradio',
    coverUrl: '',
    durationMs: 30_000,
    id: 'demo-slow-orbit',
    lyrics: [
      { time: 0, text: '缓慢环绕' },
      { time: 5.5, text: '像唱针落下的那一秒' },
      { time: 12.2, text: '所有碎片开始有了方向' },
      { time: 19, text: 'One more orbit around the light' },
    ],
    provider: 'demo',
    title: 'Slow Orbit',
  },
];

export const demoPlaylists: MusicPlaylist[] = [
  {
    coverUrl: '',
    description: 'Mineradio 内置视觉舞台试听歌单',
    id: 'demo-visual-radio',
    name: 'Private Visual Radio',
    playCount: 0,
    songs: demoTracks,
    trackCount: demoTracks.length,
  },
  {
    coverUrl: '',
    description: '适合星河、滚筒与电影镜头的夜间播放序列',
    id: 'demo-midnight',
    name: 'Midnight Drive',
    playCount: 0,
    songs: [...demoTracks].reverse(),
    trackCount: demoTracks.length,
  },
];

export const qualityLabels = {
  standard: '标准',
  exhigh: '极高',
  lossless: '无损',
  hires: 'Hi-Res',
} as const;
