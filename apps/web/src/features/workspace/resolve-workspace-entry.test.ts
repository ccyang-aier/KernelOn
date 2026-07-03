import { describe, expect, it } from 'vitest';

import { resolveWorkspaceInitialState, resolveWorkspaceOpenIntent } from './resolve-workspace-entry';

const apps = [
  {
    id: 'mentor',
    name: '导师管理',
    description: '导师库、师徒匹配、带教任务与反馈',
    priority: 'P0',
    category: 'operations',
    icon: 'Handshake',
    runtime: {
      window: {
        loaderKey: 'app:mentor-window',
      },
    },
    defaultWindow: {
      title: '导师管理',
      bounds: { x: 136, y: 96, width: 920, height: 620 },
    },
  },
] as const;

describe('resolveWorkspaceOpenIntent', () => {
  it('returns null when the URL does not target a known app', () => {
    expect(resolveWorkspaceOpenIntent({}, [...apps])).toBeNull();
    expect(resolveWorkspaceOpenIntent({ open: 'unknown' }, [...apps])).toBeNull();
  });

  it('parses a URL entry into an app open intent', () => {
    expect(
      resolveWorkspaceOpenIntent(
        {
          entityId: 'newcomer-123',
          open: 'mentor',
          tab: 'pending',
          view: 'match',
        },
        [...apps],
      ),
    ).toEqual({
      appId: 'mentor',
      source: 'url',
      view: {
        entityId: 'newcomer-123',
        params: { tab: 'pending' },
        viewId: 'match',
      },
    });
  });
});

describe('resolveWorkspaceInitialState', () => {
  it('opens an initial window when the workspace URL carries an entry intent', () => {
    const initialState = resolveWorkspaceInitialState({
      id: 'newcomer-123',
      open: 'mentor',
      view: 'match',
    });

    expect(initialState.windows?.[0]).toMatchObject({
      appId: 'mentor',
      id: 'entry:mentor',
      intent: {
        source: 'url',
        view: {
          entityId: 'newcomer-123',
          viewId: 'match',
        },
      },
      status: 'active',
    });
  });
});
