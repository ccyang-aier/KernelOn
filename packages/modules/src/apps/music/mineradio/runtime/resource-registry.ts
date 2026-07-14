import { createMineradioLifecycleAbort } from './lifecycle-abort';

type EventRegistration = {
  listener: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
  target: EventTarget;
  type: string;
};

type DisconnectableObserver = {
  disconnect(...args: unknown[]): void;
};

type KillableAnimation = {
  eventCallback?(
    type: string,
    callback?: ((...args: unknown[]) => void) | null,
  ): ((...args: unknown[]) => void) | null | undefined;
  isActive?(): boolean;
  kill(...args: unknown[]): void;
  totalProgress?(): number;
};

type DisposableResource = {
  dispose(...args: unknown[]): void;
  forceContextLoss?(): void;
};

export interface MineradioTrackedResourceCounts {
  animations: number;
  disposables: number;
  observers: number;
  workers: number;
}

export class MineradioResourceRegistry {
  readonly #animationFrames = new Set<number>();
  readonly #animations = new Set<KillableAnimation>();
  readonly #audioContexts = new Set<BaseAudioContext>();
  readonly #audioElements = new Set<HTMLAudioElement>();
  readonly #abortControllers = new Map<AbortController, DOMException>();
  readonly #cleanupTasks: Array<() => void> = [];
  readonly #disposableResources = new Set<DisposableResource>();
  readonly #eventRegistrations: EventRegistration[] = [];
  readonly #idleCallbacks = new Set<number>();
  readonly #intervals = new Set<number>();
  readonly #objectUrls = new Set<string>();
  readonly #observers = new Set<DisconnectableObserver>();
  readonly #timeouts = new Set<number>();
  readonly #workers = new Set<Worker>();
  #destroyed = false;

  get destroyed(): boolean {
    return this.#destroyed;
  }

  get trackedResourceCounts(): MineradioTrackedResourceCounts {
    return {
      animations: this.#animations.size,
      disposables: this.#disposableResources.size,
      observers: this.#observers.size,
      workers: this.#workers.size,
    };
  }

  addCleanup(cleanup: () => void): void {
    if (this.#destroyed) {
      safely(cleanup);
      return;
    }

    this.#cleanupTasks.push(cleanup);
  }

  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (this.#destroyed) {
      return;
    }

