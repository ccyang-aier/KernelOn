'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveAudio } from '../api';
import type { MusicTrack, PlaybackQuality } from '../types';

export interface AudioEngine {
  analyserRef: React.RefObject<AnalyserNode | null>;
  currentTime: number;
  duration: number;
  error: string;
  frequencyDataRef: React.RefObject<Uint8Array<ArrayBuffer> | null>;
  isBuffering: boolean;
  isPlaying: boolean;
  pause(): void;
  play(): Promise<void>;
  playTrack(track: MusicTrack, quality: PlaybackQuality): Promise<void>;
  seek(time: number): void;
  setVolume(volume: number): void;
}

const demoObjectUrls = new Map<string, string>();

export function useAudioEngine(volume: number): AudioEngine {
  const initialVolumeRef = useRef(volume);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.dataset.kernelonMusicAudio = 'true';
    audio.preload = 'auto';
    audio.style.display = 'none';
    audio.volume = initialVolumeRef.current;
    document.body.appendChild(audio);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const markPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const markPaused = () => setIsPlaying(false);
    const markWaiting = () => setIsBuffering(true);
    const markReady = () => setIsBuffering(false);
    const markError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setError('音频加载失败，已保留当前队列，可尝试降低音质或切换歌曲');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('playing', markPlaying);
    audio.addEventListener('pause', markPaused);
    audio.addEventListener('ended', markPaused);
    audio.addEventListener('waiting', markWaiting);
    audio.addEventListener('canplay', markReady);
    audio.addEventListener('error', markError);

    return () => {
      resolveAbortRef.current?.abort();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('playing', markPlaying);
      audio.removeEventListener('pause', markPaused);
      audio.removeEventListener('ended', markPaused);
      audio.removeEventListener('waiting', markWaiting);
      audio.removeEventListener('canplay', markReady);
      audio.removeEventListener('error', markError);
      audio.remove();
      void audioContextRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const ensureAudioGraph = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;

    if (!sourceRef.current) {
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(context.destination);
      sourceRef.current = source;
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    if (context.state === 'suspended') await context.resume();
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio?.src) return;
    setError('');
    await audio.play();
    void ensureAudioGraph().catch(() => undefined);
  }, [ensureAudioGraph]);

  const playTrack = useCallback(
    async (track: MusicTrack, quality: PlaybackQuality) => {
      const audio = audioRef.current;
      if (!audio) return;

      resolveAbortRef.current?.abort();
      const controller = new AbortController();
      resolveAbortRef.current = controller;
      setError('');
      setIsBuffering(true);
      setCurrentTime(0);
      setDuration(track.durationMs / 1000);

      try {
        const audioUrl =
          track.provider === 'demo'
            ? getDemoAudioUrl(track)
            : await resolveWithQualityFallback(track, quality, controller.signal);

        if (controller.signal.aborted) return;
        audio.pause();
        audio.src = audioUrl;
        audio.currentTime = 0;
        await audio.play();
        void ensureAudioGraph().catch(() => undefined);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setIsBuffering(false);
        setIsPlaying(false);
        setError(friendlyAudioError(caught));
      }
    },
    [ensureAudioGraph],
  );

  const pause = useCallback(() => audioRef.current?.pause(), []);
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : time;
    audio.currentTime = Math.min(max, Math.max(0, time));
    setCurrentTime(audio.currentTime);
  }, []);
  const setVolume = useCallback((nextVolume: number) => {
    if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, nextVolume));
  }, []);

  return {
    analyserRef,
    currentTime,
    duration,
    error,
    frequencyDataRef,
    isBuffering,
    isPlaying,
    pause,
    play,
    playTrack,
    seek,
    setVolume,
  };
}

function friendlyAudioError(error: unknown) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return '浏览器已阻止自动播放，请点击播放按钮继续';
  }
  if (error instanceof Error && /play\(\) failed|user didn't interact/i.test(error.message)) {
    return '浏览器已阻止自动播放，请点击播放按钮继续';
  }
  return error instanceof Error ? error.message : '歌曲播放失败';
}

async function resolveWithQualityFallback(
  track: MusicTrack,
  preferred: PlaybackQuality,
  signal: AbortSignal,
) {
  const fallbackOrder: PlaybackQuality[] = [preferred, 'lossless', 'exhigh', 'standard'];
  const qualities = fallbackOrder.filter((quality, index, all) => all.indexOf(quality) === index);
  let lastError: unknown;

  for (const quality of qualities) {
    try {
      return (await resolveAudio(track, quality, signal)).url;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('没有可用音源');
}

function getDemoAudioUrl(track: MusicTrack) {
  const cached = demoObjectUrls.get(track.id);
  if (cached) return cached;

  const duration = Math.max(8, track.durationMs / 1000);
  const sampleRate = 22_050;
  const samples = Math.floor(duration * sampleRate);
  const data = new Int16Array(samples);
  const seed = track.id.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);

  for (let index = 0; index < samples; index += 1) {
    const time = index / sampleRate;
    const beat = Math.exp(-((time % 0.52) * 11)) * Math.sin(time * Math.PI * 2 * 58);
    const pad =
      Math.sin(time * Math.PI * 2 * (110 + (seed % 5) * 7)) * 0.17 +
      Math.sin(time * Math.PI * 2 * (165 + (seed % 7) * 5)) * 0.1;
    const shimmer = Math.sin(time * Math.PI * 2 * 440) * (0.025 + Math.sin(time * 0.8) * 0.012);
    const envelope = Math.min(1, time / 1.2) * Math.min(1, (duration - time) / 1.2);
    data[index] = Math.round(
      Math.max(-1, Math.min(1, (beat * 0.2 + pad + shimmer) * envelope)) * 32767,
    );
  }

  const buffer = encodeWav(data, sampleRate);
  const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  demoObjectUrls.set(track.id, objectUrl);
  return objectUrl;
}

function encodeWav(samples: Int16Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.byteLength);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.byteLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples.byteLength, true);
  new Int16Array(buffer, 44).set(samples);
  return buffer;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
