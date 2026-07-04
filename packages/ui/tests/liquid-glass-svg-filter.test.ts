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
});
