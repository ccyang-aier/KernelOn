const lifecycleAbortMarker = Symbol('kernelon.mineradio.lifecycle-abort');

type LifecycleAbort = DOMException & {
  [lifecycleAbortMarker]?: true;
};

export function createMineradioLifecycleAbort(): DOMException {
  const error = new DOMException('Mineradio runtime destroyed', 'AbortError') as LifecycleAbort;
  Object.defineProperty(error, lifecycleAbortMarker, { value: true });
  return error;
}

export function isMineradioLifecycleAbort(error: unknown): boolean {
  return Boolean(
    typeof error === 'object' &&
      error !== null &&
      (error as LifecycleAbort)[lifecycleAbortMarker],
  );
}
