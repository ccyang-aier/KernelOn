import { describe, expect, it } from 'vitest';

import { normalizeMineradioExportFileName } from '../src/apps/music/host/web-platform-adapter';

describe('Mineradio export filename parity', () => {
  it.each([
    [undefined, 'mineradio-export.json'],
    ['', 'mineradio-export.json'],
    ['archive', 'archive.json'],
    ['ARCHIVE.JSON', 'ARCHIVE.JSON'],
    ['my::music///archive', 'my-music-archive.json'],
    ['   ', '   .json'],
  ])('normalizes %j exactly like the owned Electron source', (input, expected) => {
    expect(normalizeMineradioExportFileName(input)).toBe(expected);
  });
});
