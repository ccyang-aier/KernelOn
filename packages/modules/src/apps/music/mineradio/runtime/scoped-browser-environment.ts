import { gsap } from 'gsap';
import * as THREE from 'three';

import type { MineradioHost } from '../../host/contract';
import type { MineradioRuntimeEnvironment } from './environment';
import { loadMineradioExternalScript } from './external-script-loader';
import { stopMineradioGestureCapture } from './gesture-capture-lifecycle';
import { MineradioGestureStartupLifecycle } from './gesture-startup-lifecycle';
import { isMineradioLifecycleAbort } from './lifecycle-abort';
import { MineradioResourceRegistry } from './resource-registry';

const inlineOwnerKey = Symbol.for('kernelon.mineradio.inline-owner');
const inlineActionsKey = '__kernelonMineradioActions';
const scopedDocumentKey = '__mineradioDocument';

export interface ScopedMineradioEnvironmentOptions {
  host: MineradioHost;
  root: HTMLElement;
  shadowRoot: ShadowRoot;
}

export function createScopedMineradioEnvironment({
  host,
  root,
  shadowRoot,
}: ScopedMineradioEnvironmentOptions): MineradioRuntimeEnvironment {
  const nativeWindow = window;
  const nativeDocument = document;
  const registry = new MineradioResourceRegistry();
  const localDocumentEvents = new EventTarget();
  const localWindowEvents = new EventTarget();
  let visible = true;
  let destroyed = false;
  let finalized = false;
  const mountAbortCleanups: Array<() => void> = [];
  let musicTempoPromise: Promise<unknown> | null = null;
  const previousMusicTempoDescriptor = Object.getOwnPropertyDescriptor(nativeWindow, 'MusicTempo');

  const scopedDocument = new Proxy(nativeDocument, {
    get(target, property) {
      if (property === 'body' || property === 'documentElement') return root;
      if (property === 'defaultView') return scopedWindow;
      if (property === 'activeElement') return shadowRoot.activeElement;
      if (property === 'fullscreenElement') return nativeDocument.fullscreenElement;
      if (property === 'hidden') return !visible || nativeDocument.hidden;
      if (property === 'visibilityState') {
        return visible && nativeDocument.visibilityState === 'visible' ? 'visible' : 'hidden';
      }
      if (property === 'getElementById') {
        return (id: string) => shadowRoot.getElementById(id);
      }
      if (property === 'querySelector') {
        return (selector: string) => shadowRoot.querySelector(selector);
      }
      if (property === 'querySelectorAll') {
        return (selector: string) => shadowRoot.querySelectorAll(selector);
      }
      if (property === 'getElementsByClassName') {
        return (className: string) => root.getElementsByClassName(className);
      }
      if (property === 'getElementsByTagName') {
        return (tagName: string) => root.getElementsByTagName(tagName);
      }
      if (property === 'elementFromPoint') {
        return (x: number, y: number) => shadowRoot.elementFromPoint(x, y);
      }
      if (property === 'elementsFromPoint') {
        return (x: number, y: number) => shadowRoot.elementsFromPoint(x, y);
      }
      if (property === 'addEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: AddEventListenerOptions | boolean,
        ) => {
          const eventTarget = resolveDocumentEventTarget(type);
          registry.addEventListener(eventTarget, type, listener, options);
        };
      }
      if (property === 'removeEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: EventListenerOptions | boolean,
        ) => {
          const eventTarget = resolveDocumentEventTarget(type);
          registry.removeEventListener(eventTarget, type, listener, options);
        };
      }

      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as Document;

  function resolveDocumentEventTarget(type: string): EventTarget {
    if (type === 'DOMContentLoaded' || type === 'visibilitychange') return localDocumentEvents;
    return shadowRoot;
  }

  const trackedAudio = createTrackedConstructor(nativeWindow.Audio, (audio) =>
    registry.trackAudioElement(audio),
  );
  const trackedWorker = createTrackedConstructor(nativeWindow.Worker, (worker) =>
    registry.trackWorker(worker),
  );
  const trackedAudioContext = nativeWindow.AudioContext
    ? createTrackedConstructor(nativeWindow.AudioContext, (context) =>
        registry.trackAudioContext(context),
      )
    : undefined;
  const trackedOfflineAudioContext = nativeWindow.OfflineAudioContext
    ? createTrackedConstructor(nativeWindow.OfflineAudioContext, (context) =>
        registry.trackAudioContext(context),
      )
    : undefined;
  const scopedUrl = createScopedUrl(registry);
  const scopedGsap = createScopedGsap(registry);
  const scopedThree = createScopedThree(registry);
  const scopedDesktopWindow = createScopedDesktopWindow(host.desktopWindow, registry);

  const restoreObserverConstructors = installTrackedObserverConstructors(nativeWindow, registry);
  // The ported script creates its observers synchronously. Limit the temporary global aliases to
  // that mount turn so unrelated KernelOn code can never be enrolled in this runtime's registry.
  queueMicrotask(restoreObserverConstructors);

  const scopedWindow = new Proxy(nativeWindow, {
    get(target, property) {
      if (property === 'document') return scopedDocument;
      if (property === scopedDocumentKey) return scopedDocument;
      if (property === 'desktopWindow') return scopedDesktopWindow;
      if (property === 'THREE') return scopedThree;
      if (property === 'gsap') return scopedGsap;
      if (property === 'Audio') return trackedAudio;
      if (property === 'AudioContext' || property === 'webkitAudioContext') {
        return trackedAudioContext;
      }
      if (property === 'OfflineAudioContext' || property === 'webkitOfflineAudioContext') {
        return trackedOfflineAudioContext;
      }
      if (property === 'Worker') return trackedWorker;
      if (property === 'URL') return scopedUrl;
      if (property === 'innerWidth')
        return Math.max(1, root.clientWidth || root.getBoundingClientRect().width);
      if (property === 'innerHeight') {
        return Math.max(1, root.clientHeight || root.getBoundingClientRect().height);
      }
      if (property === 'requestAnimationFrame')
        return registry.requestAnimationFrame.bind(registry);
      if (property === 'cancelAnimationFrame') return registry.cancelAnimationFrame.bind(registry);
      if (property === 'requestIdleCallback') return registry.requestIdleCallback.bind(registry);
      if (property === 'cancelIdleCallback') return registry.cancelIdleCallback.bind(registry);
      if (property === 'setTimeout') return registry.setTimeout.bind(registry);
      if (property === 'clearTimeout') return registry.clearTimeout.bind(registry);
      if (property === 'setInterval') return registry.setInterval.bind(registry);
      if (property === 'clearInterval') return registry.clearInterval.bind(registry);
      if (property === 'addEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: AddEventListenerOptions | boolean,
        ) => {
          registry.addEventListener(resolveWindowEventTarget(type), type, listener, options);
        };
      }
      if (property === 'removeEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: EventListenerOptions | boolean,
        ) => {
          registry.removeEventListener(resolveWindowEventTarget(type), type, listener, options);
        };
      }

      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as Window & typeof globalThis;

  function resolveWindowEventTarget(type: string): EventTarget {
    if (type === 'resize') return localWindowEvents;
    if (type === 'focus' || type === 'blur' || type === 'beforeunload' || type === 'pagehide') {
      return nativeWindow;
    }
    return shadowRoot;
  }

  registry.addEventListener(nativeDocument, 'visibilitychange', () => {
    localDocumentEvents.dispatchEvent(new Event('visibilitychange'));
  });

  const resizeObserver = registry.trackObserver(
    new ResizeObserver(() => {
      localWindowEvents.dispatchEvent(new Event('resize'));
    }),
  );
  resizeObserver.observe(root);

  applyNoReferrerPolicy(root);
  const referrerObserver = registry.trackObserver(
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) applyNoReferrerPolicy(node);
        }
      }
    }),
  );
  referrerObserver.observe(root, { childList: true, subtree: true });

  const nativeWindowRecord = nativeWindow as unknown as Record<PropertyKey, unknown>;
  const previousScopedDocument = Object.getOwnPropertyDescriptor(nativeWindow, scopedDocumentKey);
  Object.defineProperty(nativeWindow, scopedDocumentKey, {
    configurable: true,
    value: scopedDocument,
  });
  registry.addCleanup(() =>
    restoreProperty(nativeWindow, scopedDocumentKey, previousScopedDocument),
  );

  const assets = {
    musicTempoUrl: new URL('../assets/vendor/music-tempo.min.js', import.meta.url).href,
    skullPointsUrl: new URL('../assets/skull-decimation-points.bin', import.meta.url).href,
  };

  const environment: MineradioRuntimeEnvironment = {
    Audio: trackedAudio,
    THREE: scopedThree,
    URL: scopedUrl,
    Worker: trackedWorker,
    abort() {
      if (destroyed || finalized) return;
      destroyed = true;
      finalized = true;
      restoreObserverConstructors();
      rollbackMount();
      registry.destroy();
    },
    assets,
    cancelAnimationFrame: registry.cancelAnimationFrame.bind(registry),
    clearInterval: registry.clearInterval.bind(registry),
    clearTimeout: registry.clearTimeout.bind(registry),
    document: scopedDocument,
    fetch: (input, init) => fetchWithRegistry(host, registry, nativeWindow, input, init),
    gestureStartup: new MineradioGestureStartupLifecycle(() => destroyed),
    finalize(destroyPortedRuntime) {
      if (finalized) {
        throw new Error('Mineradio runtime environment can only be finalized once');
      }

      finalized = true;
      try {
        localDocumentEvents.dispatchEvent(new Event('DOMContentLoaded'));
        mountAbortCleanups.length = 0;
      } catch (error) {
        destroyed = true;
        rollbackMount();
        registry.destroy();
        throw error;
      } finally {
        restoreObserverConstructors();
      }

      return {
        destroy() {
          if (destroyed) return;
          destroyed = true;
          try {
            destroyPortedRuntime();
          } finally {
            registry.destroy();
          }
        },
        setVisibility(nextVisible) {
          if (destroyed || visible === nextVisible) return;
          visible = nextVisible;
          localDocumentEvents.dispatchEvent(new Event('visibilitychange'));
          localWindowEvents.dispatchEvent(new Event('resize'));
        },
      };
    },
    indexedDB: host.indexedDB,
    isDestroyed() {
      return destroyed;
    },
    isLifecycleAbort: isMineradioLifecycleAbort,
    loadMusicTempo() {
      if ('MusicTempo' in nativeWindowRecord && nativeWindowRecord.MusicTempo) {
        return Promise.resolve(nativeWindowRecord.MusicTempo);
      }
      if (musicTempoPromise) return musicTempoPromise;

      musicTempoPromise = new Promise((resolve, reject) => {
        const script = nativeDocument.createElement('script');
        let settled = false;
        let ownsMusicTempo = false;
        const finish = (action: () => void) => {
          if (settled) return;
          settled = true;
          script.removeEventListener('load', handleLoad);
          script.removeEventListener('error', handleError);
          action();
        };
        const handleLoad = () => {
          ownsMusicTempo = true;
          finish(() => resolve(nativeWindowRecord.MusicTempo ?? null));
        };
        const handleError = () => finish(() => reject(new Error('music-tempo load failed')));

        script.async = true;
        script.src = assets.musicTempoUrl;
        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener('error', handleError, { once: true });
        nativeDocument.head.append(script);
        registry.addCleanup(() => {
          script.remove();
          finish(() => reject(new DOMException('Mineradio runtime destroyed', 'AbortError')));
          if (ownsMusicTempo) {
            restoreProperty(nativeWindow, 'MusicTempo', previousMusicTempoDescriptor);
          }
        });
      });

      return musicTempoPromise;
    },
    loadExternalScript(source, expectedGlobal) {
      return loadMineradioExternalScript(nativeDocument, nativeWindow, source, expectedGlobal);
    },
    localStorage: host.localStorage,
    location: nativeWindow.location,
    navigator: nativeWindow.navigator,
    registerMountAbortCleanup(cleanup) {
      if (destroyed) {
        safelyCleanup(cleanup);
        return;
      }
      if (!finalized) mountAbortCleanups.push(cleanup);
    },
    registerInlineActions(actions) {
      const activeOwner = nativeWindowRecord[inlineOwnerKey];
      if (activeOwner && activeOwner !== environment) {
        throw new Error('Only one active Mineradio inline-action runtime is supported');
      }

      const previousOwnerDescriptor = Object.getOwnPropertyDescriptor(nativeWindow, inlineOwnerKey);
      const previousActionsDescriptor = Object.getOwnPropertyDescriptor(
        nativeWindow,
        inlineActionsKey,
      );

      try {
        Object.defineProperty(nativeWindow, inlineOwnerKey, {
          configurable: true,
          value: environment,
        });

        Object.defineProperty(nativeWindow, inlineActionsKey, {
          configurable: true,
          value: Object.fromEntries(
            Object.entries(actions).map(([name, action]) => [
              name,
              (...args: unknown[]) =>
                Reflect.apply(action as (...values: unknown[]) => unknown, nativeWindow, args),
            ]),
          ),
          writable: false,
        });
      } catch (error) {
        restoreProperty(nativeWindow, inlineActionsKey, previousActionsDescriptor);
        restoreProperty(nativeWindow, inlineOwnerKey, previousOwnerDescriptor);
        throw error;
      }

      registry.addCleanup(() => {
        restoreProperty(nativeWindow, inlineActionsKey, previousActionsDescriptor);
        if (nativeWindowRecord[inlineOwnerKey] === environment) {
          restoreProperty(nativeWindow, inlineOwnerKey, previousOwnerDescriptor);
        }
      });
    },
    requestAnimationFrame: registry.requestAnimationFrame.bind(registry),
    requestIdleCallback: registry.requestIdleCallback.bind(registry),
    setInterval: registry.setInterval.bind(registry),
    setTimeout: registry.setTimeout.bind(registry),
    stopGestureCapture: stopMineradioGestureCapture,
    window: scopedWindow,
  };

  function rollbackMount(): void {
    for (const cleanup of mountAbortCleanups.reverse()) safelyCleanup(cleanup);
    mountAbortCleanups.length = 0;
  }

  return environment;
}

