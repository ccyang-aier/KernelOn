// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

import type { MineradioHost } from '../src/apps/music/host/contract';
import { isMineradioLifecycleAbort } from '../src/apps/music/mineradio/runtime/lifecycle-abort';
import { MineradioResourceRegistry } from '../src/apps/music/mineradio/runtime/resource-registry';
import { createScopedMineradioEnvironment } from '../src/apps/music/mineradio/runtime/scoped-browser-environment';

const originalWindowConstructors = new Map<string, PropertyDescriptor | undefined>();
const originalGlobalConstructors = new Map<string, PropertyDescriptor | undefined>();

class FakeResizeObserver {
  static readonly instances: FakeResizeObserver[] = [];
  readonly originalDisconnect = vi.fn();
  readonly disconnect = this.originalDisconnect;
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();

  constructor(_callback: ResizeObserverCallback) {
    void _callback;
    FakeResizeObserver.instances.push(this);
  }
}

class FakeMutationObserver {
  static readonly instances: FakeMutationObserver[] = [];
  readonly originalDisconnect = vi.fn();
  readonly disconnect = this.originalDisconnect;
  readonly observe = vi.fn();
  readonly takeRecords = vi.fn(() => [] as MutationRecord[]);

  constructor(_callback: MutationCallback) {
    void _callback;
    FakeMutationObserver.instances.push(this);
  }
}

class FakePerformanceObserver {
  static readonly instances: FakePerformanceObserver[] = [];
  readonly originalDisconnect = vi.fn();
  readonly disconnect = this.originalDisconnect;
  readonly observe = vi.fn();
  readonly takeRecords = vi.fn(() => [] as PerformanceEntryList);

  constructor(_callback: PerformanceObserverCallback) {
    void _callback;
    FakePerformanceObserver.instances.push(this);
  }
}

class FakeWorker {
  readonly terminate = vi.fn();

  constructor(_url: string | URL) {
    void _url;
  }
}

beforeEach(() => {
  installConstructor('ResizeObserver', FakeResizeObserver);
  installConstructor('MutationObserver', FakeMutationObserver);
  installConstructor('PerformanceObserver', FakePerformanceObserver);
  installConstructor('Worker', FakeWorker);
  FakeResizeObserver.instances.length = 0;
  FakeMutationObserver.instances.length = 0;
  FakePerformanceObserver.instances.length = 0;
});

