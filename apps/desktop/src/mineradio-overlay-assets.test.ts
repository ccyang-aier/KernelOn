import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  loadMineradioOverlayAssets,
  MINERADIO_OVERLAY_ASSET_PATHS,
} from './mineradio-overlay-assets';

describe('Mineradio desktop overlay assets', () => {
  it('emits byte-identical KernelOn-owned lyrics and wallpaper pages', () => {
    const assets = loadMineradioOverlayAssets();

    for (const [assetName, sourcePath] of Object.entries(MINERADIO_OVERLAY_ASSET_PATHS)) {
      expect(sourcePath).not.toContain('open_source');
      expect(assets.get(assetName as keyof typeof MINERADIO_OVERLAY_ASSET_PATHS)).toEqual(
        readFileSync(sourcePath),
      );
    }
    expect(assets.get('mineradio-overlays/desktop-lyrics.html')?.toString('utf8')).toContain(
      'window.desktopOverlay.onLyricsState(applyState)',
    );
    expect(assets.get('mineradio-overlays/wallpaper.html')?.toString('utf8')).toContain(
      'window.desktopOverlay.onWallpaperState(applyState)',
    );
  });

  it('owns a Tauri bridge for every Electron overlay-preload capability', () => {
    const bridge = readFileSync(
      new URL('../src-tauri/src/mineradio_overlay_bridge.js', import.meta.url),
      'utf8',
    );

    for (const method of [
      'onLyricsState',
      'onWallpaperState',
      'setLyricsDrag',
      'setLyricsPointerCapture',
      'setLyricsHotBounds',
      'setLyricsLockState',
      'moveLyricsBy',
      'closeLyrics',
    ]) {
      expect(bridge).toContain(method);
    }
    expect(bridge).toContain('document.documentElement.style.opacity');
    expect(bridge).not.toContain('open_source');
  });

  it('preserves Electron window-opacity multiplied by page-opacity semantics', () => {
    const bridge = readFileSync(
      new URL('../src-tauri/src/mineradio_overlay_bridge.js', import.meta.url),
      'utf8',
    );
    const lyricsPage = readFileSync(
      MINERADIO_OVERLAY_ASSET_PATHS['mineradio-overlays/desktop-lyrics.html'],
      'utf8',
    );
    const rustHost = readFileSync(
      new URL('../src-tauri/src/mineradio_overlays.rs', import.meta.url),
      'utf8',
    );

    expect(rustHost).toContain('cfg!(any(target_os = "windows", target_os = "macos"))');
    expect(bridge).toContain('document.documentElement.style.opacity = String(opacity)');
    expect(lyricsPage).toContain(
      "document.body.style.opacity = state.enabled ? String(clamp(state.opacity, .28, 1, .92)) : '0'",
    );

    const requestedOpacity = 0.64;
    const electronFinalAlpha = requestedOpacity * requestedOpacity;
    const tauriFinalAlpha = requestedOpacity * requestedOpacity;
    expect(tauriFinalAlpha).toBeCloseTo(electronFinalAlpha, 8);
  });
});

describe('Mineradio packaged desktop policy', () => {
  it('allows only the exact external script and model hosts used by source runtime', () => {
    const config = JSON.parse(
      readFileSync(new URL('../src-tauri/tauri.conf.json', import.meta.url), 'utf8'),
    ) as { app: { security: { csp: string } }; bundle: { icon: string[] } };
    const csp = config.app.security.csp;

    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net");
    for (const host of [
      'https://cdn.jsdelivr.net',
      'https://huggingface.co',
      'https://cdn-lfs.huggingface.co',
      'https://cdn-lfs-us-1.hf.co',
      'https://cdn-lfs-eu-1.hf.co',
      'https://cas-bridge.xethub.hf.co',
    ]) {
      expect(csp).toContain(host);
    }
    expect(csp).not.toMatch(/connect-src[^;]*\shttps:\s/);
    expect(csp).not.toContain('http://127.0.0.1:8000');
    expect(config.bundle.icon).toEqual(['icons/icon.ico']);
  });

  it('lets the native host bind one validated API origin into the runtime and CSP', () => {
    const hostConfig = readFileSync(
      new URL('../src-tauri/src/desktop_host_config.rs', import.meta.url),
      'utf8',
    );

    expect(hostConfig).toContain('KERNELON_DESKTOP_API_ORIGIN');
    expect(hostConfig).toContain('HTTP_REQUIRES_LOOPBACK');
    expect(hostConfig).toContain('append_api_origin_to_csp');
    for (const directive of ['connect-src', 'img-src', 'media-src']) {
      expect(hostConfig).toContain(`"${directive}"`);
    }
  });
});