type ObserverConstructor = new (...args: never[]) => { disconnect(): void };

const observerConstructorKeys = [
  'IntersectionObserver',
  'MutationObserver',
  'PerformanceObserver',
  'ResizeObserver',
] as const;

function installTrackedObserverConstructors(
  nativeWindow: Window & typeof globalThis,
  registry: MineradioResourceRegistry,
): () => void {
  const windowRecord = nativeWindow as unknown as Record<string, unknown>;
  const restoreTasks: Array<() => void> = [];
  let restored = false;

  for (const key of observerConstructorKeys) {
    const NativeConstructor = windowRecord[key];
    if (typeof NativeConstructor !== 'function') continue;

    const previousDescriptor = Object.getOwnPropertyDescriptor(nativeWindow, key);
    const TrackedConstructor = createTrackedConstructor(
      NativeConstructor as ObserverConstructor,
      (observer) => registry.trackObserver(observer),
    );

    try {
      Object.defineProperty(nativeWindow, key, {
        configurable: true,
        enumerable: previousDescriptor?.enumerable ?? false,
        value: TrackedConstructor,
        writable: true,
      });
    } catch {
      // Some hosts expose non-configurable observer constructors; those remain native.
      continue;
    }

    restoreTasks.push(() => restoreProperty(nativeWindow, key, previousDescriptor));
  }

  const restore = () => {
    if (restored) return;
    restored = true;
    for (const task of restoreTasks.reverse()) task();
  };

  registry.addCleanup(restore);
  return restore;
}