afterEach(() => {
  restoreConstructors();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('MineradioResourceRegistry', () => {
  it('releases listeners, timers, animation work, workers, audio, URLs, observers and cleanup tasks', () => {
    vi.useFakeTimers();
    const registry = new MineradioResourceRegistry();
    const target = new EventTarget();
    const listener = vi.fn();
    const timeoutCallback = vi.fn();
    const intervalCallback = vi.fn();
    const animationCallback = vi.fn();
    const idleCallback = vi.fn();
    const animationCallbacks = new Map<number, FrameRequestCallback>();
    let nextAnimationHandle = 1;
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        const handle = nextAnimationHandle;
        nextAnimationHandle += 1;
        animationCallbacks.set(handle, callback);
        return handle;
      });
    const cancelAnimationFrame = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((handle) => {
        animationCallbacks.delete(handle);
      });
    const terminateWorker = vi.fn();
    const worker = { terminate: terminateWorker } as unknown as Worker;
    const abortController = new AbortController();
    const killAnimation = vi.fn();
    const animation = { kill: killAnimation };
    const audio = {
      load: vi.fn(),
      pause: vi.fn(),
      removeAttribute: vi.fn(),
    } as unknown as HTMLAudioElement;
    const closeAudioContext = vi.fn(async () => undefined);
    const audioContext = {
      close: closeAudioContext,
      state: 'running',
    } as unknown as BaseAudioContext;
    const disconnectObserver = vi.fn();
    const observer = { disconnect: disconnectObserver };
    const disposeResource = vi.fn();
    const forceContextLoss = vi.fn();
    const disposable = { dispose: disposeResource, forceContextLoss };
    const cleanupAfterFailure = vi.fn();
    const revokeObjectUrl = vi.fn();
    const previousRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });

    try {
      registry.addEventListener(target, 'change', listener);
      registry.setTimeout(timeoutCallback, 10);
      registry.setInterval(intervalCallback, 10);
      registry.requestAnimationFrame(animationCallback);
      registry.requestIdleCallback(idleCallback);
      registry.trackWorker(worker);
      registry.trackAbortController(abortController);
      registry.trackAnimation(animation);
      registry.trackAudioElement(audio);
      registry.trackAudioContext(audioContext);
      registry.trackObjectUrl('blob:tracked');
      registry.trackObserver(observer);
      registry.trackDisposable(disposable);
      registry.addCleanup(cleanupAfterFailure);
      registry.addCleanup(() => {
        throw new Error('cleanup failure');
      });

      registry.destroy();
      registry.destroy();
      vi.runAllTimers();
      target.dispatchEvent(new Event('change'));
      for (const callback of animationCallbacks.values()) callback(16);

      expect(registry.destroyed).toBe(true);
      expect(listener).not.toHaveBeenCalled();
      expect(timeoutCallback).not.toHaveBeenCalled();
      expect(intervalCallback).not.toHaveBeenCalled();
      expect(animationCallback).not.toHaveBeenCalled();
      expect(idleCallback).not.toHaveBeenCalled();
      expect(requestAnimationFrame).toHaveBeenCalledOnce();
      expect(cancelAnimationFrame).toHaveBeenCalledOnce();
      expect(terminateWorker).toHaveBeenCalledOnce();
      expect(abortController.signal.aborted).toBe(true);
      expect(isMineradioLifecycleAbort(abortController.signal.reason)).toBe(true);
      expect(killAnimation).toHaveBeenCalledOnce();
      expect(audio.pause).toHaveBeenCalledOnce();
      expect(audio.removeAttribute).toHaveBeenCalledWith('src');
      expect(audio.load).toHaveBeenCalledOnce();
      expect(closeAudioContext).toHaveBeenCalledOnce();
      expect(disconnectObserver).toHaveBeenCalledOnce();
      expect(disposeResource).toHaveBeenCalledOnce();
      expect(forceContextLoss).toHaveBeenCalledOnce();
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:tracked');
      expect(cleanupAfterFailure).toHaveBeenCalledOnce();
    } finally {
      restoreProperty(URL, 'revokeObjectURL', previousRevokeObjectUrl);
    }
  });

  it('releases completed or explicitly disposed resources during a keep-alive session', () => {
    const registry = new MineradioResourceRegistry();
    const callbacks = new Map<string, ((...args: unknown[]) => void) | null>();
    const existingComplete = vi.fn();
    const originalKill = vi.fn();
    callbacks.set('onComplete', existingComplete);
    const animation = {
      eventCallback(type: string, callback?: ((...args: unknown[]) => void) | null) {
        if (callback === undefined) return callbacks.get(type);
        callbacks.set(type, callback);
        return callback;
      },
      isActive: () => true,
      kill: originalKill,
      totalProgress: () => 0,
    };
    const dispose = vi.fn();
    const disposable = { dispose };
    const terminate = vi.fn();
    const worker = { terminate } as unknown as Worker;
    const disconnect = vi.fn();
    const observer = { disconnect };

    registry.trackAnimation(animation);
    registry.trackDisposable(disposable);
    registry.trackWorker(worker);
    registry.trackObserver(observer);

    expect(registry.trackedResourceCounts).toEqual({
      animations: 1,
      disposables: 1,
      observers: 1,
      workers: 1,
    });

    callbacks.get('onComplete')?.('finished');
    disposable.dispose();
    worker.terminate();
    observer.disconnect();

    expect(existingComplete).toHaveBeenCalledWith('finished');
    expect(registry.trackedResourceCounts).toEqual({
      animations: 0,
      disposables: 0,
      observers: 0,
      workers: 0,
    });

    registry.destroy();
    expect(dispose).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(originalKill).not.toHaveBeenCalled();
  });
});

