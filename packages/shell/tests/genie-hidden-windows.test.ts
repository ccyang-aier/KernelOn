import { describe, expect, it } from 'vitest';

import {
  hideGenieWindow,
  revealGenieWindow,
} from '../src/components/genie-hidden-windows';

describe('genie hidden windows', () => {
  it('keeps a minimized window hidden until the same window is restored', () => {
    const hiddenAfterMinimize = hideGenieWindow(new Set(), 'window:onboarding');

    expect(hiddenAfterMinimize.has('window:onboarding')).toBe(true);
    expect(revealGenieWindow(hiddenAfterMinimize, 'window:training')).toBe(hiddenAfterMinimize);

    const hiddenAfterRestore = revealGenieWindow(hiddenAfterMinimize, 'window:onboarding');

    expect(hiddenAfterRestore.has('window:onboarding')).toBe(false);
  });
});
