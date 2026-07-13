import { defaultVisualSettings } from './data';
import type { PersistedMusicState } from './types';

const storageKey = 'kernelon.music.state.v1';

export const defaultPersistedMusicState: PersistedMusicState = {
  likedTrackIds: [],
  listenHistory: [],
  mode: 'sequence',
  quality: 'exhigh',
  queue: [],
  visual: defaultVisualSettings,
  volume: 0.82,
};

export function readMusicState(): PersistedMusicState {
  if (typeof window === 'undefined') return defaultPersistedMusicState;

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) ?? '{}',
    ) as Partial<PersistedMusicState>;
    return {
      ...defaultPersistedMusicState,
      ...parsed,
      likedTrackIds: Array.isArray(parsed.likedTrackIds) ? parsed.likedTrackIds : [],
      listenHistory: Array.isArray(parsed.listenHistory) ? parsed.listenHistory.slice(0, 40) : [],
      queue: Array.isArray(parsed.queue) ? parsed.queue.slice(0, 200) : [],
      visual: { ...defaultVisualSettings, ...parsed.visual },
      volume: clamp(parsed.volume ?? defaultPersistedMusicState.volume, 0, 1),
    };
  } catch {
    return defaultPersistedMusicState;
  }
}

export function writeMusicState(state: PersistedMusicState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in privacy mode; playback must continue.
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