function createTrackedConstructor<TArguments extends unknown[], TInstance extends object>(
  NativeConstructor: new (...args: TArguments) => TInstance,
  track: (instance: TInstance) => TInstance,
): new (...args: TArguments) => TInstance {
  const TrackedConstructor = function (...args: TArguments) {
    return track(new NativeConstructor(...args));
  };

  Object.setPrototypeOf(TrackedConstructor, NativeConstructor);
  TrackedConstructor.prototype = NativeConstructor.prototype;
  return TrackedConstructor as unknown as new (...args: TArguments) => TInstance;
}

function createScopedThree(registry: MineradioResourceRegistry): typeof THREE {
  // Bundlers may expose ESM namespace exports as read-only, non-configurable properties.
  // A Proxy cannot return a wrapped constructor for such a property, so proxy a mutable
  // facade instead of the module namespace itself.
  const facade = Object.assign(Object.create(null) as object, THREE) as typeof THREE;
  const constructors = new Map<PropertyKey, unknown>();
  return new Proxy(facade, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      if (
        typeof value !== 'function' ||
        !/(?:Geometry|Material|Texture|WebGLRenderTarget|WebGLRenderer)$/.test(String(property))
      ) {
        return value;
      }
      if (constructors.has(property)) return constructors.get(property);

      const tracked = createTrackedConstructor(
        value as new (...args: unknown[]) => { dispose(): void; forceContextLoss?(): void },
        (resource) => registry.trackDisposable(resource),
      );
      constructors.set(property, tracked);
      return tracked;
    },
  }) as typeof THREE;
}

