import type { KernelAppManifest } from './types';

export interface KernelAppRegistry {
  all(): KernelAppManifest[];
  get(id: string): KernelAppManifest | undefined;
  require(id: string): KernelAppManifest;
}

export function createAppRegistry(apps: KernelAppManifest[]): KernelAppRegistry {
  const registry = new Map<string, KernelAppManifest>();

  for (const app of apps) {
    if (registry.has(app.id)) {
      throw new Error(`Duplicate KernelOn app id: ${app.id}`);
    }

    registry.set(app.id, app);
  }

  return {
    all: () => [...registry.values()],
    get: (id) => registry.get(id),
    require: (id) => {
      const app = registry.get(id);

      if (!app) {
        throw new Error(`Unknown KernelOn app id: ${id}`);
      }

      return app;
    },
  };
}
