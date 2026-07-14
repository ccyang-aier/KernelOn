export interface MineradioDjAnalyzeRequest {
  audioUrl: string;
  durationSec: number;
  introSec?: number;
}

export interface MineradioDjWorkerRequest extends MineradioDjAnalyzeRequest {
  mediaProxyUrl: string;
}

export interface MineradioDjAnalyzer {
  analyze(request: MineradioDjAnalyzeRequest, signal?: AbortSignal): Promise<unknown>;
}

type WorkerReply =
  | { id: string; map: unknown; ok: true }
  | { error: string; id: string; ok: false };

export function createBrowserDjAnalyzer(apiBaseUrl: string): MineradioDjAnalyzer {
  const mediaProxyUrl = `${apiBaseUrl.replace(/\/$/, '')}/music/audio`;

  return {
    analyze(request, signal) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(
          new URL('../mineradio/runtime/dj-analyzer.worker.ts', import.meta.url),
          { type: 'module' },
        );
        const id = crypto.randomUUID();
        let settled = false;

        const finish = () => {
          if (settled) return false;
          settled = true;
          signal?.removeEventListener('abort', onAbort);
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          worker.removeEventListener('messageerror', onMessageError);
          worker.terminate();
          return true;
        };
        const onAbort = () => {
          if (!finish()) return;
          reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
        };
        const onMessage = (event: MessageEvent<WorkerReply>) => {
          if (event.data.id !== id || !finish()) return;
          if (event.data.ok) resolve(event.data.map);
          else reject(new Error(event.data.error));
        };
        const onError = (event: ErrorEvent) => {
          if (!finish()) return;
          reject(event.error instanceof Error ? event.error : new Error(event.message));
        };
        const onMessageError = () => {
          if (!finish()) return;
          reject(new Error('DJ_ANALYZER_MESSAGE_DECODE_FAILED'));
        };

        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
        worker.addEventListener('messageerror', onMessageError);
        signal?.addEventListener('abort', onAbort, { once: true });

        if (signal?.aborted) {
          onAbort();
          return;
        }
        try {
          worker.postMessage({ id, request: { ...request, mediaProxyUrl } });
        } catch (error) {
          if (finish()) reject(error);
        }
      });
    },
  };
}