function createScopedUrl(registry: MineradioResourceRegistry): typeof URL {
  const ScopedUrl = URL;

  return new Proxy(ScopedUrl, {
    get(target, property, receiver) {
      if (property === 'createObjectURL') {
        return (object: Blob | MediaSource) => registry.trackObjectUrl(URL.createObjectURL(object));
      }
      if (property === 'revokeObjectURL') {
        return (url: string) => registry.revokeObjectUrl(url);
      }
      return Reflect.get(target, property, receiver) as unknown;
    },
  });
}

const trackedGsapMethods = new Set<PropertyKey>([
  'delayedCall',
  'from',
  'fromTo',
  'set',
  'timeline',
  'to',
]);

function createScopedGsap(registry: MineradioResourceRegistry): typeof gsap {
  return new Proxy(gsap, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;

      if (trackedGsapMethods.has(property) && typeof value === 'function') {
        return (...args: unknown[]) => {
          const result = Reflect.apply(value, target, args) as unknown;
          return isKillableAnimation(result) ? registry.trackAnimation(result) : result;
        };
      }

      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as typeof gsap;
}

function createScopedDesktopWindow(
  desktopWindow: MineradioHost['desktopWindow'],
  registry: MineradioResourceRegistry,
): MineradioHost['desktopWindow'] {
  return new Proxy(desktopWindow, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      if (typeof value !== 'function') return value;

      if (typeof property === 'string' && property.startsWith('on')) {
        return (...args: unknown[]) => {
          const unsubscribe = Reflect.apply(value, target, args) as unknown;
          if (typeof unsubscribe === 'function') registry.addCleanup(unsubscribe as () => void);
          return unsubscribe;
        };
      }

      return value.bind(target);
    },
  });
}

