const smartboxUrl = 'https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg';
const musicuUrl = 'https://u.y.qq.com/cgi-bin/musicu.fcg';
const qqHeaders = {
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://y.qq.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36',
};

interface QQSmartSong {
  id?: string | number;
  mid?: string;
  name?: string;
  singer?: string;
  songmid?: string;
  title?: string;
}

interface QQArtist {
  name?: string;
}

interface QQTrack {
  album?: { mid?: string; name?: string; title?: string };
  file?: { media_mid?: string };
  id?: number;
  interval?: number;
  mid?: string;
  name?: string;
  pay?: { pay_play?: number };
  singer?: QQArtist[];
  title?: string;
}

const qualityCandidates = [
  { extension: '.flac', label: 'hires', prefix: 'RS01' },
  { extension: '.flac', label: 'lossless', prefix: 'F000' },
  { extension: '.mp3', label: 'exhigh', prefix: 'M800' },
  { extension: '.mp3', label: 'standard', prefix: 'M500' },
  { extension: '.m4a', label: 'standard', prefix: 'C400' },
] as const;

export async function searchQQMusic(keywords: string, limit: number) {
  if (!keywords.trim()) return [];
  const target = new URL(smartboxUrl);
  target.search = new URLSearchParams({
    format: 'json',
    g_tk: '5381',
    hostUin: '0',
    inCharset: 'utf8',
    key: keywords,
    loginUin: '0',
    needNewCode: '0',
    notice: '0',
    outCharset: 'utf-8',
    platform: 'yqq.json',
  }).toString();
  const response = await fetch(target, { headers: qqHeaders, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`QQ 搜索失败 (${response.status})`);
  const payload = (await response.json()) as {
    data?: { song?: { itemlist?: QQSmartSong[] } };
  };
  const base = (payload.data?.song?.itemlist ?? []).slice(0, Math.min(12, limit));
  const detailed = await Promise.all(
    base.map(async (song) => {
      const mid = String(song.mid ?? song.songmid ?? song.id ?? '');
      try {
        return await loadQQSongDetail(mid, song);
      } catch {
        return toQQTrack(undefined, song);
      }
    }),
  );
  return detailed.filter((track) => track.id && track.title);
}

export async function resolveQQAudio(mid: string, mediaId: string, quality: string) {
  if (!mid) throw new Error('缺少 QQ 音乐歌曲 MID');
  const start = Math.max(
    0,
    qualityCandidates.findIndex((candidate) => candidate.label === quality),
  );
  const mediaIds = Array.from(new Set([mediaId, mid].filter(Boolean)));
  const candidates = mediaIds.flatMap((id) =>
    qualityCandidates.slice(start).map((candidate) => ({
      ...candidate,
      filename: `${candidate.prefix}${id}${candidate.extension}`,
    })),
  );
  const filenames = candidates.map((candidate) => candidate.filename);
  const json = await qqMusicRequest({
    comm: { ct: 24, cv: 0, format: 'json', uin: '0' },
    req_0: {
      method: 'CgiGetVkey',
      module: 'vkey.GetVkeyServer',
      param: {
        filename: filenames,
        guid: String(10_000_000 + Math.floor(Math.random() * 90_000_000)),
        loginflag: 1,
        platform: '20',
        songmid: filenames.map(() => mid),
        songtype: filenames.map(() => 0),
        uin: '0',
      },
    },
  });
  const block = asRecord(json.req_0);
  const data = asRecord(block.data);
  const infos = asArray<Record<string, unknown>>(data.midurlinfo);
  const info = infos.find((item) => typeof item.purl === 'string' && item.purl) ?? infos[0];
  const purl = typeof info?.purl === 'string' ? info.purl : '';
  if (!purl) throw new Error('QQ 音乐未返回可播放音源，歌曲可能受会员或版权限制');
  const sip =
    asArray<string>(data.sip).find((value) => value.startsWith('https://')) ??
    'https://ws.stream.qqmusic.qq.com/';
  const filename = typeof info?.filename === 'string' ? info.filename : '';
  const candidate = candidates.find((item) => item.filename === filename);
  return { level: candidate?.label ?? 'standard', remoteUrl: `${sip}${purl}` };
}

export async function loadQQLyrics(mid: string) {
  const target = new URL('https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg');
  target.search = new URLSearchParams({
    format: 'json',
    g_tk: '5381',
    hostUin: '0',
    inCharset: 'utf8',
    loginUin: '0',
    needNewCode: '0',
    notice: '0',
    outCharset: 'utf-8',
    platform: 'yqq.json',
    songmid: mid,
  }).toString();
  const response = await fetch(target, { headers: qqHeaders, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`QQ 歌词加载失败 (${response.status})`);
  const body = (await response.json()) as { lyric?: string; trans?: string };
  return { lyric: decodeMaybeBase64(body.lyric), translated: decodeMaybeBase64(body.trans) };
}

async function loadQQSongDetail(mid: string, fallback: QQSmartSong) {
  const json = await qqMusicRequest({
    comm: { ct: 24, cv: 0 },
    songinfo: {
      method: 'get_song_detail_yqq',
      module: 'music.pf_song_detail_svr',
      param: { song_mid: mid },
    },
  });
  const block = asRecord(json.songinfo);
  const data = asRecord(block.data);
  return toQQTrack(data.track_info as QQTrack | undefined, fallback);
}

function toQQTrack(track: QQTrack | undefined, fallback: QQSmartSong) {
  const mid = String(track?.mid ?? fallback.mid ?? fallback.songmid ?? fallback.id ?? '');
  const albumMid = track?.album?.mid ?? '';
  return {
    album: track?.album?.name ?? track?.album?.title ?? '',
    artist:
      track?.singer
        ?.map((artist) => artist.name)
        .filter(Boolean)
        .join(' / ') ||
      fallback.singer ||
      '未知歌手',
    coverUrl: albumMid
      ? `/api/music/cover?url=${encodeURIComponent(`https://y.qq.com/music/photo_new/T002R300x300M000${albumMid}.jpg?max_age=2592000`)}`
      : '',
    durationMs: Number(track?.interval ?? 0) * 1000,
    fee: Number(track?.pay?.pay_play ?? 0),
    id: mid,
    kind: 'song' as const,
    mediaId: track?.file?.media_mid ?? mid,
    provider: 'qq' as const,
    title: track?.name ?? track?.title ?? fallback.name ?? fallback.title ?? '未命名歌曲',
  };
}

async function qqMusicRequest(payload: Record<string, unknown>) {
  const response = await fetch(musicuUrl, {
    body: JSON.stringify(payload),
    headers: { ...qqHeaders, 'Content-Type': 'application/json;charset=UTF-8' },
    method: 'POST',
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`QQ 音乐服务请求失败 (${response.status})`);
  return (await response.json()) as Record<string, unknown>;
}

function decodeMaybeBase64(value: unknown) {
  if (typeof value !== 'string' || !value) return '';
  try {
    return Buffer.from(value.replace(/\s+/g, ''), 'base64').toString('utf8');
  } catch {
    return value;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
