import neteaseApi from 'NeteaseCloudMusicApi';

const { cloudsearch, dj_hot, dj_program } = neteaseApi as typeof import('NeteaseCloudMusicApi');

interface PodcastRadio {
  category?: string;
  desc?: string;
  dj?: { nickname?: string };
  id?: number;
  name?: string;
  picUrl?: string;
  programCount?: number;
}

interface PodcastProgram {
  blurCoverUrl?: string;
  coverUrl?: string;
  description?: string;
  dj?: { nickname?: string };
  duration?: number;
  id?: number;
  mainSong?: { id?: number };
  name?: string;
  radio?: PodcastRadio;
}

export async function searchPodcasts(keywords: string, limit: number) {
  if (!keywords.trim()) return [];
  const response = await cloudsearch({
    keywords,
    limit: Math.min(8, limit),
    offset: 0,
    type: 1009,
  });
  const body = asRecord(response.body);
  const result = asRecord(body.result);
  const radios = asArray<PodcastRadio>(result.djRadios ?? result.djradios ?? result.radios).filter(
    (radio) => radio.id,
  );
  const settled = await Promise.allSettled(
    radios.slice(0, 6).map((radio) => loadPodcastPrograms(String(radio.id), 4, radio)),
  );
  return settled
    .flatMap((entry) => (entry.status === 'fulfilled' ? entry.value : []))
    .slice(0, limit);
}

export async function discoverPodcasts(limit = 12) {
  const response = await dj_hot({ limit: Math.min(limit, 20), offset: 0 });
  const body = asRecord(response.body);
  const radios = asArray<PodcastRadio>(body.djRadios ?? body.djradios ?? body.radios ?? body.data);
  return radios.filter((radio) => radio.id).map(toPodcastPlaylist);
}

export async function loadPodcastPrograms(
  radioId: string,
  limit = 30,
  fallbackRadio?: PodcastRadio,
) {
  const response = await dj_program({ asc: 0, limit, offset: 0, rid: Number(radioId) });
  const body = asRecord(response.body);
  return asArray<PodcastProgram>(body.programs ?? asRecord(body.data).programs)
    .map((program) => toPodcastTrack(program, fallbackRadio))
    .filter((track) => track.id);
}

function toPodcastPlaylist(radio: PodcastRadio) {
  const cover = radio.picUrl ?? '';
  return {
    coverUrl: cover ? `/api/music/cover?url=${encodeURIComponent(cover)}` : '',
    description: radio.desc ?? radio.category ?? '声音剧场',
    id: `podcast:${radio.id}`,
    name: radio.name ?? '未命名播客',
    playCount: 0,
    trackCount: radio.programCount ?? 0,
  };
}

function toPodcastTrack(program: PodcastProgram, fallbackRadio?: PodcastRadio) {
  const radio = program.radio ?? fallbackRadio;
  const songId = program.mainSong?.id;
  const cover = program.coverUrl ?? program.blurCoverUrl ?? radio?.picUrl ?? '';
  return {
    album: radio?.name ?? '声音剧场',
    artist: program.dj?.nickname ?? radio?.dj?.nickname ?? '播客主播',
    coverUrl: cover ? `/api/music/cover?url=${encodeURIComponent(cover)}` : '',
    durationMs: program.duration ?? 0,
    id: String(songId ?? ''),
    kind: 'podcast' as const,
    provider: 'podcast' as const,
    sourceId: String(program.id ?? ''),
    title: program.name ?? '未命名节目',
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
