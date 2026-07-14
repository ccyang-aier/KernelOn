import { describe, expect, it, vi } from 'vitest';

import { stopMineradioGestureCapture } from '../src/apps/music/mineradio/runtime/gesture-capture-lifecycle';
import { MineradioGestureStartupLifecycle } from '../src/apps/music/mineradio/runtime/gesture-startup-lifecycle';

describe('Mineradio gesture startup generation', () => {
  it('invalidates a genuinely pending await when the runtime is destroyed', async () => {
    let destroyed = false;
    const lifecycle = new MineradioGestureStartupLifecycle(() => destroyed);
    const token = lifecycle.begin();
    const pending = deferred<void>();
    const continuation = (async () => {
      await pending.promise;
      return token ? lifecycle.isCurrent(token) : false;
    })();

    destroyed = true;
    lifecycle.cancel();
    pending.resolve();

    await expect(continuation).resolves.toBe(false);
    expect(lifecycle.begin()).toBeNull();
  });

  it('prevents concurrent starts and an old finally from finishing its replacement', () => {
    const lifecycle = new MineradioGestureStartupLifecycle(() => false);
    const oldToken = lifecycle.begin();

    expect(oldToken).not.toBeNull();
    expect(lifecycle.begin()).toBeNull();

    lifecycle.cancel();
    const replacementToken = lifecycle.begin();
    expect(replacementToken).not.toBeNull();
    if (!oldToken || !replacementToken) throw new Error('expected startup tokens');

    lifecycle.finish(oldToken);
    expect(lifecycle.isCurrent(replacementToken)).toBe(true);
    expect(lifecycle.isCurrent(oldToken)).toBe(false);
  });

  it('stops a partial Camera and stream while Camera.start is genuinely pending', async () => {
    const lifecycle = new MineradioGestureStartupLifecycle(() => false);
    const token = lifecycle.begin();
    const cameraStarted = deferred<void>();
    const track = { stop: vi.fn() };
    const camera = {
      start: () => cameraStarted.promise,
      stop: vi.fn(),
    };
    const video = {
      remove: vi.fn(),
      srcObject: { getTracks: () => [track] },
    } as unknown as HTMLVideoElement;
    const startup = (async () => {
      await camera.start();
      if (!token || !lifecycle.isCurrent(token)) {
        stopMineradioGestureCapture(camera, video);
        return false;
      }
      return true;
    })();

    lifecycle.cancel();
    stopMineradioGestureCapture(camera, video);
    expect(camera.stop).toHaveBeenCalledOnce();
    expect(track.stop).toHaveBeenCalledOnce();

    cameraStarted.resolve();
    await expect(startup).resolves.toBe(false);
    expect(camera.stop).toHaveBeenCalledTimes(2);
    expect(track.stop).toHaveBeenCalledTimes(2);
  });
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}
