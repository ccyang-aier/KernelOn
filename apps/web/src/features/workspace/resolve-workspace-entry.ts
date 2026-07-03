import { defaultShellInitialState } from '@kernelon/catalog';
import {
  openWindow,
  toWindowOpenIntent,
  type AppOpenIntent,
  type AppViewTarget,
  type KernelAppManifest,
} from '@kernelon/core';
import type { ShellInitialState } from '@kernelon/modules/runtime';

export type WorkspaceSearchParams = Record<string, string | string[] | undefined>;

const RESERVED_ENTRY_PARAMS = new Set(['entityId', 'id', 'open', 'view']);

export function resolveWorkspaceInitialState(
  searchParams: WorkspaceSearchParams = {},
): ShellInitialState {
  const intent = resolveWorkspaceOpenIntent(searchParams, defaultShellInitialState.apps);

  if (!intent) {
    return defaultShellInitialState;
  }

  const app = defaultShellInitialState.apps.find((candidate) => candidate.id === intent.appId);

  if (!app) {
    return defaultShellInitialState;
  }

  return {
    ...defaultShellInitialState,
    windows: openWindow([], app, {
      id: `entry:${app.id}`,
      intent: toWindowOpenIntent(intent),
    }),
  };
}

export function resolveWorkspaceOpenIntent(
  searchParams: WorkspaceSearchParams,
  apps: KernelAppManifest[],
): AppOpenIntent | null {
  const appId = firstSearchParam(searchParams.open);

  if (!appId || !apps.some((app) => app.id === appId)) {
    return null;
  }

  const view = resolveAppViewTarget(searchParams);

  return {
    appId,
    source: 'url',
    ...(view ? { view } : {}),
  };
}

function resolveAppViewTarget(searchParams: WorkspaceSearchParams): AppViewTarget | undefined {
  const viewId = firstSearchParam(searchParams.view);

  if (!viewId) {
    return undefined;
  }

  const entityId = firstSearchParam(searchParams.entityId) ?? firstSearchParam(searchParams.id);
  const params = collectViewParams(searchParams);

  return {
    viewId,
    ...(entityId ? { entityId } : {}),
    ...(Object.keys(params).length > 0 ? { params } : {}),
  };
}

function collectViewParams(searchParams: WorkspaceSearchParams): Record<string, string> {
  return Object.fromEntries(
    Object.entries(searchParams)
      .filter(([key]) => !RESERVED_ENTRY_PARAMS.has(key))
      .map(([key, value]) => [key, firstSearchParam(value)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = firstValue?.trim();

  return normalizedValue ? normalizedValue : undefined;
}
