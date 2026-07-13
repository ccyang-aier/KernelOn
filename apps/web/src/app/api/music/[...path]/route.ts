import neteaseApi from 'NeteaseCloudMusicApi';
import { NextResponse } from 'next/server';

const { cloudsearch, lyric_new, personalized, personalized_newsong, playlist_detail, song_url_v1 } =
  neteaseApi as typeof import('NeteaseCloudMusicApi');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = Readonly<{ params: Promise<{ path: string[] }> }>;

interface NeteaseArtist {
  id?: number;
  name?: string;
}

interface NeteaseAlbum {
  id?: number;
  name?: string;
  picUrl?: string;
}

interface NeteaseSong {
  id?: number;
  name?: string;
  ar?: NeteaseArtist[];
  artists?: NeteaseArtist[];
  al?: NeteaseAlbum;
  album?: NeteaseAlbum;
  dt?: number;
  duration?: number;
  fee?: number;
}

interface NeteasePlaylist {
  id?: number;
  name?: string;
  picUrl?: string;
  coverImgUrl?: string;
  trackCount?: number;
  playCount?: number;
  description?: string;
  tracks?: NeteaseSong[];
}

const imageHosts = ['music.126.net', 'music.163.com'];
const audioHosts = [
  ...imageHosts,
  'music.126.net',
  'music.163.com',
  'qq.com',
  'qqmusic.qq.com',
  'aqqmusic.tc.qq.com',
  'stream.qqmusic.qq.com',
];

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const action = path[0] ?? '';
  const url = new URL(request.url);

  try {
    switch (action) {
      case 'search':
        return await searchSongs(url);
      case 'url':
        return await resolveSongUrl(url);
      case 'lyric':
        return await resolveLyrics(url);
      case 'discover':
        return await discoverMusic();
      case 'playlist':
        return await resolvePlaylist(url);
      case 'cover':
        return await proxyMedia(request, url, imageHosts, 'image/jpeg');
      case 'audio':
        return await proxyMedia(request, url, audioHosts, 'audio/mpeg');
      default:
        return NextResponse.json({ error: 'Unknown music action' }, { status: 404 });
    }
  } catch (error) {
    console.error('[music-bff]', action, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '音乐服务暂时不可用' },
      { status: 502 },
    );
  }
}

async function searchSongs(url: URL) {
  const keywords = url.searchParams.get('q')?.trim();
  const limit = clampNumber(url.searchParams.get('limit'), 1, 40, 24);

  if (!keywords) {
    return NextResponse.json({ songs: [] });
  }

  const response = await cloudsearch({ keywords, limit, offset: 0, type: 1 });
  const body = asRecord(response.body);
  const result = asRecord(body.result);
  const songs = asArray<NeteaseSong>(result.songs).map(toTrack);

  return NextResponse.json({ songs });
}

