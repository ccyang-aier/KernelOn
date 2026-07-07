import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiquidGlassSvgFilter } from '../src';

describe('LiquidGlassSvgFilter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is exported from the global UI package', () => {
    expect(typeof LiquidGlassSvgFilter).toBe('function');
    expect(LiquidGlassSvgFilter.name).toBe('LiquidGlassSvgFilter');
  });

  it('declares an explicit client component boundary', () => {
    const source = readFileSync(
      new URL('../src/components/liquid-glass-svg-filter/index.tsx', import.meta.url),
      'utf8',
    );

    expect(source.startsWith("'use client'")).toBe(true);
  });

  it('does not read browser globals during server rendering', () => {
    vi.stubGlobal('navigator', undefined);

    expect(() => {
      renderToStaticMarkup(createElement(LiquidGlassSvgFilter, null, 'content'));
    }).not.toThrow();
  });

  it('renders an inert host while preserving positioned glass layers', () => {
    const markup = renderToStaticMarkup(
      createElement(
        LiquidGlassSvgFilter,
        { children: 'content', style: { left: 12, position: 'absolute', top: 34 } },
      ),
    );

    const hostOpenTag = markup.match(/^<div\b[^>]*>/)?.[0] ?? '';

    expect(hostOpenTag).toContain('data-slot="liquid-glass-svg-filter"');
    expect(hostOpenTag).toContain('position:absolute');
    expect(hostOpenTag).toContain('top:0');
    expect(hostOpenTag).toContain('left:0');
    expect(hostOpenTag).toContain('width:0');
    expect(hostOpenTag).toContain('height:0');
    expect(hostOpenTag).toContain('overflow:visible');
    expect(hostOpenTag).not.toContain('transform:');
    expect(markup).toContain('position:absolute;top:34px;left:12px;height:69px;width:270px');
    expect(markup).toContain('transform:translate(calc(-50% + 0px), calc(-50% + 0px)) scale(1)');
  });

  it('renders a built-in border surface by default without shadow styles', () => {
    const markup = renderToStaticMarkup(
      createElement(LiquidGlassSvgFilter, {
        children: 'content',
      }),
    );

    expect(markup).not.toContain('box-shadow');
    expect(markup).not.toContain('text-shadow');
    expect(markup).toContain('data-liquid-glass-container-border="screen"');
    expect(markup).toContain('data-liquid-glass-container-border="overlay"');
    expect(markup).toContain('rgba(255, 255, 255, 0.34)');
    expect(markup).toContain('rgba(255, 255, 255, 0.13)');
    expect(markup).not.toContain('0 1px 4px rgba(0, 0, 0, 0.35)');
  });

  it('accepts appearance classes for non-material chrome tuning', () => {
    const markup = renderToStaticMarkup(
      createElement(LiquidGlassSvgFilter, {
        appearanceClassName: '[--ko-liquid-glass-border-strong:transparent] glass-pop-in',
        children: 'content',
      }),
    );

    const glassContainerOpenTag = markup.match(/<div class="relative[^"]*" style="[^"]*">/)?.[0] ?? '';

    expect(glassContainerOpenTag).toContain('[--ko-liquid-glass-border-strong:transparent]');
    expect(glassContainerOpenTag).toContain('glass-pop-in');
    expect(markup).toContain('data-liquid-glass-container-border="screen"');
    expect(markup).toContain('data-liquid-glass-container-border="overlay"');
  });

  it('ignores unsafe style fields that would alter the glass material', () => {
    const markup = renderToStaticMarkup(
      createElement(
        LiquidGlassSvgFilter,
        {
          children: 'content',
          style: {
            filter: 'blur(20px)',
            isolation: 'isolate',
            opacity: 0.2,
            overflow: 'hidden',
            position: 'absolute',
            transform: 'scale(4)',
          } as never,
        },
      ),
    );

    const glassContainerOpenTag = markup.match(/<div class="relative[^"]*" style="[^"]*">/)?.[0] ?? '';

    expect(glassContainerOpenTag).not.toContain('filter:blur(20px)');
    expect(glassContainerOpenTag).not.toContain('isolation:isolate');
    expect(glassContainerOpenTag).not.toContain('opacity:0.2');
    expect(glassContainerOpenTag).not.toContain('overflow:hidden');
    expect(glassContainerOpenTag).not.toContain('transform:scale(4)');
    expect(glassContainerOpenTag).toContain(
      'transform:translate(calc(-50% + 0px), calc(-50% + 0px)) scale(1)',
    );
  });

  it('rejects unsafe style fields at the type boundary', () => {
    createElement(
      LiquidGlassSvgFilter,
      {
        children: 'content',
        // @ts-expect-error LiquidGlassSvgFilter style only accepts placement fields.
        style: { opacity: 0.2 },
      },
    );

    createElement(
      LiquidGlassSvgFilter,
      {
        children: 'content',
        // @ts-expect-error LiquidGlassSvgFilter anchors surfaces from top/left only.
        style: { bottom: 12, position: 'absolute', right: 24 },
      },
    );
  });

  it('treats the glass filter as a non-interactive visual surface', () => {
    createElement(
      LiquidGlassSvgFilter,
      {
        children: 'content',
        // @ts-expect-error containerBorderMode has been replaced by appearanceClassName.
        containerBorderMode: 'external',
      },
    );

    createElement(
      LiquidGlassSvgFilter,
      {
        children: 'content',
        // @ts-expect-error LiquidGlassSvgFilter is a visual surface; compose real controls inside it.
        onClick: () => undefined,
      },
    );

    const markup = renderToStaticMarkup(
      createElement(LiquidGlassSvgFilter, {
        children: 'content',
        onClick: () => undefined,
      } as never),
    );

    expect(markup).not.toContain('cursor-pointer');
    expect(markup).not.toContain('radial-gradient(circle at 50% 0%');
  });

  it('mirrors backdrop blur through the WebKit-prefixed property', () => {
    const markup = renderToStaticMarkup(
      createElement(LiquidGlassSvgFilter, {
        blurAmount: 0.5,
        children: 'content',
        saturation: 140,
      }),
    );

    expect(markup).toContain('backdrop-filter:blur(20px) saturate(140%)');
    expect(markup).toContain('-webkit-backdrop-filter:blur(20px) saturate(140%)');
  });

  it('marks Firefox as a reduced SVG filter mode', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Firefox/128.0',
    });

    const markup = renderToStaticMarkup(
      createElement(LiquidGlassSvgFilter, {
        children: 'content',
      }),
    );

    const warpOpenTag = markup.match(/<span class="glass__warp[^"]*"[^>]*>/)?.[0] ?? '';

    expect(warpOpenTag).toContain('data-liquid-glass-render-mode="reduced"');
    expect(warpOpenTag).not.toContain('filter:url(');
  });

  it('marks unsupported backdrop-filter environments as flat mode', () => {
    vi.stubGlobal('CSS', {
      supports: vi.fn(() => false),
    });

    const markup = renderToStaticMarkup(
      createElement(LiquidGlassSvgFilter, {
        children: 'content',
      }),
    );

    const warpOpenTag = markup.match(/<span class="glass__warp[^"]*"[^>]*>/)?.[0] ?? '';

    expect(warpOpenTag).toContain('data-liquid-glass-render-mode="flat"');
    expect(warpOpenTag).not.toContain('filter:url(');
    expect(warpOpenTag).not.toContain('backdrop-filter:');
    expect(warpOpenTag).not.toContain('-webkit-backdrop-filter:');
  });
});
