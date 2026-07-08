// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react';
import { createElement, type RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  clearColor: vi.fn(),
  cancelAnimationFrame: vi.fn(),
  deleteTexture: vi.fn(),
  dispose: vi.fn(),
  loadTextureFromURL: vi.fn(),
  render: vi.fn(),
  requestAnimationFrame: vi.fn(),
  resize: vi.fn(),
  setUniforms: vi.fn(),
  viewport: vi.fn(),
}));

vi.mock('../src/components/liquid-glass-studio/studio/rendering/GLUtils', () => ({
  MultiPassRenderer: vi.fn().mockImplementation(function MultiPassRendererMock() {
    return {
      dispose: mocks.dispose,
      render: mocks.render,
      resize: mocks.resize,
      setUniforms: mocks.setUniforms,
    };
  }),
  loadTextureFromURL: mocks.loadTextureFromURL,
}));

vi.mock('../src/components/liquid-glass-studio/studio/shaders/glsl', () => ({
  FragmentBgHblurShader: '',
  FragmentBgShader: '',
  FragmentBgVblurShader: '',
  FragmentMainShader: '',
  VertexShader: '',
}));

vi.mock('../src/components/liquid-glass-studio/studio/utils', () => ({
  computeGaussianKernelByRadius: () => [1],
}));

import { LiquidGlassStudioSurface } from '../src/components/liquid-glass-studio/LiquidGlassStudioSurface';

describe('LiquidGlassStudioSurface scroll sampling', () => {
  beforeEach(() => {
    mocks.loadTextureFromURL.mockResolvedValue({ ratio: 1, texture: {} });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContextMock(
      contextId,
    ) {
      if (contextId !== 'webgl2') {
        return null;
      }

      return {
        COLOR_BUFFER_BIT: 1,
        DEPTH_BUFFER_BIT: 2,
        clear: mocks.clear,
        clearColor: mocks.clearColor,
        deleteTexture: mocks.deleteTexture,
        viewport: mocks.viewport,
      } as unknown as RenderingContext;
    });
    mocks.requestAnimationFrame.mockImplementation(function requestAnimationFrameMock() {
      return 1;
    });
    mocks.cancelAnimationFrame.mockImplementation(function cancelAnimationFrameMock() {
      return undefined;
    });
    vi.stubGlobal('requestAnimationFrame', mocks.requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', mocks.cancelAnimationFrame);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('queues a fresh render when the explicit background scroll container scrolls', async () => {
    const host = document.createElement('div');
    const scrollContainer = document.createElement('div');
    document.body.append(host, scrollContainer);

    const backgroundHostRef = { current: host } as RefObject<HTMLElement | null>;
    const backgroundScrollRef = {
      current: scrollContainer,
    } as RefObject<HTMLElement | null>;
    const addEventListenerSpy = vi.spyOn(scrollContainer, 'addEventListener');

    await act(async () => {
      render(
        createElement(
          LiquidGlassStudioSurface,
          {
            backgroundHostRef,
            backgroundImage: '/kernelon-assets/wallpapers/kernelon-flower-wallpaper.png',
            backgroundScrollRef,
            children: createElement('button', { type: 'button' }, 'Home'),
            height: 42,
            radius: 999,
            width: 190,
          },
        ),
      );
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true },
      );
    });

    mocks.requestAnimationFrame.mockClear();

    act(() => {
      scrollContainer.dispatchEvent(new window.Event('scroll'));
    });

    expect(mocks.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});