function isKillableAnimation(value: unknown): value is { kill(): void } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kill' in value &&
    typeof value.kill === 'function'
  );
}

function fetchWithRegistry(
  host: MineradioHost,
  registry: MineradioResourceRegistry,
  nativeWindow: Window & typeof globalThis,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = registry.trackAbortController(new nativeWindow.AbortController());
  const sourceSignal = init?.signal;
  const forwardAbort = () => controller.abort(sourceSignal?.reason);

  if (sourceSignal?.aborted) {
    forwardAbort();
  } else {
    sourceSignal?.addEventListener('abort', forwardAbort, { once: true });
  }

  const cleanup = () => {
    sourceSignal?.removeEventListener('abort', forwardAbort);
    registry.releaseAbortController(controller);
  };

  try {
    return host
      .fetch(input, {
        ...init,
        referrerPolicy: init?.referrerPolicy ?? 'no-referrer',
        signal: controller.signal,
      })
      .catch((error: unknown) => {
        const reason = controller.signal.reason;
        if (controller.signal.aborted && isMineradioLifecycleAbort(reason)) throw reason;
        throw error;
      })
      .finally(cleanup);
  } catch (error) {
    cleanup();
    return Promise.reject(error);
  }
}

function safelyCleanup(cleanup: () => void): void {
  try {
    cleanup();
  } catch {
    // Mount rollback continues even if a partially initialized source cleanup fails.
  }
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

function applyNoReferrerPolicy(root: Element): void {
  if (root instanceof HTMLImageElement) root.referrerPolicy = 'no-referrer';
  for (const image of root.querySelectorAll('img')) image.referrerPolicy = 'no-referrer';
}
