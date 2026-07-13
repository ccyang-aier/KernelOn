import { LoaderCircle, Plus, Search, X } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';

import type { MusicSearchMode, MusicTrack } from '../types';

interface SearchPanelProps {
  error: string;
  isLoading: boolean;
  onAdd(track: MusicTrack): void;
  onClearHistory(): void;
  onPlay(track: MusicTrack): void;
  onQueryChange(query: string): void;
  onSearchModeChange(mode: MusicSearchMode): void;
  onSelectHistory(query: string): void;
  query: string;
  results: MusicTrack[];
  searchMode: MusicSearchMode;
  searchHistory: string[];
}

export function SearchPanel({
  error,
  isLoading,
  onAdd,
  onClearHistory,
  onPlay,
  onQueryChange,
  onSearchModeChange,
  onSelectHistory,
  query,
  results,
  searchMode,
  searchHistory,
}: SearchPanelProps) {
  const [focused, setFocused] = useState(false);
  const deferredResults = useDeferredValue(results);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const showResults =
    focused &&
    (query.trim().length > 0 || results.length > 0 || Boolean(error) || searchHistory.length > 0);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className="music-search-area" data-has-results={showResults} ref={rootRef}>
      <div className="music-search-box">
        <Search aria-hidden="true" />
        <input
          aria-label="搜索歌曲、歌手"
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="搜索歌曲、歌手..."
          spellCheck={false}
          value={query}
        />
        {isLoading ? <LoaderCircle aria-label="正在搜索" className="music-spin" /> : null}
        {query ? (
          <button aria-label="清除搜索" onClick={() => onQueryChange('')} type="button">
            <X />
          </button>
        ) : null}
      </div>
      <div className="music-search-mode-tabs" role="tablist" aria-label="搜索平台">
        {(
          [
            ['all', 'All'],
            ['netease', 'NE'],
            ['qq', 'QQ'],
            ['podcast', 'Podcast'],
          ] as const
        ).map(([mode, label]) => (
          <button
            aria-selected={searchMode === mode}
            className={searchMode === mode ? 'active' : ''}
            key={mode}
            onClick={() => onSearchModeChange(mode)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {showResults ? (
        <div className="music-search-results" role="listbox" aria-label="搜索结果">
          {!query.trim() && searchHistory.length ? (
            <div className="music-search-history">
              <div>
                <span>最近搜索</span>
                <button onClick={onClearHistory} type="button">
                  清除
                </button>
              </div>
              <nav aria-label="最近搜索">
                {searchHistory.map((item) => (
                  <button key={item} onClick={() => onSelectHistory(item)} type="button">
                    {item}
                  </button>
                ))}
              </nav>
            </div>
          ) : null}
          {error ? <div className="music-search-message error">{error}</div> : null}
          {query.trim() && !error && !isLoading && deferredResults.length === 0 ? (
            <div className="music-search-message">没有找到相关歌曲</div>
          ) : null}
          {deferredResults.map((track) => (
            <div
              className="music-search-result"
              key={`${track.provider}:${track.id}`}
              role="option"
              aria-selected="false"
            >
              <button
                className="music-search-result-main"
                onClick={() => onPlay(track)}
                type="button"
              >
                <Cover artwork={track.coverUrl} title={track.title} />
                <span className="music-search-copy">
                  <strong>{track.title}</strong>
                  <span>
                    {track.artist} · {track.album || providerLabel(track.provider)}
                  </span>
                </span>
                <span className="music-source-tag">{providerLabel(track.provider)}</span>
              </button>
              <button
                aria-label={`添加 ${track.title} 到队列`}
                className="music-search-add"
                onClick={() => onAdd(track)}
                type="button"
              >
                <Plus />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Cover({ artwork, title }: Readonly<{ artwork: string; title: string }>) {
  if (artwork) return <img alt="" className="music-cover-image" src={artwork} />;
  return (
    <span aria-hidden="true" className="music-cover-fallback">
      {title.slice(0, 1).toUpperCase()}
    </span>
  );
}

function providerLabel(provider: MusicTrack['provider']) {
  if (provider === 'netease') return 'NE';
  if (provider === 'qq') return 'QQ';
  if (provider === 'podcast') return 'PODCAST';
  if (provider === 'local') return 'LOCAL';
  return 'RADIO';
}
