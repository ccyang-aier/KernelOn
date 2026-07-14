// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { createBrowserBeatmapCache } from '../src/apps/music/host/beatmap-cache';

describe('Mineradio browser beatmap cache', () => {
  it('reopens after a lifecycle cleanup instead of remaining closed under StrictMode', async () => {
    const entry = {
      key: 'netease:1',
      map: { beats: [1] },
      meta: { artist: '', mode: 'mr', provider: 'netease', title: 'Mine' },
      savedAt: 1,
      v: 1 as const,
    };
    const databases: FakeDatabase[] = [];
    const factory = {
      open: vi.fn(() => {
        const database = new FakeDatabase(entry);
        databases.push(database);
        return createSuccessfulRequest(database);
      }),
    } as unknown as IDBFactory;
    const cache = createBrowserBeatmapCache(factory);

    await expect(cache.read(entry.key)).resolves.toEqual(entry);
    cache.close();
    await Promise.resolve();
    await expect(cache.read(entry.key)).resolves.toEqual(entry);

    expect(factory.open).toHaveBeenCalledTimes(2);
    expect(databases[0]?.close).toHaveBeenCalledOnce();
    cache.close();
  });
});

class FakeDatabase extends EventTarget {
  readonly close = vi.fn();
  readonly objectStoreNames = { contains: () => true } as unknown as DOMStringList;

  constructor(private readonly entry: unknown) {
    super();
  }

  transaction(): IDBTransaction {
    return {
      objectStore: () => ({
        get: () => createSuccessfulRequest(this.entry),
      }),
    } as unknown as IDBTransaction;
  }
}

function createSuccessfulRequest<TResult>(result: TResult): IDBOpenDBRequest & IDBRequest<TResult> {
  const request = new EventTarget() as IDBOpenDBRequest & IDBRequest<TResult>;
  Object.defineProperties(request, {
    error: { configurable: true, get: () => null },
    result: { configurable: true, get: () => result },
  });
  queueMicrotask(() => request.dispatchEvent(new Event('success')));
  return request;
}
