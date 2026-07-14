// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { createNamespacedStorage } from '../src/apps/music/host/namespaced-storage';

describe('Mineradio namespaced storage', () => {
  it('preserves the Storage API while isolating KernelOn principals', () => {
    const native = window.localStorage;
    native.clear();
    const alice = createNamespacedStorage(native, 'user:alice');
    const bob = createNamespacedStorage(native, 'user:bob');

    alice.setItem('apex-player-volume', '0.4');
    bob.setItem('apex-player-volume', '0.9');

    expect(alice.getItem('apex-player-volume')).toBe('0.4');
    expect(bob.getItem('apex-player-volume')).toBe('0.9');
    expect(alice.length).toBe(1);
    expect(alice.key(0)).toBe('apex-player-volume');

    alice.clear();
    expect(alice.getItem('apex-player-volume')).toBeNull();
    expect(bob.getItem('apex-player-volume')).toBe('0.9');
  });

  it('returns the native storage unchanged when no namespace is configured', () => {
    expect(createNamespacedStorage(window.localStorage)).toBe(window.localStorage);
  });
});
