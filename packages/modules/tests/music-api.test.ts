import { describe, expect, it } from 'vitest';

import { parseLyrics } from '../src/apps/music/api';
import { visualPresets } from '../src/apps/music/data';

describe('Mineradio lyric parsing', () => {
  it('parses LRC timestamps, translations, and line boundaries', () => {
    const lyrics = parseLyrics(
      '[00:01.20]First line\n[00:04.500]Second line',
      '[00:01.20]第一行\n[00:04.500]第二行',
    );

    expect(lyrics).toEqual([
      { endTime: 4.5, text: 'First line', time: 1.2, translated: '第一行' },
      { endTime: 9.5, text: 'Second line', time: 4.5, translated: '第二行' },
    ]);
  });

  it('parses NetEase karaoke word timing', () => {
    const lyrics = parseLyrics('[1200,2500](1200,900,0)Hello (2100,1600,0)world');

    expect(lyrics).toEqual([
      {
        endTime: 3.7,
        text: 'Hello world',
        time: 1.2,
        translated: undefined,
        words: [
          { duration: 0.9, text: 'Hello ', time: 1.2 },
          { duration: 1.6, text: 'world', time: 2.1 },
        ],
      },
    ]);
  });
});

describe('Mineradio visual presets', () => {
  it('keeps all seven upstream visual modes', () => {
    expect(visualPresets.map((preset) => preset.id).sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
