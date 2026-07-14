import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const generatedRuntime = readFileSync(
  fileURLToPath(new URL('../src/apps/music/mineradio/generated/runtime.ts', import.meta.url)),
  'utf8',
);
const ownedSource = readFileSync(
  fileURLToPath(new URL('../src/apps/music/mineradio/source/public/index.html', import.meta.url)),
  'utf8',
);

describe('generated Mineradio camera lifecycle adaptation', () => {
  it('preserves the owned source while cleaning partially-started cameras and every stream track', () => {
    expect(ownedSource).toContain('function stopGestureControl() {\n  if (!gestureActive) return;');

    const stopGestureControl = extractFunction(
      generatedRuntime,
      'stopGestureControl',
      'resizeHandCanvas',
    );

    expect(stopGestureControl).not.toContain('if (!gestureActive) return');
    expect(stopGestureControl).toContain('environment.gestureStartup.cancel();');
    expect(stopGestureControl).toContain(
      'releaseGestureStartupResources(gestureVideo, gestureCamera, gestureHands);',
    );
  });

  it('gates every pending startup stage and connects runtime destroy to gesture cleanup', () => {
    const startGestureControl = extractFunction(
      generatedRuntime,
      'startGestureControl',
      'stopGestureControl',
    );
    const stopHeadTracking = extractFunction(
      generatedRuntime,
      'stopHeadTracking',
      undefined,
      generatedRuntime.indexOf('var gestureVideo'),
    );
    const destroyHook = generatedRuntime.slice(
      generatedRuntime.indexOf('environment.finalize(function destroyPortedMineradioRuntime()'),
    );

    expect(startGestureControl).toContain('environment.gestureStartup.begin()');
    expect(
      startGestureControl.match(/environment\.gestureStartup\.isCurrent\(startupToken\)/g),
    ).toHaveLength(4);
    expect(
      startGestureControl.indexOf(
        'releaseGestureStartupResources(startupVideo, startupCamera, startupHands);',
      ),
    ).toBeLessThan(startGestureControl.indexOf("console.warn('Gesture failed:', e);"));
    expect(stopHeadTracking).toContain('stopGestureControl();');
    expect(destroyHook).toContain("if (typeof stopHeadTracking === 'function') stopHeadTracking()");
    expect(generatedRuntime).toContain(
      'environment.registerMountAbortCleanup(function rollbackGestureMount()',
    );
  });

  it('guards generated warning and UI-error catches without changing the owned source', () => {
    const generatedLoginRefresh = extractFunction(
      generatedRuntime,
      'refreshLoginStatus',
      'normalizeQQLoginStatus',
    );
    const sourceLoginRefresh = extractFunction(
      ownedSource,
      'refreshLoginStatus',
      'normalizeQQLoginStatus',
    );
    const generatedHomeDiscover = extractFunction(
      generatedRuntime,
      'loadHomeDiscover',
      'homeWeatherRadioUrl',
    );
    const sourceHomeDiscover = extractFunction(
      ownedSource,
      'loadHomeDiscover',
      'homeWeatherRadioUrl',
    );

    expect(generatedLoginRefresh).toContain('if (environment.isLifecycleAbort(e)) return;');
    expect(generatedLoginRefresh.indexOf('environment.isLifecycleAbort(e)')).toBeLessThan(
      generatedLoginRefresh.indexOf('console.warn(e)'),
    );
    expect(generatedHomeDiscover).toContain('if (environment.isLifecycleAbort(e)) return;');
    expect(generatedHomeDiscover.indexOf('environment.isLifecycleAbort(e)')).toBeLessThan(
      generatedHomeDiscover.indexOf("homeDiscoverState.error = 'DISCOVER_FAILED'"),
    );
    expect(sourceLoginRefresh).not.toContain('environment.isLifecycleAbort');
    expect(sourceHomeDiscover).not.toContain('environment.isLifecycleAbort');
  });
});

function extractFunction(
  source: string,
  name: string,
  nextName?: string,
  explicitEnd?: number,
): string {
  const start = source.indexOf(`function ${name}(`);
  const end =
    explicitEnd ?? (nextName ? source.indexOf(`function ${nextName}(`, start + 1) : source.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
