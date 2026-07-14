// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBrowserDjAnalyzer } from '../src/apps/music/host/dj-analyzer';

class FakeWorker extends EventTarget {
  static instances: FakeWorker[] = [];
  readonly terminate = vi.fn();
  readonly postMessage = vi.fn();

  constructor() {
    super();
    FakeWorker.instances.push(this);
  }
}

describe('Mineradio DJ analyzer host lifecycle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeWorker.instances = [];
  });

  it('terminates the worker when postMessage fails synchronously', async () => {
    const expected = new Error('CLONE_FAILED');
    class ThrowingWorker extends FakeWorker {
      override readonly postMessage = vi.fn(() => {
        throw expected;
      });
    }
    vi.stubGlobal('Worker', ThrowingWorker);
    const analyzer = createBrowserDjAnalyzer('/api/kernelon/v1');
    const failed = analyzer.analyze({ audioUrl: 'https://example.com/b.mp3', durationSec: 30 });

    await expect(failed).rejects.toBe(expected);
    expect(FakeWorker.instances[0]?.terminate).toHaveBeenCalledOnce();
  });

  it('rejects message decoding failures and releases the worker once', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const analyzer = createBrowserDjAnalyzer('/api/kernelon/v1');
    const result = analyzer.analyze({ audioUrl: 'https://example.com/a.mp3', durationSec: 30 });
    const worker = FakeWorker.instances[0]!;

    worker.dispatchEvent(new MessageEvent('messageerror'));
    worker.dispatchEvent(new ErrorEvent('error', { message: 'late error' }));

    await expect(result).rejects.toThrow('DJ_ANALYZER_MESSAGE_DECODE_FAILED');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
