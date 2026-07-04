import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { KernelAppManifest } from '@kernelon/core';

import { GenieSnapshotStage } from '../src/components/genie-snapshot-stage';
import type { ShellRuntimeRegistry } from '../src/runtime';

vi.mock('html-to-image', () => ({
  toCanvas: vi.fn(async () => document.createElement('canvas')),
}));

const trainingApp: KernelAppManifest = {
  id: 'training',
  name: 'Training',
  description: 'Training center',
  priority: 'P1',
  category: 'growth',
  icon: 'BookOpenCheck',
  runtime: {
    window: {
      loaderKey: 'app:training-window',
    },
  },
  defaultWindow: {
    title: 'Training',
    bounds: { height: 580, width: 860, x: 196, y: 132 },
  },
};

function createRuntime(): ShellRuntimeRegistry {
  return {
    loadAppWindow: vi.fn(async () => ({
      default: function EmptyTrainingWindow() {
        return null;
      },
    })),
    loadWidget: vi.fn(),
  };
}

describe('GenieSnapshotStage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Chrome',
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 720,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
    });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      queueMicrotask(() => {
        callback(0);
      });

      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  it('renders snapshot windows at the capture origin without desktop safe-area offsets', async () => {
    render(
      <GenieSnapshotStage
        appIds={['training']}
        apps={[trainingApp]}
        onSnapshotReady={vi.fn()}
        runtime={createRuntime()}
      />,
    );

    const snapshotWindow = await screen.findByTestId(
      'kernelon-app-container-genie-snapshot:training',
    );

    expect(snapshotWindow).toHaveStyle({
      left: '0px',
      top: '0px',
    });
  });
});