    target.addEventListener(type, listener, options);
    this.#eventRegistrations.push({ listener, options, target, type });
  }

  removeEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: EventListenerOptions | boolean,
  ): void {
    target.removeEventListener(type, listener, options);

    for (let index = this.#eventRegistrations.length - 1; index >= 0; index -= 1) {
      const registration = this.#eventRegistrations[index];

      if (
        registration?.target === target &&
        registration.type === type &&
        registration.listener === listener
      ) {
        this.#eventRegistrations.splice(index, 1);
        break;
      }
    }
  }

  setTimeout(handler: TimerHandler, timeout?: number, ...args: unknown[]): number {
    if (this.#destroyed) {
      return 0;
    }

    const handle = window.setTimeout(() => {
      this.#timeouts.delete(handle);

      if (!this.#destroyed && typeof handler === 'function') {
        handler(...args);
      }
    }, timeout);

    this.#timeouts.add(handle);
    return handle;
  }

  clearTimeout(handle?: number): void {
    if (handle === undefined) {
      return;
    }

    window.clearTimeout(handle);
    this.#timeouts.delete(handle);
  }

  setInterval(handler: TimerHandler, timeout?: number, ...args: unknown[]): number {
    if (this.#destroyed) {
      return 0;
    }

    const handle = window.setInterval(
      (...callbackArgs: unknown[]) => {
        if (!this.#destroyed && typeof handler === 'function') {
          handler(...callbackArgs);
        }
      },
      timeout,
      ...args,
    );

    this.#intervals.add(handle);
    return handle;
  }

  clearInterval(handle?: number): void {
    if (handle === undefined) {
      return;
    }

    window.clearInterval(handle);
    this.#intervals.delete(handle);
  }

  requestAnimationFrame(callback: FrameRequestCallback): number {
    if (this.#destroyed) {
      return 0;
    }

    const handle = window.requestAnimationFrame((time) => {
      this.#animationFrames.delete(handle);
      if (!this.#destroyed) callback(time);
    });

    this.#animationFrames.add(handle);
    return handle;
  }

  cancelAnimationFrame(handle: number): void {
    window.cancelAnimationFrame(handle);
    this.#animationFrames.delete(handle);
  }

  requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
    if (this.#destroyed) {
      return 0;
    }

    const nativeRequestIdleCallback = window.requestIdleCallback;

    if (typeof nativeRequestIdleCallback === 'function') {
      const handle = nativeRequestIdleCallback((deadline) => {
        this.#idleCallbacks.delete(handle);
        if (!this.#destroyed) callback(deadline);
      }, options);

      this.#idleCallbacks.add(handle);
      return handle;
    }

    return this.setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      });
    }, options?.timeout ?? 1);
  }

  cancelIdleCallback(handle: number): void {
    if (typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(handle);
      this.#idleCallbacks.delete(handle);
      return;
    }

    this.clearTimeout(handle);
  }

  trackAbortController(controller: AbortController): AbortController {
    const lifecycleAbort = createMineradioLifecycleAbort();
    if (this.#destroyed) {
      safely(() => controller.abort(lifecycleAbort));
      return controller;
    }

    this.#abortControllers.set(controller, lifecycleAbort);
    return controller;
  }

  releaseAbortController(controller: AbortController): void {
    this.#abortControllers.delete(controller);
  }

  trackAnimation<T extends KillableAnimation>(animation: T): T {
    if (this.#destroyed) {
      safely(() => animation.kill());
      return animation;
    }

    if (this.#animations.has(animation)) return animation;
    this.#animations.add(animation);
    wrapReleaseMethod(animation, 'kill', () => this.#animations.delete(animation));
    this.#releaseAnimationOnCompletion(animation);
    return animation;
  }

  #releaseAnimationOnCompletion(animation: KillableAnimation): void {
    if (typeof animation.eventCallback !== 'function') return;

    for (const eventName of ['onComplete', 'onInterrupt']) {
      const existing = animation.eventCallback(eventName);
      animation.eventCallback(eventName, (...args: unknown[]) => {
        this.#animations.delete(animation);
        if (typeof existing === 'function') Reflect.apply(existing, animation, args);
      });
    }

    if (
      typeof animation.totalProgress === 'function' &&
      animation.totalProgress() >= 1 &&
      (typeof animation.isActive !== 'function' || !animation.isActive())
    ) {
      this.#animations.delete(animation);
    }
  }

  trackDisposable<T extends DisposableResource>(resource: T): T {
    if (this.#destroyed) {
      disposeResource(resource);
      return resource;
    }

    if (this.#disposableResources.has(resource)) return resource;
    this.#disposableResources.add(resource);
    wrapReleaseMethod(resource, 'dispose', () => this.#disposableResources.delete(resource));
    return resource;
  }

  trackAudioElement(audio: HTMLAudioElement): HTMLAudioElement {
    if (this.#destroyed) {
      disposeAudioElement(audio);
      return audio;
    }

    this.#audioElements.add(audio);
    return audio;
  }

  trackAudioContext<T extends BaseAudioContext>(context: T): T {
    if (this.#destroyed) {
      closeAudioContext(context);
      return context;
    }

    this.#audioContexts.add(context);
    return context;
  }

  trackWorker(worker: Worker): Worker {
    if (this.#destroyed) {
      safely(() => worker.terminate());
      return worker;
    }

    if (this.#workers.has(worker)) return worker;
    this.#workers.add(worker);
    wrapReleaseMethod(worker, 'terminate', () => this.#workers.delete(worker));
    return worker;
  }

  trackObjectUrl(url: string): string {
    if (this.#destroyed) {
      revokeObjectUrl(url);
      return url;
    }

    this.#objectUrls.add(url);
    return url;
  }

  revokeObjectUrl(url: string): void {
    revokeObjectUrl(url);
    this.#objectUrls.delete(url);
  }

  trackObserver<T extends DisconnectableObserver>(observer: T): T {
    if (this.#destroyed) {
      safely(() => observer.disconnect());
      return observer;
    }

    if (this.#observers.has(observer)) return observer;
    this.#observers.add(observer);
    wrapReleaseMethod(observer, 'disconnect', () => this.#observers.delete(observer));
    return observer;
  }

  destroy(): void {
    if (this.#destroyed) {
      return;
    }

    this.#destroyed = true;

    for (const registration of this.#eventRegistrations.splice(0)) {
      safely(() =>
        registration.target.removeEventListener(
          registration.type,
          registration.listener,
          registration.options,
        ),
      );
    }

    for (const handle of this.#timeouts) window.clearTimeout(handle);
    for (const handle of this.#intervals) window.clearInterval(handle);
    for (const handle of this.#animationFrames) window.cancelAnimationFrame(handle);
    for (const handle of this.#idleCallbacks) window.cancelIdleCallback?.(handle);

    this.#timeouts.clear();
    this.#intervals.clear();
    this.#animationFrames.clear();
    this.#idleCallbacks.clear();

    for (const [controller, reason] of this.#abortControllers) {
      safely(() => controller.abort(reason));
    }
    this.#abortControllers.clear();

    for (const animation of this.#animations) safely(() => animation.kill());
    this.#animations.clear();

    for (const resource of this.#disposableResources) disposeResource(resource);
    this.#disposableResources.clear();

    for (const worker of this.#workers) safely(() => worker.terminate());
    this.#workers.clear();

    for (const observer of this.#observers) safely(() => observer.disconnect());
    this.#observers.clear();

    for (const audio of this.#audioElements) disposeAudioElement(audio);
    this.#audioElements.clear();

    for (const context of this.#audioContexts) closeAudioContext(context);
    this.#audioContexts.clear();

    for (const url of this.#objectUrls) revokeObjectUrl(url);
    this.#objectUrls.clear();

    for (const cleanup of this.#cleanupTasks.reverse()) {
      safely(cleanup);
    }
    this.#cleanupTasks.length = 0;
  }
}

function disposeResource(resource: DisposableResource): void {
  safely(() => resource.dispose());
  if (typeof resource.forceContextLoss === 'function') safely(() => resource.forceContextLoss?.());
}

function disposeAudioElement(audio: HTMLAudioElement): void {
  safely(() => audio.pause());
  safely(() => audio.removeAttribute('src'));
  safely(() => audio.load());
}

function closeAudioContext(context: BaseAudioContext): void {
  const close = (context as BaseAudioContext & { close?: () => Promise<void> }).close;

  if (typeof close !== 'function' || context.state === 'closed') {
    return;
  }

  safely(() => {
    const result = close.call(context);
    if (result && typeof result.catch === 'function') {
      void result.catch(() => undefined);
    }
  });
}

function revokeObjectUrl(url: string): void {
  if (typeof URL.revokeObjectURL === 'function') {
    safely(() => URL.revokeObjectURL(url));
  }
}

function safely(action: () => void): void {
  try {
    action();
  } catch {
    // Cleanup remains best-effort so one third-party resource cannot block the rest.
  }
}

function wrapReleaseMethod<
  TResource extends object,
  TMethod extends keyof TResource,
>(resource: TResource, method: TMethod, release: () => void): void {
  const original = resource[method];
  if (typeof original !== 'function') return;

  try {
    Object.defineProperty(resource, method, {
      configurable: true,
      value: function releasingMethod(this: TResource, ...args: unknown[]) {
        release();
        return Reflect.apply(original as (...values: unknown[]) => unknown, this, args);
      },
      writable: true,
    });
  } catch {
    // Some native resources expose non-configurable prototype methods. They
    // remain tracked until final teardown, which is still safe and truthful.
  }
}
