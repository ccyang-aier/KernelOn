type ScriptState = 'error' | 'loaded' | 'loading';

const pendingLoads = new WeakMap<Document, Map<string, Promise<void>>>();
const stateAttribute = 'data-kernelon-mineradio-script-state';

/**
 * Shares global MediaPipe script loads across App generations. A script is
 * usable only after its load event and expected global constructor both exist.
 */
export function loadMineradioExternalScript(
  document: Document,
  window: Window & typeof globalThis,
  source: string,
  expectedGlobal: string,
): Promise<void> {
  const url = new URL(source, document.baseURI).href;
  const documentLoads = getDocumentLoads(document);
  const pending = documentLoads.get(url);
  if (pending) return verifyLoadedGlobal(pending, window, expectedGlobal, url);

  let script = findScript(document, url);
  const state = script?.getAttribute(stateAttribute) as ScriptState | null;
  if (state !== 'loading' && hasExpectedGlobal(window, expectedGlobal)) {
    if (state === 'error') script?.remove();
    return Promise.resolve();
  }
  if (script && state === 'loaded') {
    script.remove();
    script = null;
  } else if (script && state === 'error') {
    script.remove();
    script = null;
  }

  const scriptElement = script ?? document.createElement('script');
  scriptElement.async = true;
  scriptElement.src = url;
  scriptElement.setAttribute(stateAttribute, 'loading');

  const load = new Promise<void>((resolve, reject) => {
    const cleanupListeners = () => {
      scriptElement.removeEventListener('load', handleLoad);
      scriptElement.removeEventListener('error', handleError);
    };
    const fail = (error: Error) => {
      cleanupListeners();
      scriptElement.setAttribute(stateAttribute, 'error');
      scriptElement.remove();
      reject(error);
    };
    const handleLoad = () => {
      if (!hasExpectedGlobal(window, expectedGlobal)) {
        fail(new Error(`Mineradio script loaded without ${expectedGlobal}: ${url}`));
        return;
      }
      cleanupListeners();
      scriptElement.setAttribute(stateAttribute, 'loaded');
      resolve();
    };
    const handleError = () => fail(new Error(`Mineradio script load failed: ${url}`));

    scriptElement.addEventListener('load', handleLoad, { once: true });
    scriptElement.addEventListener('error', handleError, { once: true });
    if (!script) document.head.append(scriptElement);
  });

  documentLoads.set(url, load);
  const clearPending = () => {
    if (documentLoads.get(url) === load) documentLoads.delete(url);
  };
  void load.then(clearPending, clearPending);
  return load;
}

function findScript(document: Document, url: string): HTMLScriptElement | null {
  for (const script of document.head.querySelectorAll<HTMLScriptElement>('script[src]')) {
    if (script.src === url) return script;
  }
  return null;
}

function getDocumentLoads(document: Document): Map<string, Promise<void>> {
  const existing = pendingLoads.get(document);
  if (existing) return existing;
  const loads = new Map<string, Promise<void>>();
  pendingLoads.set(document, loads);
  return loads;
}

function hasExpectedGlobal(window: Window & typeof globalThis, expectedGlobal: string): boolean {
  return Boolean(expectedGlobal && (window as unknown as Record<string, unknown>)[expectedGlobal]);
}

function verifyLoadedGlobal(
  pending: Promise<void>,
  window: Window & typeof globalThis,
  expectedGlobal: string,
  url: string,
): Promise<void> {
  return pending.then(() => {
    if (!hasExpectedGlobal(window, expectedGlobal)) {
      throw new Error(`Mineradio script resolved without ${expectedGlobal}: ${url}`);
    }
  });
}
