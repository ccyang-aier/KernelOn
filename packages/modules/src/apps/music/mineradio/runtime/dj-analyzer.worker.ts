/// <reference lib="webworker" />

import {
  analyzePodcastDjIntro,
  analyzePodcastDjStream,
} from '../generated/dj-analyzer';

import type { MineradioDjWorkerRequest } from '../../host/dj-analyzer';

const workerScope = self as unknown as DedicatedWorkerGlobalScope & {
  setImmediate?: (callback: () => void) => unknown;
};

workerScope.setImmediate ??= (callback) => workerScope.setTimeout(callback, 0);
const nativeFetch = workerScope.fetch.bind(workerScope);

workerScope.addEventListener(
  'message',
  async (event: MessageEvent<{ id: string; request: MineradioDjWorkerRequest }>) => {
    const { id, request } = event.data;
    try {
      workerScope.fetch = (input, init) => {
        const requestedUrl = input instanceof Request ? input.url : String(input);
        if (requestedUrl !== request.audioUrl) return nativeFetch(input, init);

        const headers = new Headers(init?.headers);
        headers.delete('referer');
        headers.delete('user-agent');
        const proxyUrl = `${request.mediaProxyUrl}?url=${encodeURIComponent(request.audioUrl)}`;
        return nativeFetch(proxyUrl, { ...init, headers });
      };
      const options = {
        durationSec: request.durationSec,
        ...(request.introSec === undefined ? {} : { introSec: request.introSec }),
      };
      const map =
        request.introSec === undefined
          ? await analyzePodcastDjStream(request.audioUrl, options)
          : await analyzePodcastDjIntro(request.audioUrl, options);
      workerScope.postMessage({ id, map, ok: true });
    } catch (error) {
      workerScope.postMessage({
        error: error instanceof Error ? error.message : 'DJ_ANALYSIS_FAILED',
        id,
        ok: false,
      });
    }
  },
);
