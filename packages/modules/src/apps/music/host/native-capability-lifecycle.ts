import type { MineradioPlatformAdapter } from './contract';

type NativeCapabilityOperation<T> = () => Promise<T>;

const coordinators = new WeakMap<MineradioPlatformAdapter, MineradioNativeCapabilityCoordinator>();

/**
 * Serializes Mineradio's process-scoped native capabilities across virtual
 * window generations. Electron destroyed these resources with the process;
 * KernelOn instead leases them to each mounted App instance so a delayed
 * cleanup from an old React generation cannot overwrite the new generation.
 */
export class MineradioNativeCapabilityCoordinator {
  readonly #adapter: MineradioPlatformAdapter;
  #activeLeases = 0;
  #generation = 0;
  #operationTail: Promise<void> = Promise.resolve();

  constructor(adapter: MineradioPlatformAdapter) {
    this.#adapter = adapter;
  }

  acquire(): () => void {
    this.#activeLeases += 1;
    this.#generation += 1;
    let released = false;

    return () => {
      if (released) return;
      released = true;
      this.#activeLeases -= 1;
      this.#generation += 1;

      if (this.#activeLeases === 0) {
        this.#scheduleRelease(this.#generation);
      }
    };
  }

  run<T>(operation: NativeCapabilityOperation<T>): Promise<T> {
    const result = this.#operationTail.then(operation, operation);
    this.#operationTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  #scheduleRelease(generation: number): void {
    // React StrictMode intentionally performs setup -> cleanup -> setup in the
    // same turn. Deferring by one microtask lets that replacement acquire its
    // lease before any native "off" command is emitted.
    queueMicrotask(() => {
      if (this.#activeLeases !== 0 || this.#generation !== generation) return;

      void this.run(async () => {
        // Re-check after earlier native operations finish: a rapid reopen may
        // have acquired a newer lease while this release waited in the queue.
        if (this.#activeLeases !== 0 || this.#generation !== generation) return;
        await releaseMineradioAppCapabilities(this.#adapter);
      });
    });
  }
}

export function getMineradioNativeCapabilityCoordinator(
  adapter: MineradioPlatformAdapter,
): MineradioNativeCapabilityCoordinator {
  const existing = coordinators.get(adapter);
  if (existing) return existing;

  const coordinator = new MineradioNativeCapabilityCoordinator(adapter);
  coordinators.set(adapter, coordinator);
  return coordinator;
}

/** Release every process-scoped capability Mineradio may have enabled. */
export async function releaseMineradioAppCapabilities(
  platformAdapter: MineradioPlatformAdapter,
): Promise<void> {
  const releases: Promise<unknown>[] = [];
  const { desktopLyrics, globalShortcuts, wallpaper } = platformAdapter;
  if (globalShortcuts) {
    releases.push(Promise.resolve().then(() => globalShortcuts.configure([])));
  }
  if (desktopLyrics) {
    releases.push(
      Promise.resolve().then(() => desktopLyrics.setEnabled(false, { enabled: false })),
    );
  }
  if (wallpaper) {
    releases.push(Promise.resolve().then(() => wallpaper.setEnabled(false, { enabled: false })));
  }
  await Promise.allSettled(releases);
}
