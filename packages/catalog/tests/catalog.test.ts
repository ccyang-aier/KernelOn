import { describe, expect, it } from 'vitest';

import { defaultDesktopScreens, kernelApps, kernelWidgets } from '../src';

describe('KernelOn built-in catalog', () => {
  it('keeps catalog metadata separate from desktop placement', () => {
    expect(kernelApps).toHaveLength(7);
    expect(defaultDesktopScreens[0]?.items).toHaveLength(4);
  });

  it('declares runtime loader keys for apps and widgets', () => {
    expect(kernelApps.every((app) => app.runtime.window.loaderKey.startsWith('app:'))).toBe(true);
    expect(
      kernelWidgets.every((widget) => widget.runtime.widget.loaderKey.startsWith('widget:')),
    ).toBe(true);
  });
});
