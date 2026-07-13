'use client';

import { Home, Library, PanelLeft, SlidersHorizontal, Sparkles, Upload } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
} from 'react';

import { AppFrame, type AppFrameProps, type AppWindowSurfaceProps } from '@kernelon/shell';

import { discoverMusic, loadLyrics, loadPlaylist, searchMusic } from './api';
import { defaultVisualSettings, demoPlaylists, demoTracks } from './data';
import { HomeView } from './components/HomeView';
import { LyricsStage } from './components/LyricsStage';
import { ParticleStage } from './components/ParticleStage';
import { PlayerBar } from './components/PlayerBar';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { PlaylistShelf } from './components/PlaylistShelf';
import { SearchPanel } from './components/SearchPanel';
import { VisualConsole } from './components/VisualConsole';
import { useAudioEngine } from './hooks/useAudioEngine';
import { readMusicState, writeMusicState } from './storage';
import { musicStyles } from './styles';
import type {
  LyricLine,
  MusicPlaylist,
  MusicTrack,
  PersistedMusicState,
  PlaybackMode,
  PlaybackQuality,
  VisualSettings,
} from './types';

const musicHeader: AppFrameProps['header'] = {
  center: [{ id: 'music-title', type: 'slot' }],
  density: 'compact',
  identity: { title: '' },
  leading: [{ id: 'music-library', type: 'slot' }],
  mode: 'standard',
  preset: 'editor',
  trailing: [{ id: 'music-visuals', type: 'slot' }],
};

const archiveStorageKey = 'kernelon.music.visual-archives.v1';

