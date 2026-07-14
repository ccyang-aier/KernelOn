// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { stopMineradioGestureCapture } from '../src/apps/music/mineradio/runtime/gesture-capture-lifecycle';

describe('Mineradio gesture capture lifecycle', () => {
  it('stops Camera, every MediaStream track and the hidden video', () => {
    const firstTrack = { stop: vi.fn() };
    const secondTrack = { stop: vi.fn() };
    const camera = { stop: vi.fn() };
    const video = createVideoWithStream([firstTrack, secondTrack]);
    const remove = vi.spyOn(video, 'remove');

    stopMineradioGestureCapture(camera, video);

    expect(camera.stop).toHaveBeenCalledOnce();
    expect(firstTrack.stop).toHaveBeenCalledOnce();
    expect(secondTrack.stop).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('continues through Camera and individual track failures', () => {
    const failedTrack = {
      stop: vi.fn(() => {
        throw new Error('track failed');
      }),
    };
    const remainingTrack = { stop: vi.fn() };
    const camera = {
      stop: vi.fn(() => {
        throw new Error('camera failed');
      }),
    };
    const video = createVideoWithStream([failedTrack, remainingTrack]);
    const remove = vi.spyOn(video, 'remove');

    expect(() => stopMineradioGestureCapture(camera, video)).not.toThrow();
    expect(failedTrack.stop).toHaveBeenCalledOnce();
    expect(remainingTrack.stop).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });
});

function createVideoWithStream(tracks: Array<{ stop(): void }>): HTMLVideoElement {
  const video = document.createElement('video');
  Object.defineProperty(video, 'srcObject', {
    configurable: true,
    value: { getTracks: () => tracks },
  });
  document.body.append(video);
  return video;
}
