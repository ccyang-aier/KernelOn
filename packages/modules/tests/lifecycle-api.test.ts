import { describe, expect, it, vi } from 'vitest';

import { LifecycleApi } from '../src/apps/lifecycle/api';
import type { KernelOnRuntimeConfig } from '../src/runtime-config';

const runtime = (fetch: typeof globalThis.fetch): KernelOnRuntimeConfig => ({
  apiBaseUrl: '/api/kernelon/v1',
  apiFetch: fetch,
  mineradioPlatformAdapter: {} as KernelOnRuntimeConfig['mineradioPlatformAdapter'],
  platform: 'web',
});

describe('LifecycleApi', () => {
  it('loads lifecycle overview through the authenticated BFF path', async () => {
    const apiFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ activeCount: 2 }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    );
    const api = new LifecycleApi(runtime(apiFetch));

    await expect(api.dashboard()).resolves.toMatchObject({ activeCount: 2 });
    expect(apiFetch).toHaveBeenCalledWith(
      '/api/kernelon/v1/lifecycle/dashboard',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('sends explicit task state updates', async () => {
    const apiFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'task-1', status: 'completed' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    );
    const api = new LifecycleApi(runtime(apiFetch));

    await api.updateTask('case-1', 'task-1', 'completed');
    const [, init] = apiFetch.mock.calls[0] ?? [];
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe(JSON.stringify({ status: 'completed' }));
  });

  it('surfaces RFC 9457 details on failure', async () => {
    const apiFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Permission denied.' }), {
        headers: { 'Content-Type': 'application/problem+json' },
        status: 403,
      }),
    );
    const api = new LifecycleApi(runtime(apiFetch));

    await expect(api.cases()).rejects.toThrow('Permission denied.');
  });
});
