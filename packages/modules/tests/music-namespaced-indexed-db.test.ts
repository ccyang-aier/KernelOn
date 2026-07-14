import { describe, expect, it, vi } from 'vitest';

import { createNamespacedIndexedDb } from '../src/apps/music/host/namespaced-indexed-db';

describe('Mineradio namespaced IndexedDB', () => {
  it('isolates only the user-owned custom background database', () => {
    const open = vi.fn(() => ({}) as IDBOpenDBRequest);
    const deleteDatabase = vi.fn(() => ({}) as IDBOpenDBRequest);
    const cmp = vi.fn(() => 0);
    const nativeFactory = { cmp, deleteDatabase, open } as unknown as IDBFactory;
    const scopedFactory = createNamespacedIndexedDb(nativeFactory, 'user:alpha@example.com');

    scopedFactory.open('mineradio-custom-background-v1', 1);
    scopedFactory.deleteDatabase('mineradio-custom-background-v1');
    scopedFactory.open('kernelon-mineradio-beatmaps-v1');
    scopedFactory.cmp('a', 'b');

    expect(open).toHaveBeenNthCalledWith(
      1,
      'kernelon:mineradio:user%3Aalpha%40example.com:mineradio-custom-background-v1',
      1,
    );
    expect(deleteDatabase).toHaveBeenCalledWith(
      'kernelon:mineradio:user%3Aalpha%40example.com:mineradio-custom-background-v1',
    );
    expect(open).toHaveBeenNthCalledWith(2, 'kernelon-mineradio-beatmaps-v1');
    expect(cmp).toHaveBeenCalledWith('a', 'b');
  });

  it('preserves the native factory when no principal namespace is available', () => {
    const nativeFactory = {} as IDBFactory;
    expect(createNamespacedIndexedDb(nativeFactory)).toBe(nativeFactory);
  });
});
