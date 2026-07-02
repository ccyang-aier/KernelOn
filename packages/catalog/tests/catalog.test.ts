import { describe, expect, it } from 'vitest';

import { defaultDesktopScreens, defaultShellInitialState, kernelApps, kernelWidgets } from '../src';

describe('KernelOn built-in catalog', () => {
  it('keeps catalog metadata separate from desktop placement', () => {
    expect(kernelApps).toHaveLength(7);
    expect(defaultDesktopScreens[0]?.items).toHaveLength(0);
  });

  it('declares runtime loader keys for apps and widgets', () => {
    expect(kernelApps.every((app) => app.runtime.window.loaderKey.startsWith('app:'))).toBe(true);
    expect(
      kernelWidgets.every((widget) => widget.runtime.widget.loaderKey.startsWith('widget:')),
    ).toBe(true);
  });

  it('exposes a shared default shell state for web and desktop mounts', () => {
    expect(defaultShellInitialState.apps).toBe(kernelApps);
    expect(defaultShellInitialState.widgets).toBe(kernelWidgets);
    expect(defaultShellInitialState.screens).toBe(defaultDesktopScreens);
  });
});