describe('createScopedMineradioEnvironment', () => {
  it('wraps Three.js constructors through a mutable facade instead of the module namespace', () => {
    const fixture = createEnvironmentFixture();
    const descriptor = Object.getOwnPropertyDescriptor(
      fixture.environment.THREE,
      'WebGLRenderer',
    );
    const ScopedWebGLRenderer = fixture.environment.THREE.WebGLRenderer;

    expect(descriptor).toMatchObject({ configurable: true, writable: true });
    expect(ScopedWebGLRenderer).not.toBe(THREE.WebGLRenderer);
    expect(Object.getPrototypeOf(ScopedWebGLRenderer)).toBe(THREE.WebGLRenderer);
    expect(ScopedWebGLRenderer.prototype).toBe(THREE.WebGLRenderer.prototype);
    expect(fixture.environment.THREE.Vector3).toBe(THREE.Vector3);

    fixture.environment.abort();
  });

  it('rolls back all pre-finalize resources when runtime mounting aborts', () => {
    const namespaceName = '__kernelonMineradioActions';
    const scopedDocumentName = '__mineradioDocument';
    const previousNamespace = Object.getOwnPropertyDescriptor(window, namespaceName);
    const previousScopedDocument = Object.getOwnPropertyDescriptor(window, scopedDocumentName);
    const fixture = createEnvironmentFixture();
    const resizeListener = vi.fn();

    fixture.environment.window.addEventListener('resize', resizeListener);
    fixture.environment.registerInlineActions({ abortedAction: vi.fn() });
    expect(fixture.environment.isDestroyed()).toBe(false);
    expect(Object.hasOwn(window, namespaceName)).toBe(true);
    expect(Object.hasOwn(window, scopedDocumentName)).toBe(true);
    expect(
      (fixture.environment.window as unknown as Record<string, unknown>)[scopedDocumentName],
    ).toBe(fixture.environment.document);

    fixture.environment.abort();
    fixture.environment.abort();

    expect(fixture.environment.isDestroyed()).toBe(true);
    expect(Object.getOwnPropertyDescriptor(window, namespaceName)).toEqual(previousNamespace);
    expect(Object.getOwnPropertyDescriptor(window, scopedDocumentName)).toEqual(
      previousScopedDocument,
    );
    expect(
      (fixture.environment.window as unknown as Record<string, unknown>)[scopedDocumentName],
    ).toBe(fixture.environment.document);
    expect(() => fixture.environment.finalize(vi.fn())).toThrow(
      'Mineradio runtime environment can only be finalized once',
    );
  });

  it('runs mount-only cleanup on abort but retires it after successful finalization', () => {
    const abortedFixture = createEnvironmentFixture();
    const abortCleanup = vi.fn();
    abortedFixture.environment.registerMountAbortCleanup(abortCleanup);

    abortedFixture.environment.abort();
    abortedFixture.environment.abort();
    expect(abortCleanup).toHaveBeenCalledOnce();

    const finalizedFixture = createEnvironmentFixture();
    const finalizedCleanup = vi.fn();
    finalizedFixture.environment.registerMountAbortCleanup(finalizedCleanup);
    const runtime = finalizedFixture.environment.finalize(vi.fn());
    runtime.destroy();

    expect(finalizedCleanup).not.toHaveBeenCalled();
  });

  it('dispatches DOMContentLoaded exactly once and never replays it for late listeners', async () => {
    const fixture = createEnvironmentFixture();
    const earlyListener = vi.fn();
    const lateListener = vi.fn();

    fixture.environment.document.addEventListener('DOMContentLoaded', earlyListener);
    const runtime = fixture.environment.finalize(vi.fn());
    fixture.environment.document.addEventListener('DOMContentLoaded', lateListener);
    await Promise.resolve();

    expect(earlyListener).toHaveBeenCalledOnce();
    expect(lateListener).not.toHaveBeenCalled();
    expect(() => fixture.environment.finalize(vi.fn())).toThrow(
      'Mineradio runtime environment can only be finalized once',
    );
    expect(earlyListener).toHaveBeenCalledOnce();

    runtime.destroy();
  });

  it('restores inline action descriptors and still releases resources when ported cleanup throws', () => {
    const fixture = createEnvironmentFixture();
    const actionName = '__kernelonMineradioLifecycleAction';
    const addedActionName = '__kernelonMineradioAddedLifecycleAction';
    const namespaceName = '__kernelonMineradioActions';
    const previousAction = vi.fn();
    const portedAction = vi.fn();
    const previousNamespace = { existing: vi.fn() };
    const previousDescriptor = Object.getOwnPropertyDescriptor(window, actionName);
    const previousNamespaceDescriptor = Object.getOwnPropertyDescriptor(window, namespaceName);

    Object.defineProperty(window, actionName, {
      configurable: true,
      enumerable: false,
      value: previousAction,
      writable: false,
    });
    Object.defineProperty(window, namespaceName, {
      configurable: true,
      value: previousNamespace,
      writable: false,
    });

    try {
      fixture.environment.registerInlineActions({
        [actionName]: portedAction,
        [addedActionName]: vi.fn(),
      });
      const installedActions = (window as unknown as Record<string, unknown>)[namespaceName] as
        Record<string, (...args: unknown[]) => unknown> | undefined;
      installedActions?.[actionName]?.('value');
      expect(portedAction).toHaveBeenCalledWith('value');
      expect((window as unknown as Record<string, unknown>)[actionName]).toBe(previousAction);
      expect(Object.hasOwn(window, addedActionName)).toBe(false);

      const runtime = fixture.environment.finalize(() => {
        throw new Error('ported cleanup failed');
      });

      expect(() => runtime.destroy()).toThrow('ported cleanup failed');
      expect((window as unknown as Record<string, unknown>)[actionName]).toBe(previousAction);
      expect((window as unknown as Record<string, unknown>)[namespaceName]).toBe(previousNamespace);
      expect(Object.getOwnPropertyDescriptor(window, actionName)?.writable).toBe(false);
      expect(Object.hasOwn(window, addedActionName)).toBe(false);
      expect(
        FakeResizeObserver.instances.every(
          (observer) => observer.originalDisconnect.mock.calls.length > 0,
        ),
      ).toBe(true);
      expect(
        FakeMutationObserver.instances.every(
          (observer) => observer.originalDisconnect.mock.calls.length > 0,
        ),
      ).toBe(true);
    } finally {
      restoreProperty(window, actionName, previousDescriptor);
      restoreProperty(window, namespaceName, previousNamespaceDescriptor);
      Reflect.deleteProperty(window, addedActionName);
    }
  });

  it('contains minimized visibility changes and disconnects runtime-created observer constructors', () => {
    const fixture = createEnvironmentFixture();
    const localVisibilityListener = vi.fn();
    const nativeVisibilityListener = vi.fn();
    const resizeListener = vi.fn();
    const runtimeResizeObserver = new fixture.environment.window.ResizeObserver(
      () => undefined,
    ) as unknown as FakeResizeObserver;
    const runtimeMutationObserver = new fixture.environment.window.MutationObserver(
      () => undefined,
    ) as unknown as FakeMutationObserver;
    const runtimePerformanceObserver = new fixture.environment.window.PerformanceObserver(
      () => undefined,
    ) as unknown as FakePerformanceObserver;

    fixture.environment.document.addEventListener('visibilitychange', localVisibilityListener);
    fixture.environment.window.addEventListener('resize', resizeListener);
    document.addEventListener('visibilitychange', nativeVisibilityListener);
    const runtime = fixture.environment.finalize(vi.fn());

    expect(window.ResizeObserver).toBe(FakeResizeObserver);
    expect(window.MutationObserver).toBe(FakeMutationObserver);
    expect(window.PerformanceObserver).toBe(FakePerformanceObserver);

    runtime.setVisibility(false);
    runtime.setVisibility(false);
    expect(fixture.environment.document.hidden).toBe(true);
    expect(fixture.environment.document.visibilityState).toBe('hidden');
    expect(localVisibilityListener).toHaveBeenCalledOnce();
    expect(nativeVisibilityListener).not.toHaveBeenCalled();
    expect(resizeListener).toHaveBeenCalledOnce();

    runtime.setVisibility(true);
    expect(localVisibilityListener).toHaveBeenCalledTimes(2);
    expect(resizeListener).toHaveBeenCalledTimes(2);
    runtime.destroy();

    expect(runtimeResizeObserver.originalDisconnect).toHaveBeenCalled();
    expect(runtimeMutationObserver.originalDisconnect).toHaveBeenCalled();
    expect(runtimePerformanceObserver.originalDisconnect).toHaveBeenCalled();
    document.removeEventListener('visibilitychange', nativeVisibilityListener);
  });

  it('aborts an outstanding host request when the runtime is destroyed', () => {
    const fixture = createEnvironmentFixture();
    const requestSignals: AbortSignal[] = [];

    fixture.host.fetch.mockImplementation((_input, init) => {
      if (init?.signal) requestSignals.push(init.signal);
      return new Promise<Response>(() => undefined);
    });

    void fixture.environment.fetch('/api/music/search');
    const runtime = fixture.environment.finalize(vi.fn());

    expect(requestSignals[0]?.aborted).toBe(false);
    runtime.destroy();
    expect(requestSignals[0]?.aborted).toBe(true);
  });

  it('silences only the expected request cancellation from StrictMode replacement cleanup', async () => {
    const fixture = createEnvironmentFixture();
    const warning = vi.fn();
    const showUiError = vi.fn();

    fixture.host.fetch.mockImplementation((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('native request aborted', 'AbortError')),
          { once: true },
        );
      });
    });

    const request = fixture.environment.fetch('/api/login/status').catch((error: unknown) => {
      if (fixture.environment.isLifecycleAbort(error)) return;
      warning(error);
      showUiError();
    });
    const runtime = fixture.environment.finalize(vi.fn());

    runtime.destroy();
    await request;

    expect(warning).not.toHaveBeenCalled();
    expect(showUiError).not.toHaveBeenCalled();
  });

  it('keeps a real AbortError visible when the registry signal was not lifecycle-aborted', async () => {
    const fixture = createEnvironmentFixture();
    const warning = vi.fn();
    const showUiError = vi.fn();
    const upstreamAbort = new DOMException('upstream request aborted', 'AbortError');

    fixture.host.fetch.mockRejectedValue(upstreamAbort);

    await fixture.environment.fetch('/api/login/status').catch((error: unknown) => {
      if (fixture.environment.isLifecycleAbort(error)) return;
      warning(error);
      showUiError();
    });

    expect(warning).toHaveBeenCalledWith(upstreamAbort);
    expect(showUiError).toHaveBeenCalledOnce();
    fixture.environment.abort();
  });

  it('unsubscribes desktop host listeners registered by the ported runtime', () => {
    const fixture = createEnvironmentFixture();
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => unsubscribe);

    fixture.host.desktopWindow.onStateChange = subscribe;
    const scopedDesktopWindow = (
      fixture.environment.window as unknown as {
        desktopWindow: MineradioHost['desktopWindow'];
      }
    ).desktopWindow;
    scopedDesktopWindow.onStateChange(vi.fn());
    const runtime = fixture.environment.finalize(vi.fn());

    expect(subscribe).toHaveBeenCalledOnce();
    runtime.destroy();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('keeps application selectors scoped when the native head owns scripts', () => {
    const fixture = createEnvironmentFixture();
    const script = document.createElement('script');
    const uiElement = document.createElement('div');
    const src = 'https://cdn.example.test/media-pipe.js';

    script.setAttribute('src', src);
    uiElement.className = 'scoped-ui';
    document.head.append(script);
    fixture.root.append(uiElement);

    expect(fixture.environment.document.querySelector(`script[src="${src}"]`)).toBeNull();
    expect(fixture.environment.document.querySelectorAll(`script[src="${src}"]`)).toHaveLength(0);
    expect(fixture.environment.document.querySelector('.scoped-ui')).toBe(uiElement);
    expect(fixture.environment.document.querySelector('head script')).toBeNull();

    fixture.environment.abort();
    script.remove();
  });
});

