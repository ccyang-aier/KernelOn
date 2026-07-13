import type {
  LyricLine,
  LyricWord,
  MusicDiscoverPayload,
  MusicPlaylist,
  MusicTrack,
  PlaybackQuality,
  ResolvedAudio,
} from './types';

export async function discoverMusic(signal?: AbortSignal) {
  return apiJson<MusicDiscoverPayload>('/api/music/discover', signal);
}

export async function searchMusic(query: string, signal?: AbortSignal) {
  const payload = await apiJson<{ songs: MusicTrack[] }>(
    `/api/music/search?q=${encodeURIComponent(query)}&limit=30`,
    signal,
  );
  return payload.songs;
}

export async function loadPlaylist(id: string, signal?: AbortSignal) {
  const payload = await apiJson<{ playlist: MusicPlaylist }>(
    `/api/music/playlist?id=${encodeURIComponent(id)}`,
    signal,
  );
  return payload.playlist;
}

export async function resolveAudio(
  track: MusicTrack,
  quality: PlaybackQuality,
  signal?: AbortSignal,
) {
  if (track.audioUrl) {
    return {
      bitrate: null,
      level: quality,
      size: null,
      url: track.audioUrl,
    } satisfies ResolvedAudio;
  }

  return apiJson<ResolvedAudio>(
    `/api/music/url?id=${encodeURIComponent(track.id)}&quality=${quality}`,
    signal,
  );
}

export async function loadLyrics(track: MusicTrack, signal?: AbortSignal) {
  if (track.lyrics?.length) return track.lyrics;

  const payload = await apiJson<{ karaoke: string; lyric: string; translated: string }>(
    `/api/music/lyric?id=${encodeURIComponent(track.id)}`,
    signal,
  );

  return parseLyrics(payload.karaoke || payload.lyric, payload.translated);
}

export function parseLyrics(source: string, translatedSource = ''): LyricLine[] {
  const translations = new Map(
    parseSimpleLyrics(translatedSource).map((line) => [roundLyricTime(line.time), line.text]),
  );
  const karaoke = parseKaraokeLyrics(source);

  if (karaoke.length > 0) {
    return karaoke.map((line) => ({
      ...line,
      translated: translations.get(roundLyricTime(line.time)),
    }));
  }

  return parseSimpleLyrics(source).map((line) => ({
    ...line,
    translated: translations.get(roundLyricTime(line.time)),
  }));
}

function parseSimpleLyrics(source: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timestampPattern = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  source.split(/\r?\n/).forEach((rawLine) => {
    const text = rawLine.replace(timestampPattern, '').trim();
    if (!text) return;
    const matches = Array.from(rawLine.matchAll(timestampPattern));
    matches.forEach((match) => {
      const fraction = Number(`0.${(match[3] ?? '0').padEnd(3, '0').slice(0, 3)}`);
      lines.push({ text, time: Number(match[1]) * 60 + Number(match[2]) + fraction });
    });
  });

  return finalizeLyricLines(lines);
}

function parseKaraokeLyrics(source: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const linePattern = /^\[(\d+),(\d+)\](.*)$/;
  const wordPattern = /\((\d+),(\d+),\d+\)([^()]*)/g;

  source.split(/\r?\n/).forEach((rawLine) => {
    const lineMatch = rawLine.match(linePattern);
    if (!lineMatch) return;
    const lineTime = Number(lineMatch[1]) / 1000;
    const words: LyricWord[] = Array.from(lineMatch[3].matchAll(wordPattern)).map((match) => ({
      duration: Number(match[2]) / 1000,
      text: match[3],
      time: Number(match[1]) / 1000,
    }));
    const text = words
      .map((word) => word.text)
      .join('')
      .trim();
    if (text)
      lines.push({ endTime: lineTime + Number(lineMatch[2]) / 1000, text, time: lineTime, words });
  });

  return finalizeLyricLines(lines);
}

function finalizeLyricLines(lines: LyricLine[]) {
  return lines
    .sort((left, right) => left.time - right.time)
    .map((line, index, all) => ({
      ...line,
      endTime: line.endTime ?? all[index + 1]?.time ?? line.time + 5,
    }));
}

async function apiJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', signal });
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || `音乐服务请求失败 (${response.status})`);
  }

  return payload;
}

function roundLyricTime(value: number) {
  return Math.round(value * 10) / 10;
}