export default function MusicWindow(props: AppWindowSurfaceProps) {
  void props;
  const [persisted, setPersisted] = useState<PersistedMusicState>(readMusicState);
  const [discoverSongs, setDiscoverSongs] = useState<MusicTrack[]>(demoTracks);
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>(demoPlaylists);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(true);
  const [discoverError, setDiscoverError] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [showHome, setShowHome] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isVisualConsoleOpen, setIsVisualConsoleOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<MusicPlaylist | null>(null);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [toast, setToast] = useState('');
  const [dropActive, setDropActive] = useState(false);
  const localFileInputRef = useRef<HTMLInputElement | null>(null);
  const archiveInputRef = useRef<HTMLInputElement | null>(null);
  const endedHandledRef = useRef(false);
  const currentTrack = persisted.queue[currentIndex] ?? null;
  const likedTrackIds = useMemo(() => new Set(persisted.likedTrackIds), [persisted.likedTrackIds]);
  const audio = useAudioEngine(persisted.volume);

  const setPersistedField = useCallback(
    <Key extends keyof PersistedMusicState>(key: Key, value: PersistedMusicState[Key]) => {
      setPersisted((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  useEffect(() => {
    const persistable = {
      ...persisted,
      listenHistory: persisted.listenHistory.filter((track) => track.provider !== 'local'),
      queue: persisted.queue.filter((track) => track.provider !== 'local'),
    };
    writeMusicState(persistable);
  }, [persisted]);

  useEffect(() => {
    const controller = new AbortController();
    discoverMusic(controller.signal)
      .then((payload) => {
        if (payload.songs.length) setDiscoverSongs(payload.songs);
        if (payload.playlists.length) setPlaylists(payload.playlists);
        setDiscoverError('');
      })
      .catch((error: unknown) => {
        setDiscoverError(error instanceof Error ? error.message : '在线推荐暂时不可用');
      })
      .finally(() => setIsDiscoverLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) {
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      searchMusic(normalized, controller.signal)
        .then((songs) => {
          const localMatches = demoTracks.filter((track) =>
            `${track.title} ${track.artist}`.toLowerCase().includes(normalized.toLowerCase()),
          );
          setSearchResults([
            ...songs,
            ...localMatches.filter((local) => !songs.some((song) => song.id === local.id)),
          ]);
          setSearchError('');
        })
        .catch((error: unknown) => {
          const localMatches = demoTracks.filter((track) =>
            `${track.title} ${track.artist}`.toLowerCase().includes(normalized.toLowerCase()),
          );
          setSearchResults(localMatches);
          setSearchError(
            localMatches.length ? '' : error instanceof Error ? error.message : '搜索失败',
          );
        })
        .finally(() => setIsSearching(false));
    }, 320);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const playTrack = useCallback(
    async (track: MusicTrack) => {
      let targetIndex = persisted.queue.findIndex(
        (item) => item.id === track.id && item.provider === track.provider,
      );
      let nextQueue = persisted.queue;
      if (targetIndex < 0) {
        nextQueue = [...persisted.queue, track];
        targetIndex = nextQueue.length - 1;
        setPersistedField('queue', nextQueue);
      }
      setCurrentIndex(targetIndex);
      setShowHome(false);
      endedHandledRef.current = false;
      setLyrics(track.lyrics ?? []);
      setPersisted((current) => ({
        ...current,
        listenHistory: [
          track,
          ...current.listenHistory.filter((item) => item.id !== track.id),
        ].slice(0, 40),
      }));

      const lyricController = new AbortController();
      if (track.provider !== 'local') {
        void loadLyrics(track, lyricController.signal)
          .then(setLyrics)
          .catch(() => setLyrics(track.lyrics ?? []));
      }
      await audio.playTrack(track, persisted.quality);
    },
    [audio, persisted.quality, persisted.queue, setPersistedField],
  );

  const nextTrack = useCallback(() => {
    const queue = persisted.queue;
    if (!queue.length) return;
    const nextIndex = resolveNextIndex(currentIndex, queue.length, persisted.mode, 1);
    const track = queue[nextIndex];
    if (track) void playTrack(track);
  }, [currentIndex, persisted.mode, persisted.queue, playTrack]);

  const previousTrack = useCallback(() => {
    const queue = persisted.queue;
    if (!queue.length) return;
    if (audio.currentTime > 4) {
      audio.seek(0);
      return;
    }
    const nextIndex = resolveNextIndex(currentIndex, queue.length, persisted.mode, -1);
    const track = queue[nextIndex];
    if (track) void playTrack(track);
  }, [audio, currentIndex, persisted.mode, persisted.queue, playTrack]);

  useEffect(() => {
    if (!currentTrack || audio.duration <= 0 || audio.currentTime < audio.duration - 0.22) {
      if (audio.currentTime < audio.duration - 1) endedHandledRef.current = false;
      return;
    }
    if (endedHandledRef.current) return;
    endedHandledRef.current = true;
    queueMicrotask(() => {
      if (persisted.mode === 'loop-one') void playTrack(currentTrack);
      else nextTrack();
    });
  }, [audio.currentTime, audio.duration, currentTrack, nextTrack, persisted.mode, playTrack]);

  const updateQuery = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    if (!nextQuery.trim()) {
      setSearchResults([]);
      setSearchError('');
      setIsSearching(false);
    }
  }, []);

  const focusSearch = useCallback(() => {
    updateQuery('');
    requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>('.music-search-box input')?.focus(),
    );
  }, [updateQuery]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      void playTrack(discoverSongs[0] ?? demoTracks[0]!);
      return;
    }
    if (audio.isPlaying) audio.pause();
    else void audio.play().catch(() => audio.playTrack(currentTrack, persisted.quality));
  }, [audio, currentTrack, discoverSongs, persisted.quality, playTrack]);

  const addToQueue = useCallback((track: MusicTrack) => {
    setPersisted((current) => ({ ...current, queue: [...current.queue, track] }));
    showToastMessage(`已添加到队列 · ${track.title}`, setToast);
  }, []);

  const openPlaylist = useCallback(
    async (playlist: MusicPlaylist) => {
      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
        return;
      }
      setIsLibraryOpen(true);
      setSelectedPlaylist(playlist);
      if (playlist.songs?.length) return;
      setIsPlaylistLoading(true);
      try {
        const loaded = await loadPlaylist(playlist.id);
        setPlaylists((current) => current.map((item) => (item.id === loaded.id ? loaded : item)));
        setSelectedPlaylist(loaded);
      } catch (error) {
        showToastMessage(error instanceof Error ? error.message : '歌单加载失败', setToast);
      } finally {
        setIsPlaylistLoading(false);
      }
    },
    [selectedPlaylist?.id],
  );

  const playPlaylist = useCallback(
    async (playlist: MusicPlaylist) => {
      let loaded = playlist;
      if (!loaded.songs?.length) {
        try {
          loaded = await loadPlaylist(playlist.id);
        } catch (error) {
          showToastMessage(error instanceof Error ? error.message : '歌单加载失败', setToast);
          return;
        }
      }
      const songs = loaded.songs ?? [];
      if (!songs.length) return;
      const firstTrack = songs[0]!;
      setPersisted((current) => ({
        ...current,
        listenHistory: [
          firstTrack,
          ...current.listenHistory.filter((item) => item.id !== firstTrack.id),
        ].slice(0, 40),
        queue: songs,
      }));
      setCurrentIndex(0);
      setShowHome(false);
      setLyrics(firstTrack.lyrics ?? []);
      if (firstTrack.provider !== 'local') {
        void loadLyrics(firstTrack)
          .then(setLyrics)
          .catch(() => setLyrics(firstTrack.lyrics ?? []));
      }
      void audio.playTrack(firstTrack, persisted.quality);
    },
    [audio, persisted.quality],
  );

  const removeTrack = useCallback((index: number) => {
    setPersisted((current) => ({
      ...current,
      queue: current.queue.filter((_, itemIndex) => itemIndex !== index),
    }));
    setCurrentIndex((current) =>
      index < current ? current - 1 : index === current ? -1 : current,
    );
  }, []);

  const cycleMode = useCallback(() => {
    setPersisted((current) => ({ ...current, mode: nextPlaybackMode(current.mode) }));
  }, []);

  const toggleLike = useCallback(() => {
    if (!currentTrack) return;
    setPersisted((current) => {
      const liked = new Set(current.likedTrackIds);
      if (liked.has(currentTrack.id)) liked.delete(currentTrack.id);
      else liked.add(currentTrack.id);
      return { ...current, likedTrackIds: Array.from(liked) };
    });
  }, [currentTrack]);

  const setVisual = useCallback(
    (visual: VisualSettings) => setPersistedField('visual', visual),
    [setPersistedField],
  );
  const resetVisual = useCallback(() => setVisual(defaultVisualSettings), [setVisual]);

  const importLocalFiles = useCallback(
    (files: FileList | File[]) => {
      const tracks = Array.from(files)
        .filter(
          (file) => file.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg)$/i.test(file.name),
        )
        .map((file, index) => ({
          album: '本地音乐',
          artist: '本地文件',
          audioUrl: URL.createObjectURL(file),
          coverUrl: '',
          durationMs: 0,
          id: `local-${file.name}-${file.lastModified}-${index}`,
          provider: 'local' as const,
          title: file.name.replace(/\.[^.]+$/, ''),
        }));
      if (!tracks.length) return;
      setPersisted((current) => ({ ...current, queue: [...current.queue, ...tracks] }));
      void playTrack(tracks[0]!);
      showToastMessage(`已导入 ${tracks.length} 首本地音乐`, setToast);
    },
    [playTrack],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      } else if (event.code === 'ArrowRight' && event.ctrlKey) nextTrack();
      else if (event.code === 'ArrowLeft' && event.ctrlKey) previousTrack();
      else if (event.code === 'ArrowRight') audio.seek(audio.currentTime + 5);
      else if (event.code === 'ArrowLeft') audio.seek(audio.currentTime - 5);
      else if (event.key.toLowerCase() === 'q') setIsLibraryOpen((value) => !value);
      else if (event.key.toLowerCase() === 'v') setIsVisualConsoleOpen((value) => !value);
      else if (event.key.toLowerCase() === 'f') setImmersive((value) => !value);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audio, nextTrack, previousTrack, togglePlay]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      album: currentTrack.album,
      artist: currentTrack.artist,
      title: currentTrack.title,
    });
    navigator.mediaSession.setActionHandler('play', () => void audio.play());
    navigator.mediaSession.setActionHandler('pause', audio.pause);
    navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    navigator.mediaSession.setActionHandler('previoustrack', previousTrack);
  }, [audio, currentTrack, nextTrack, previousTrack]);

  const headerSlots = useMemo(
    () => ({
      'music-library': (
        <button
          aria-label="打开音乐资料库"
          className="music-header-control"
          onClick={() => setIsLibraryOpen((value) => !value)}
          type="button"
        >
          <PanelLeft />
          <span>资料库</span>
        </button>
      ),
      'music-title': (
        <div className="music-header-title">
          <strong>
            Mine<span>radio</span>
          </strong>
          <small>PRIVATE VISUAL RADIO</small>
        </div>
      ),
      'music-visuals': (
        <button
          aria-label="打开视觉控制台"
          className="music-header-control"
          onClick={() => setIsVisualConsoleOpen((value) => !value)}
          type="button"
        >
          <SlidersHorizontal />
          <span>视觉控制台</span>
        </button>
      ),
    }),
    [],
  );

  const rootStyle = {
    '--music-accent': persisted.visual.uiAccentColor,
    '--music-bg': persisted.visual.backgroundColor,
    '--music-bg-opacity': persisted.visual.backgroundOpacity,
    '--music-glass-aberration': persisted.visual.controlGlassChromaticOffset,
    '--music-tint': persisted.visual.visualTintColor,
  } as CSSProperties;

  const exportArchive = useCallback(() => {
    const blob = new Blob(
      [
        JSON.stringify(
          { exportedAt: Date.now(), name: 'KernelOn Mineradio', visual: persisted.visual },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mineradio-visual-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [persisted.visual]);

  const saveArchive = useCallback(() => {
    const archives = readVisualArchives();
    archives.unshift({
      name: `视觉存档 ${archives.length + 1}`,
      savedAt: Date.now(),
      visual: persisted.visual,
    });
    localStorage.setItem(archiveStorageKey, JSON.stringify(archives.slice(0, 12)));
    showToastMessage('当前视觉参数已保存', setToast);
  }, [persisted.visual]);

  const importArchive = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        const payload = JSON.parse(await file.text()) as { visual?: Partial<VisualSettings> };
        setVisual({ ...defaultVisualSettings, ...payload.visual });
        showToastMessage('视觉存档已导入', setToast);
      } catch {
        showToastMessage('视觉存档格式无效', setToast);
      }
    },
    [setVisual],
  );

  return (
    <AppFrame
      className="music-frame"
      contentClassName="!bg-black"
      header={musicHeader}
      headerSlots={headerSlots}
      scroll="hidden"
      style={
        {
          '--ko-app-header-border': 'rgba(255,255,255,.075)',
          '--ko-app-header-ink': 'rgba(245,250,252,.82)',
          '--ko-app-header-ink-muted': 'rgba(224,238,242,.42)',
          '--ko-app-header-surface': 'rgba(3,5,7,.92)',
          '--ko-app-header-surface-muted': 'rgba(3,5,7,.8)',
          '--ko-app-header-surface-strong': 'rgba(5,8,11,.96)',
        } as CSSProperties
      }
    >
      <style>{musicStyles}</style>
      <main
        className="music-app"
        data-drop-active={dropActive}
        data-home={showHome}
        data-immersive={immersive}
        onDragEnter={(event: DragEvent) => {
          event.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={(event: DragEvent) => {
          if (event.currentTarget === event.target) setDropActive(false);
        }}
        onDragOver={(event: DragEvent) => event.preventDefault()}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          setDropActive(false);
          importLocalFiles(event.dataTransfer.files);
        }}
        style={rootStyle}
      >
        <ParticleStage
          analyserRef={audio.analyserRef}
          frequencyDataRef={audio.frequencyDataRef}
          isPlaying={audio.isPlaying}
          track={currentTrack}
          visual={persisted.visual}
        />
        <div className="music-background-vignette" />
        <SearchPanel
          error={searchError}
          isLoading={isSearching}
          onAdd={addToQueue}
          onPlay={playTrack}
          onQueryChange={updateQuery}
          query={query}
          results={searchResults}
        />
        <div className="music-top-actions">
          <button aria-label="回到 Home" onClick={() => setShowHome(true)} type="button">
            <Home />
          </button>
          <button
            aria-label="打开歌单"
            onClick={() => setIsLibraryOpen((value) => !value)}
            type="button"
          >
            <Library />
          </button>
          <button
            aria-label="视觉控制台"
            onClick={() => setIsVisualConsoleOpen((value) => !value)}
            type="button"
          >
            <Sparkles />
          </button>
        </div>

        {showHome ? (
          <HomeView
            history={persisted.listenHistory}
            isLoading={isDiscoverLoading}
            onImport={() => localFileInputRef.current?.click()}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenVisuals={() => setIsVisualConsoleOpen(true)}
            onPlay={playTrack}
            onPlayPlaylist={playPlaylist}
            onSearch={focusSearch}
            playlists={playlists}
            songs={discoverSongs}
          />
        ) : (
          <section aria-label="音乐视觉舞台" className="music-stage-content">
            <div className="music-now-meta">
              <span>{currentTrack?.album || 'PRIVATE VISUAL RADIO'}</span>
              <strong>{currentTrack?.title}</strong>
              <small>{currentTrack?.artist}</small>
            </div>
            <LyricsStage
              currentTime={audio.currentTime}
              lyrics={lyrics}
              visual={persisted.visual}
            />
            <PlaylistShelf
              isPlaying={audio.isPlaying}
              onOpen={playPlaylist}
              playlists={playlists}
              visual={persisted.visual}
            />
          </section>
        )}

        <PlaylistDrawer
          activeTrackId={currentTrack?.id}
          history={persisted.listenHistory}
          isLoadingPlaylist={isPlaylistLoading}
          isOpen={isLibraryOpen}
          isPlaying={audio.isPlaying}
          likedTrackIds={likedTrackIds}
          mode={persisted.mode}
          onClearQueue={() => {
            audio.pause();
            setPersistedField('queue', []);
            setCurrentIndex(-1);
          }}
          onClose={() => setIsLibraryOpen(false)}
          onOpenPlaylist={openPlaylist}
          onPlayTrack={playTrack}
          onRemoveTrack={removeTrack}
          onSelectMode={cycleMode}
          playlists={playlists}
          queue={persisted.queue}
          selectedPlaylist={selectedPlaylist}
        />
        <VisualConsole
          isOpen={isVisualConsoleOpen}
          onChange={setVisual}
          onClose={() => setIsVisualConsoleOpen(false)}
          onExport={exportArchive}
          onImport={() => archiveInputRef.current?.click()}
          onReset={resetVisual}
          onSaveArchive={saveArchive}
          visual={persisted.visual}
        />

        <PlayerBar
          currentTime={audio.currentTime}
          duration={audio.duration || (currentTrack?.durationMs ?? 0) / 1000}
          immersive={immersive}
          isLiked={currentTrack ? likedTrackIds.has(currentTrack.id) : false}
          isLoading={audio.isBuffering}
          isPlaying={audio.isPlaying}
          mode={persisted.mode}
          onCycleMode={cycleMode}
          onNext={nextTrack}
          onOpenQueue={() => setIsLibraryOpen(true)}
          onPrevious={previousTrack}
          onQualityChange={(quality: PlaybackQuality) => setPersistedField('quality', quality)}
          onSeek={audio.seek}
          onToggleImmersive={() => setImmersive((value) => !value)}
          onToggleLike={toggleLike}
          onTogglePlay={togglePlay}
          onVolumeChange={(volume) => setPersistedField('volume', volume)}
          quality={persisted.quality}
          queueLength={persisted.queue.length}
          track={currentTrack}
          volume={persisted.volume}
        />

        {audio.error || discoverError ? (
          <div className="music-source-notice">{audio.error || discoverError}</div>
        ) : null}
        {toast ? (
          <div className="music-toast" role="status">
            {toast}
          </div>
        ) : null}
        {dropActive ? (
          <div className="music-drop-overlay">
            <Upload />
            <strong>释放以导入本地音乐</strong>
            <span>MP3 · WAV · FLAC · M4A · OGG</span>
          </div>
        ) : null}
        <input
          accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
          hidden
          multiple
          onChange={(event) => event.target.files && importLocalFiles(event.target.files)}
          ref={localFileInputRef}
          type="file"
        />
        <input
          accept="application/json,.json"
          hidden
          onChange={importArchive}
          ref={archiveInputRef}
          type="file"
        />
      </main>
    </AppFrame>
  );
}

function resolveNextIndex(current: number, length: number, mode: PlaybackMode, direction: 1 | -1) {
  if (length <= 1) return 0;
  if (mode === 'shuffle') {
    let next = current;
    while (next === current) next = Math.floor(Math.random() * length);
    return next;
  }
  return (Math.max(0, current) + direction + length) % length;
}

function nextPlaybackMode(mode: PlaybackMode): PlaybackMode {
  if (mode === 'sequence') return 'loop-one';
  if (mode === 'loop-one') return 'shuffle';
  return 'sequence';
}

function showToastMessage(message: string, setToast: (message: string) => void) {
  setToast(message);
  window.setTimeout(() => setToast(''), 2400);
}

function readVisualArchives(): Array<{ name: string; savedAt: number; visual: VisualSettings }> {
  try {
    const parsed = JSON.parse(localStorage.getItem(archiveStorageKey) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