function createEnvironmentFixture() {
  const surface = document.createElement('div');
  const shadowRoot = surface.attachShadow({ mode: 'open' });
  const root = document.createElement('div');
  const host = {
    acquireAppCapabilities: vi.fn(() => () => undefined),
    bindWindowChrome: vi.fn(() => () => undefined),
    desktopWindow: {} as MineradioHost['desktopWindow'],
    fetch: vi.fn(),
    indexedDB: window.indexedDB,
    localStorage: window.localStorage,
  } satisfies MineradioHost;

  shadowRoot.append(root);
  document.body.append(surface);

  return {
    environment: createScopedMineradioEnvironment({ host, root, shadowRoot }),
    host,
    root,
    shadowRoot,
    surface,
  };
}

function installConstructor(name: string, constructor: unknown): void {
  originalWindowConstructors.set(name, Object.getOwnPropertyDescriptor(window, name));
  Object.defineProperty(window, name, { configurable: true, value: constructor, writable: true });
  if (!Object.is(globalThis, window)) {
    originalGlobalConstructors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: constructor,
      writable: true,
    });
  }
}

function restoreConstructors(): void {
  for (const [name, descriptor] of originalWindowConstructors) {
    restoreProperty(window, name, descriptor);
  }
  for (const [name, descriptor] of originalGlobalConstructors) {
    restoreProperty(globalThis, name, descriptor);
  }
  originalWindowConstructors.clear();
  originalGlobalConstructors.clear();
}

function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
  } else {
    Reflect.deleteProperty(target, property);
  }
}
