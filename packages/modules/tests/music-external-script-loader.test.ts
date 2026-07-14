// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';

import { loadMineradioExternalScript } from '../src/apps/music/mineradio/runtime/external-script-loader';
import { MineradioGestureStartupLifecycle } from '../src/apps/music/mineradio/runtime/gesture-startup-lifecycle';

afterEach(() => {
  document.head
    .querySelectorAll('[data-kernelon-mineradio-script-state]')
    .forEach((script) => script.remove());
  Reflect.deleteProperty(window, 'Camera');
  Reflect.deleteProperty(window, 'Hands');
});

describe('Mineradio external script loading', () => {
  it('shares one pending URL across runtime instances and does not resolve before load', async () => {
    const source = 'https://cdn.example.test/camera_utils/camera_utils.js';
    let resolved = false;
    const first = loadMineradioExternalScript(document, window, source, 'Camera');
    const second = loadMineradioExternalScript(document, window, source, 'Camera').then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(findScripts(source)).toHaveLength(1);

    Object.defineProperty(window, 'Camera', { configurable: true, value: class Camera {} });
    let lateResolved = false;
    const lateJoiner = loadMineradioExternalScript(document, window, source, 'Camera').then(() => {
      lateResolved = true;
    });
    await Promise.resolve();
    expect(lateResolved).toBe(false);
    findScripts(source)[0]?.dispatchEvent(new Event('load'));

    await Promise.all([first, second, lateJoiner]);
    expect(resolved).toBe(true);
  });

  it('waits for an already-present in-flight script instead of resolving on discovery', async () => {
    const source = 'https://cdn.example.test/hands/hands.js';
    const existing = document.createElement('script');
    existing.src = source;
    document.head.append(existing);
    let resolved = false;

    const load = loadMineradioExternalScript(document, window, source, 'Hands').then(() => {
      resolved = true;
    });
    await Promise.resolve();

    expect(resolved).toBe(false);
    expect(findScripts(source)).toHaveLength(1);

    Object.defineProperty(window, 'Hands', { configurable: true, value: class Hands {} });
    existing.dispatchEvent(new Event('load'));
    await load;
    expect(resolved).toBe(true);
  });

  it('rejects a load without its expected global and permits a clean retry', async () => {
    const source = 'https://cdn.example.test/camera_utils/retry.js';
    const failed = loadMineradioExternalScript(document, window, source, 'Camera');
    findScripts(source)[0]?.dispatchEvent(new Event('load'));

    await expect(failed).rejects.toThrow('loaded without Camera');
    expect(findScripts(source)).toHaveLength(0);

    const retry = loadMineradioExternalScript(document, window, source, 'Camera');
    const retryScript = findScripts(source)[0];
    expect(retryScript).toBeDefined();
    Object.defineProperty(window, 'Camera', { configurable: true, value: class Camera {} });
    retryScript?.dispatchEvent(new Event('load'));

    await expect(retry).resolves.toBeUndefined();
  });

  it('lets a StrictMode replacement share a pending script without reviving the old runtime', async () => {
    const source = 'https://cdn.example.test/camera_utils/strict-mode.js';
    let oldDestroyed = false;
    const oldLifecycle = new MineradioGestureStartupLifecycle(() => oldDestroyed);
    const oldToken = oldLifecycle.begin();
    const oldStartup = loadMineradioExternalScript(document, window, source, 'Camera').then(() =>
      Boolean(oldToken && oldLifecycle.isCurrent(oldToken)),
    );

    oldDestroyed = true;
    oldLifecycle.cancel();
    const replacementLifecycle = new MineradioGestureStartupLifecycle(() => false);
    const replacementToken = replacementLifecycle.begin();
    const replacementStartup = loadMineradioExternalScript(document, window, source, 'Camera').then(
      () => Boolean(replacementToken && replacementLifecycle.isCurrent(replacementToken)),
    );

    expect(findScripts(source)).toHaveLength(1);
    Object.defineProperty(window, 'Camera', { configurable: true, value: class Camera {} });
    findScripts(source)[0]?.dispatchEvent(new Event('load'));

    await expect(oldStartup).resolves.toBe(false);
    await expect(replacementStartup).resolves.toBe(true);
  });
});

function findScripts(source: string): HTMLScriptElement[] {
  return [...document.head.querySelectorAll<HTMLScriptElement>('script[src]')].filter(
    (script) => script.src === source,
  );
}
