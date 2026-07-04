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
        { style: { left: 12, position: 'absolute', top: 34 } },
        'content',
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
});
