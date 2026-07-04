import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';

import {
  GenieEffectLayer,
  type GenieEffectLayerHandle,
} from '../src/components/genie-effect-layer';

describe('GenieEffectLayer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('hides the live source before the first minimize snapshot frame is drawn', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Chrome',
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });

    const sourceElement = document.createElement('section');
    const targetElement = document.createElement('button');
    const snapshot = document.createElement('canvas');
    const sourceOpacityAtDraw: string[] = [];
    const context = {
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      clearRect: vi.fn(),
      drawImage: vi.fn(() => {
        sourceOpacityAtDraw.push(sourceElement.style.opacity);
      }),
      fillRect: vi.fn(),
      fillStyle: '',
      restore: vi.fn(),
      save: vi.fn(),
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    snapshot.height = 160;
    snapshot.width = 240;
    sourceElement.style.opacity = '1';
    document.body.append(sourceElement, targetElement);
    targetElement.getBoundingClientRect = vi.fn(() => ({
      bottom: 850,
      height: 60,
      left: 690,
      right: 750,
      toJSON: () => ({}),
      top: 790,
      width: 60,
      x: 690,
      y: 790,
    }));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    let animationFrameId = 0;
    let animationTime = 0;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const frameTime = animationTime;

      animationFrameId += 1;
      animationTime += 600;
      queueMicrotask(() => {
        callback(frameTime);
      });

      return animationFrameId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const ref = createRef<GenieEffectLayerHandle>();
    render(<GenieEffectLayer ref={ref} />);

    await act(async () => {
      const played = await ref.current?.play({
        direction: 'minimize',
        snapshot,
        sourceElement,
        sourceRect: {
          height: 160,
          width: 240,
          x: 96,
          y: 72,
        },
        targetElement,
      });

      expect(played).toBe(true);
    });

    expect(sourceOpacityAtDraw[0]).toBe('0');
    expect(sourceElement).toHaveStyle({ opacity: '0', pointerEvents: 'none' });
  });
});
