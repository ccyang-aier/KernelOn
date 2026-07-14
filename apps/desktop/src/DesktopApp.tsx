import { defaultShellInitialState } from '@kernelon/catalog';
import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useMemo, useState } from 'react';

import { createTauriMineradioPlatformAdapter } from './mineradio-platform-adapter';

type DesktopHostConfig = Readonly<{
  apiOrigin: string;
  windowsWallpaperSupported: boolean;
}>;

const browserPreviewConfig: DesktopHostConfig = {
  apiOrigin: 'http://127.0.0.1:8000',
  windowsWallpaperSupported: false,
};
const desktopPrincipal = 'guest';

export function DesktopApp() {
  const [tauriRuntime] = useState(isTauriRuntime);
  const [hostError, setHostError] = useState<string | null>(null);
  const [hostConfig, setHostConfig] = useState<DesktopHostConfig | null>(() =>
    tauriRuntime ? null : browserPreviewConfig,
  );
  useEffect(() => {
    if (!tauriRuntime || hostConfig) return;
    let active = true;
    void invoke<DesktopHostConfig>('kernelon_desktop_host_config').then(
      (config) => {
        if (active) setHostConfig(config);
      },
      (error: unknown) => {
        if (active) {
          setHostError(error instanceof Error ? error.message : String(error));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [hostConfig, tauriRuntime]);

  // Today Desktop has no authenticated KernelOn session, so a stable guest
  // namespace is bound. A future auth composition root only passes its user id
  // here; the shared Mineradio module and Rust profile mechanics stay unchanged.
  const mineradioPlatformAdapter = useMemo(
    () =>
      hostConfig && tauriRuntime
        ? createTauriMineradioPlatformAdapter(undefined, undefined, {
            principal: desktopPrincipal,
            wallpaperSupported: hostConfig.windowsWallpaperSupported,
          })
        : null,
    [hostConfig, tauriRuntime],
  );

  if (hostError) {
    return <main role="alert">KernelOn 桌面宿主安全配置加载失败：{hostError}</main>;
  }
  if (!hostConfig || (tauriRuntime && !mineradioPlatformAdapter)) {
    return <main aria-busy="true" aria-label="正在启动 KernelOn 桌面端" />;
  }

  return (
    <KernelOnModuleRuntime
      initialState={defaultShellInitialState}
      runtimeConfig={{
        apiBaseUrl: `${hostConfig.apiOrigin}/api/v1`,
        ...(mineradioPlatformAdapter ? { mineradioPlatformAdapter } : {}),
        mineradioStorageNamespace: `desktop:${desktopPrincipal}`,
        platform: 'desktop',
      }}
    />
  );
}

function isTauriRuntime(): boolean {
  return '__TAURI_INTERNALS__' in window;
}
