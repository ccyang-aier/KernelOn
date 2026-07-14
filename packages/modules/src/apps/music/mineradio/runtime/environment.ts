import type * as Three from 'three';

import type { MineradioGestureStartupLifecycle } from './gesture-startup-lifecycle';

export interface MineradioRuntimeAssets {
  musicTempoUrl: string;
  skullPointsUrl: string;
}

export interface MineradioRuntimeInstance {
  destroy(): void;
  setVisibility(visible: boolean): void;
}

export interface MineradioRuntimeEnvironment {
  readonly Audio: typeof Audio;
  readonly THREE: typeof Three;
  readonly URL: typeof URL;
  readonly Worker: typeof Worker;
  readonly assets: MineradioRuntimeAssets;
  readonly document: Document;
  readonly fetch: typeof fetch;
  readonly gestureStartup: MineradioGestureStartupLifecycle;
  readonly indexedDB?: IDBFactory;
  readonly localStorage: Storage;
  readonly location: Location;
  readonly navigator: Navigator;
  readonly window: Window & typeof globalThis;
  abort(): void;
  cancelAnimationFrame(handle: number): void;
  clearInterval(handle?: number): void;
  clearTimeout(handle?: number): void;
  finalize(destroyPortedRuntime: () => void): MineradioRuntimeInstance;
  isLifecycleAbort(error: unknown): boolean;
  loadMusicTempo(): Promise<unknown>;
  loadExternalScript(source: string, expectedGlobal: string): Promise<void>;
  registerMountAbortCleanup(cleanup: () => void): void;
  registerInlineActions(actions: Readonly<Record<string, unknown>>): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number;
  setInterval(handler: TimerHandler, timeout?: number, ...args: unknown[]): number;
  setTimeout(handler: TimerHandler, timeout?: number, ...args: unknown[]): number;
  stopGestureCapture(
    camera: Readonly<{ stop?: () => unknown }> | null,
    video: HTMLVideoElement | null,
  ): void;
}
