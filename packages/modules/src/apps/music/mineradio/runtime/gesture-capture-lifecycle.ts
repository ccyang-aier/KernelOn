type StoppableCamera = {
  stop?: () => unknown;
};

type MediaStreamLike = {
  getTracks(): Array<{ stop(): void }>;
};

/**
 * Releases MediaPipe Camera resources independently so one third-party stop
 * failure cannot leave another MediaStreamTrack recording after App close.
 */
export function stopMineradioGestureCapture(
  camera: StoppableCamera | null,
  video: HTMLVideoElement | null,
): void {
  safely(() => camera?.stop?.call(camera));

  const stream = video?.srcObject;
  if (hasMediaStreamTracks(stream)) {
    for (const track of stream.getTracks()) safely(() => track.stop());
  }

  safely(() => video?.remove());
}

function hasMediaStreamTracks(value: unknown): value is MediaStreamLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getTracks' in value &&
    typeof value.getTracks === 'function'
  );
}

function safely(action: () => unknown): void {
  try {
    const result = action();
    if (result instanceof Promise) void result.catch(() => undefined);
  } catch {
    // Camera/track teardown is exhaustive and best-effort by design.
  }
}
