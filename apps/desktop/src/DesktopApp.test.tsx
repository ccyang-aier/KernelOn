// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAdapter: vi.fn(),
  invoke: vi.fn(),
  moduleRuntime: vi.fn((props: unknown) => {
    void props;
    return null;
  }),
}));

vi.mock('@kernelon/modules/runtime', () => ({
  KernelOnModuleRuntime: mocks.moduleRuntime,
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('./mineradio-platform-adapter', () => ({
  createTauriMineradioPlatformAdapter: mocks.createAdapter,
}));

import { DesktopApp } from './DesktopApp';

describe('DesktopApp host-mode composition', () => {
  beforeEach(() => {
    deleteTauriRuntimeMarker();
    mocks.createAdapter.mockReset();
    mocks.invoke.mockReset();
    mocks.moduleRuntime.mockClear();
  });

  afterEach(() => {
    cleanup();
    deleteTauriRuntimeMarker();
  });

  it('uses the browser capability fallback without touching native IPC in Vite preview', () => {
    render(<DesktopApp />);

    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.createAdapter).not.toHaveBeenCalled();
    expect(mocks.moduleRuntime).toHaveBeenCalledOnce();
    const props = mocks.moduleRuntime.mock.calls[0]?.[0] as {
      runtimeConfig: Record<string, unknown>;
    };
    expect(props.runtimeConfig).toMatchObject({
      apiBaseUrl: 'http://127.0.0.1:8000/api/v1',
      mineradioStorageNamespace: 'desktop:guest',
      platform: 'desktop',
    });
    // Omitting the adapter intentionally selects the shared file-only Web
    // adapter; no accounts, shortcuts, lyrics or wallpaper native methods exist.
    expect(props.runtimeConfig).not.toHaveProperty('mineradioPlatformAdapter');
  });

  it('loads the native config and adapter only inside a real Tauri runtime', async () => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    });
    const nativeAdapter = {
      files: { exportJsonFile: vi.fn(), importJsonFile: vi.fn() },
      kind: 'tauri',
    };
    mocks.invoke.mockResolvedValue({
      apiOrigin: 'https://api.kernelon.example',
      windowsWallpaperSupported: true,
    });
    mocks.createAdapter.mockReturnValue(nativeAdapter);

    render(<DesktopApp />);

    await waitFor(() => expect(mocks.moduleRuntime).toHaveBeenCalledOnce());
    expect(mocks.invoke).toHaveBeenCalledWith('kernelon_desktop_host_config');
    expect(mocks.createAdapter).toHaveBeenCalledWith(undefined, undefined, {
      principal: 'guest',
      wallpaperSupported: true,
    });
    expect(mocks.moduleRuntime.mock.calls[0]?.[0]).toMatchObject({
      runtimeConfig: {
        apiBaseUrl: 'https://api.kernelon.example/api/v1',
        mineradioPlatformAdapter: nativeAdapter,
      },
    });
  });
});

function deleteTauriRuntimeMarker() {
  Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
}
