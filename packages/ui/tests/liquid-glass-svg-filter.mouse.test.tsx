// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { createElement, type RefObject } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiquidGlassSvgFilter } from '../src';

describe('LiquidGlassSvgFilter mouse tracking', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('coalesces internal mouse tracking updates with requestAnimationFrame', () => {
    const mouseContainer = document.createElement('div');
    document.body.appendChild(mouseContainer);
    mouseContainer.getBoundingClientRect = () =>
      ({
        bottom: 50,
        height: 50,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const mouseContainerRef = { current: mouseContainer } as RefObject<HTMLElement | null>;
    const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    render(
      createElement(LiquidGlassSvgFilter, {
        children: 'content',
        mouseContainer: mouseContainerRef,
      }),
    );

    act(() => {
      mouseContainer.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 10, clientY: 10 }));
      mouseContainer.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 20, clientY: 20 }));
      mouseContainer.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 30, clientY: 30 }));
    });

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
  });
});
