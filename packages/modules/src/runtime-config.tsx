'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { MineradioPlatformAdapter } from './apps/music/host/contract';
import { createWebMineradioPlatformAdapter } from './apps/music/host/web-platform-adapter';

export interface KernelOnRuntimeConfig {
  /** Base URL of the canonical Litestar API, without a trailing slash. */
  apiBaseUrl: string;
  /** Optional host-authenticated fetch port; media URLs remain service-proxied. */
  apiFetch?: typeof fetch;
  /** Host-owned native/browser capabilities for the Mineradio app. */
  mineradioPlatformAdapter: MineradioPlatformAdapter;
  /** Stable KernelOn principal/device key used to isolate Mineradio local state. */
  mineradioStorageNamespace?: string;
  platform: 'desktop' | 'web';
}

const defaultMineradioPlatformAdapter = createWebMineradioPlatformAdapter();
const defaultRuntimeConfig: KernelOnRuntimeConfig = {
  apiBaseUrl: '/api/kernelon/v1',
  mineradioPlatformAdapter: defaultMineradioPlatformAdapter,
  platform: 'web',
};

const KernelOnRuntimeConfigContext = createContext<KernelOnRuntimeConfig>(defaultRuntimeConfig);

export function KernelOnRuntimeConfigProvider({
  children,
  value,
}: Readonly<{ children: ReactNode; value?: Partial<KernelOnRuntimeConfig> }>) {
  const apiBaseUrl = normalizeApiBaseUrl(value?.apiBaseUrl ?? defaultRuntimeConfig.apiBaseUrl);
  const apiFetch = value?.apiFetch;
  const mineradioPlatformAdapter =
    value?.mineradioPlatformAdapter ?? defaultRuntimeConfig.mineradioPlatformAdapter;
  const mineradioStorageNamespace = value?.mineradioStorageNamespace;
  const platform = value?.platform ?? defaultRuntimeConfig.platform;
  const resolvedValue = useMemo<KernelOnRuntimeConfig>(
    () => ({
      apiBaseUrl,
      ...(apiFetch ? { apiFetch } : {}),
      mineradioPlatformAdapter,
      ...(mineradioStorageNamespace ? { mineradioStorageNamespace } : {}),
      platform,
    }),
    [apiBaseUrl, apiFetch, mineradioPlatformAdapter, mineradioStorageNamespace, platform],
  );

  return (
    <KernelOnRuntimeConfigContext.Provider value={resolvedValue}>
      {children}
    </KernelOnRuntimeConfigContext.Provider>
  );
}

export function useKernelOnRuntimeConfig(): KernelOnRuntimeConfig {
  return useContext(KernelOnRuntimeConfigContext);
}

function normalizeApiBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  if (!normalized || !(normalized.startsWith('/') || /^https?:\/\//i.test(normalized))) {
    throw new Error('KernelOn API base URL must be an absolute HTTP(S) URL or root-relative path');
  }
  return normalized;
}
