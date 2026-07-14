// @vitest-environment jsdom

import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  acquireAppCapabilities: vi.fn(),
  abort: vi.fn(),
  bindWindowChrome: vi.fn(() => vi.fn()),
  destroy: vi.fn(),
  releaseAppCapabilities: vi.fn(),
  runtimeDestroyError: null as Error | null,
  setVisibility: vi.fn(),
}));

vi.mock('../src/apps/music/host/use-mineradio-host', () => ({
  useMineradioHost: () => ({
    acquireAppCapabilities: state.acquireAppCapabilities,
    bindWindowChrome: state.bindWindowChrome,
    localStorage: window.localStorage,
  }),
}));

vi.mock('../src/apps/music/mineradio/generated/runtime', () => ({
  mountPortedMineradioRuntime: () => ({
    destroy: () => {
      state.destroy();
      if (state.runtimeDestroyError) throw state.runtimeDestroyError;
    },
    setVisibility: state.setVisibility,
  }),
}));

vi.mock('../src/apps/music/mineradio/generated/styles', () => ({
  mineradioStyles: ':host{display:block}',
}));

vi.mock('../src/apps/music/mineradio/generated/template', () => ({
  mineradioTemplate: '<div class="desktop-drag-region"></div>',
}));

vi.mock('../src/apps/music/mineradio/runtime/scoped-browser-environment', () => ({
  createScopedMineradioEnvironment: () => ({ abort: state.abort }),
}));

import { MineradioApp } from '../src/apps/music/MineradioApp';

describe('Mineradio app window lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.acquireAppCapabilities.mockImplementation(() => state.releaseAppCapabilities);
    state.runtimeDestroyError = null;
  });

  it('destroys browser state and releases app-owned native capabilities on unmount', () => {
    const view = render(<MineradioApp window={{ status: 'active' } as never} />);

    expect(state.setVisibility).toHaveBeenCalledWith(true);
    view.unmount();

    expect(state.destroy).toHaveBeenCalledOnce();
    expect(state.acquireAppCapabilities).toHaveBeenCalledOnce();
    expect(state.releaseAppCapabilities).toHaveBeenCalledOnce();
  });

  it('leases each StrictMode runtime generation and releases only that generation', () => {
    const view = render(
      <StrictMode>
        <MineradioApp window={{ status: 'active' } as never} />
      </StrictMode>,
    );

    expect(state.acquireAppCapabilities).toHaveBeenCalledTimes(2);
    expect(state.releaseAppCapabilities).toHaveBeenCalledOnce();
    expect(state.destroy).toHaveBeenCalledOnce();

    view.unmount();

    expect(state.releaseAppCapabilities).toHaveBeenCalledTimes(2);
    expect(state.destroy).toHaveBeenCalledTimes(2);
  });

  it('still releases the native lease when ported runtime cleanup throws', () => {
    state.runtimeDestroyError = new Error('ported cleanup failed');
    const view = render(<MineradioApp window={{ status: 'active' } as never} />);

    expect(() => view.unmount()).toThrow('ported cleanup failed');
    expect(state.destroy).toHaveBeenCalledOnce();
    expect(state.releaseAppCapabilities).toHaveBeenCalledOnce();
  });
});
