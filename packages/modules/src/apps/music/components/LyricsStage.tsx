import { useMemo } from 'react';

import type { LyricLine, VisualSettings } from '../types';

interface LyricsStageProps {
  currentTime: number;
  lyrics: LyricLine[];
  visual: VisualSettings;
}

export function LyricsStage({ currentTime, lyrics, visual }: LyricsStageProps) {
  const activeIndex = useMemo(() => {
    let found = -1;
    for (let index = 0; index < lyrics.length; index += 1) {
      if (lyrics[index]!.time <= currentTime) found = index;
      else break;
    }
    return found;
  }, [currentTime, lyrics]);
  const visibleLines = lyrics.slice(
    Math.max(0, activeIndex - 2),
    Math.min(lyrics.length, activeIndex + 4),
  );
  const startIndex = Math.max(0, activeIndex - 2);

  if (!visual.particleLyrics) return null;

  if (!lyrics.length) {
    return <div className="music-lyrics-empty">纯音乐，请欣赏视觉舞台</div>;
  }

  return (
    <div
      aria-live="polite"
      className="music-lyrics-stage"
      style={
        {
          '--music-lyric-color': visual.lyricColor,
          '--music-lyric-glow': visual.lyricGlowColor,
          '--music-lyric-highlight': visual.lyricHighlightColor,
          '--music-lyric-line-height': visual.lyricLineHeight,
          '--music-lyric-offset-x': `${visual.lyricOffsetX}px`,
          '--music-lyric-offset-y': `${visual.lyricOffsetY}px`,
          '--music-lyric-offset-z': `${visual.lyricOffsetZ}px`,
          '--music-lyric-scale': visual.lyricScale,
          '--music-lyric-spacing': `${visual.lyricLetterSpacing}em`,
          '--music-lyric-tilt-x': `${visual.lyricTiltX}deg`,
          '--music-lyric-tilt-y': `${visual.lyricTiltY}deg`,
          '--music-lyric-weight': visual.lyricWeight,
        } as React.CSSProperties
      }
    >
      {visibleLines.map((line, visibleIndex) => {
        const index = startIndex + visibleIndex;
        const active = index === activeIndex;
        const progress = active ? lyricProgress(line, currentTime) : index < activeIndex ? 1 : 0;

        return (
          <div
            className="music-lyric-line"
            data-active={active}
            data-past={index < activeIndex}
            key={`${line.time}:${line.text}`}
          >
            <span className="music-lyric-base">{line.text}</span>
            {active ? (
              <span
                aria-hidden="true"
                className="music-lyric-fill"
                style={{ '--line-progress': `${progress * 100}%` } as React.CSSProperties}
              >
                {line.text}
              </span>
            ) : null}
            {active && line.translated ? <small>{line.translated}</small> : null}
          </div>
        );
      })}
    </div>
  );
}

function lyricProgress(line: LyricLine, currentTime: number) {
  return Math.min(
    1,
    Math.max(
      0,
      (currentTime - line.time) / Math.max(0.2, (line.endTime ?? line.time + 5) - line.time),
    ),
  );
}
