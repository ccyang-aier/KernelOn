export interface GenieSnapshotMatte {
  b: number;
  g: number;
  r: number;
}

const DEFAULT_MATTE: GenieSnapshotMatte = { b: 252, g: 250, r: 246 };
const MIN_INTERIOR_ALPHA = 160;
const OPAQUE_ALPHA = 255;

export function flattenGenieSnapshotCanvas(snapshot: HTMLCanvasElement): HTMLCanvasElement {
  const context = getCanvasContext(snapshot);

  if (!context || snapshot.width <= 0 || snapshot.height <= 0) {
    return snapshot;
  }

  try {
    const imageData = context.getImageData(0, 0, snapshot.width, snapshot.height);
    const flattened = flattenGenieSnapshotPixels(imageData.data);

    imageData.data.set(flattened);
    context.putImageData(imageData, 0, 0);
  } catch {
    return snapshot;
  }

  return snapshot;
}

export function flattenGenieSnapshotPixels(
  pixels: Uint8ClampedArray,
  matte: GenieSnapshotMatte = DEFAULT_MATTE,
): Uint8ClampedArray {
  const flattened = new Uint8ClampedArray(pixels);

  for (let offset = 0; offset < flattened.length; offset += 4) {
    const alpha = flattened[offset + 3] ?? 0;

    if (alpha < MIN_INTERIOR_ALPHA || alpha >= OPAQUE_ALPHA) {
      continue;
    }

    const opacity = alpha / OPAQUE_ALPHA;

    flattened[offset] = compositeChannel(flattened[offset] ?? 0, matte.r, opacity);
    flattened[offset + 1] = compositeChannel(flattened[offset + 1] ?? 0, matte.g, opacity);
    flattened[offset + 2] = compositeChannel(flattened[offset + 2] ?? 0, matte.b, opacity);
    flattened[offset + 3] = OPAQUE_ALPHA;
  }

  return flattened;
}

function compositeChannel(foreground: number, background: number, opacity: number): number {
  return Math.round(foreground * opacity + background * (1 - opacity));
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext('2d', { willReadFrequently: true });
  } catch {
    return null;
  }
}
