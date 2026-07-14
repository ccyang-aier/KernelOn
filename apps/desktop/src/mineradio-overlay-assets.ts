import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

export const MINERADIO_OVERLAY_ASSET_PATHS = {
  'mineradio-overlays/desktop-lyrics.html': fileURLToPath(
    new URL(
      '../../../packages/modules/src/apps/music/mineradio/source/public/desktop-lyrics.html',
      import.meta.url,
    ),
  ),
  'mineradio-overlays/wallpaper.html': fileURLToPath(
    new URL(
      '../../../packages/modules/src/apps/music/mineradio/source/public/wallpaper.html',
      import.meta.url,
    ),
  ),
} as const;

export type MineradioOverlayAssetName = keyof typeof MINERADIO_OVERLAY_ASSET_PATHS;

export function loadMineradioOverlayAssets(): ReadonlyMap<MineradioOverlayAssetName, Buffer> {
  return new Map(
    Object.entries(MINERADIO_OVERLAY_ASSET_PATHS).map(([assetName, sourcePath]) => [
      assetName as MineradioOverlayAssetName,
      readFileSync(sourcePath),
    ]),
  );
}

/**
 * The overlay pages stay byte-for-byte identical to KernelOn's owned
 * Mineradio source. Vite emits them as desktop assets in production and serves
 * the same bytes in development, so Tauri never reaches into open_source at
 * runtime and the rendering logic has a single source of truth.
 */
export function mineradioOverlayAssetsPlugin(): Plugin {
  return {
    name: 'kernelon-mineradio-overlay-assets',
    buildStart() {
      for (const sourcePath of Object.values(MINERADIO_OVERLAY_ASSET_PATHS)) {
        this.addWatchFile(sourcePath);
      }
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://kernelon.local').pathname.replace(
          /^\//,
          '',
        ) as MineradioOverlayAssetName;
        const sourcePath = MINERADIO_OVERLAY_ASSET_PATHS[pathname];
        if (!sourcePath) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(readFileSync(sourcePath));
      });
    },
    generateBundle() {
      for (const [fileName, source] of loadMineradioOverlayAssets()) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    },
  };
}