async function resolveSongUrl(url: URL) {
  const id = requiredNumber(url, 'id');
  const quality = normalizeQuality(url.searchParams.get('quality'));
  const response = await song_url_v1({ id, level: quality });
  const body = asRecord(response.body);
  const audio = asRecord(asArray<Record<string, unknown>>(body.data)[0]);
  const remoteUrl = typeof audio.url === 'string' ? audio.url : '';

  if (!remoteUrl) {
    return NextResponse.json(
      { error: '当前歌曲没有可用音源，可能需要音乐平台会员权限' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    bitrate: numberOrNull(audio.br),
    level: typeof audio.level === 'string' ? audio.level : quality,
    size: numberOrNull(audio.size),
    url: `/api/music/audio?url=${encodeURIComponent(remoteUrl)}`,
  });
}

async function resolveLyrics(url: URL) {
  const id = requiredNumber(url, 'id');
  const response = await lyric_new({ id });
  const body = asRecord(response.body);
  const lyric = asRecord(body.lrc);
  const translated = asRecord(body.tlyric);
  const karaoke = asRecord(body.yrc);

  return NextResponse.json({
    karaoke: stringOrEmpty(karaoke.lyric),
    lyric: stringOrEmpty(lyric.lyric),
    translated: stringOrEmpty(translated.lyric),
  });
}

async function discoverMusic() {
  const [playlistsResponse, songsResponse] = await Promise.all([
    personalized({ limit: 12 }),
    personalized_newsong({ limit: 18 }),
  ]);
  const playlistBody = asRecord(playlistsResponse.body);
  const songsBody = asRecord(songsResponse.body);
  const playlists = asArray<NeteasePlaylist>(playlistBody.result).map(toPlaylistSummary);
  const songs = asArray<Record<string, unknown>>(songsBody.result).flatMap((item) => {
    const song = asRecord(item.song) as NeteaseSong;
    return song.id ? [toTrack(song)] : [];
  });

  return NextResponse.json({ playlists, songs });
}

async function resolvePlaylist(url: URL) {
  const id = requiredNumber(url, 'id');
  const response = await playlist_detail({ id, s: 0 });
  const body = asRecord(response.body);
  const playlist = asRecord(body.playlist) as NeteasePlaylist;

  return NextResponse.json({
    playlist: {
      ...toPlaylistSummary(playlist),
      songs: asArray<NeteaseSong>(playlist.tracks).map(toTrack),
    },
  });
}

async function proxyMedia(
  request: Request,
  requestUrl: URL,
  allowedHosts: readonly string[],
  fallbackContentType: string,
) {
  const remote = requestUrl.searchParams.get('url');

  if (!remote) {
    return NextResponse.json({ error: 'Missing media URL' }, { status: 400 });
  }

  const target = new URL(remote);

  if (target.protocol !== 'https:' || !hostAllowed(target.hostname, allowedHosts)) {
    return NextResponse.json({ error: 'Media host is not allowed' }, { status: 400 });
  }

  const range = request.headers.get('range');
  const upstream = await fetch(target, {
    headers: range
      ? { Range: range, 'User-Agent': browserUserAgent }
      : { 'User-Agent': browserUserAgent },
    redirect: 'follow',
  });
  const headers = new Headers();

  copyHeader(upstream.headers, headers, 'accept-ranges');
  copyHeader(upstream.headers, headers, 'content-length');
  copyHeader(upstream.headers, headers, 'content-range');
  headers.set(
    'Cache-Control',
    fallbackContentType.startsWith('image/') ? 'public, max-age=86400' : 'private, max-age=300',
  );
  headers.set('Content-Type', upstream.headers.get('content-type') ?? fallbackContentType);

  return new Response(upstream.body, { headers, status: upstream.status });
}

function toTrack(song: NeteaseSong) {
  const album = song.al ?? song.album;
  const artists = song.ar ?? song.artists ?? [];
  const cover = album?.picUrl ?? '';

  return {
    album: album?.name ?? '',
    artist:
      artists
        .map((artist) => artist.name)
        .filter(Boolean)
        .join(' / ') || '未知歌手',
    coverUrl: cover ? `/api/music/cover?url=${encodeURIComponent(cover)}` : '',
    durationMs: song.dt ?? song.duration ?? 0,
    fee: song.fee ?? 0,
    id: String(song.id ?? ''),
    provider: 'netease',
    title: song.name ?? '未命名歌曲',
  };
}

function toPlaylistSummary(playlist: NeteasePlaylist) {
  const cover = playlist.picUrl ?? playlist.coverImgUrl ?? '';

  return {
    coverUrl: cover ? `/api/music/cover?url=${encodeURIComponent(cover)}` : '',
    description: playlist.description ?? '',
    id: String(playlist.id ?? ''),
    name: playlist.name ?? '未命名歌单',
    playCount: playlist.playCount ?? 0,
    trackCount: playlist.trackCount ?? 0,
  };
}

type NeteaseQuality = Parameters<typeof song_url_v1>[0]['level'];

function normalizeQuality(value: string | null): NeteaseQuality {
  switch (value) {
    case 'standard':
    case 'exhigh':
    case 'lossless':
    case 'hires':
      return value as NeteaseQuality;
    default:
      return 'exhigh' as NeteaseQuality;
  }
}

function requiredNumber(url: URL, key: string) {
  const value = Number(url.searchParams.get(key));

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${key}`);
  }

  return value;
}

function clampNumber(value: string | null, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function hostAllowed(host: string, allowed: readonly string[]) {
  return allowed.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function copyHeader(from: Headers, to: Headers, name: string) {
  const value = from.get(name);
  if (value) to.set(name, value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const browserUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36';
