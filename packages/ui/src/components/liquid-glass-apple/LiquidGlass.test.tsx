import '@testing-library/jest-dom/vitest';

import { fireEvent, render } from '@testing-library/react';
import type { ComponentType, PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';

type LiquidGlassTestProps = PropsWithChildren<{
  glassShadow?: string;
  renderBorder?: boolean;
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  onClick?: () => void;
}>;

async function loadLiquidGlassModule() {
  return (await import('../../index')) as Record<string, unknown>;
}

function getGlass(container: HTMLElement) {
  const glass = container.querySelector<HTMLElement>('.glass');

  if (!glass) {
    throw new Error('Expected LiquidGlass to render .glass');
  }

  return glass;
}

function getWarp(container: HTMLElement) {
  const warp = container.querySelector<HTMLElement>('.glass__warp');

  if (!warp) {
    throw new Error('Expected LiquidGlass to render .glass__warp');
  }

  return warp;
}

function getFirstDisplacementScale(container: HTMLElement) {
  return container.querySelector('feDisplacementMap')?.getAttribute('scale');
}

function getDisplacementMapHref(container: HTMLElement) {
  return container.querySelector('feImage')?.getAttribute('href');
}

describe('liquid-glass-apple components', () => {
  it('exports source-compatible default parameters', async () => {
    const ui = await loadLiquidGlassModule();

    expect(ui.liquidGlassAppleDefaults).toMatchObject({
      aberrationIntensity: 2,
      blurAmount: 0.0625,
      cornerRadius: 999,
      displacementScale: 70,
      elasticity: 0.15,
      mode: 'standard',
      overLight: false,
      padding: '24px 32px',
      saturation: 140,
    });
    expect(ui.liquidGlassAppleButtonDefaults).toMatchObject({
      aberrationIntensity: 2,
      blurAmount: 0.1,
      cornerRadius: 100,
      displacementScale: 64,
      elasticity: 0.35,
      mode: 'standard',
      overLight: false,
      padding: '8px 16px',
      saturation: 130,
    });
    expect(ui.liquidGlassAppleCardDefaults).toMatchObject({
      aberrationIntensity: 2,
      blurAmount: 0.5,
      cornerRadius: 32,
      displacementScale: 100,
      elasticity: 0,
      mode: 'standard',
      overLight: false,
      padding: '24px 32px',
      saturation: 140,
    });
  });

  it('renders the upstream LiquidGlass container with the original default optical values', async () => {
    const ui = await loadLiquidGlassModule();
    const LiquidGlass = ui.LiquidGlass as ComponentType<LiquidGlassTestProps>;
    const { container } = render(<LiquidGlass>Kernel glass</LiquidGlass>);
    const glass = getGlass(container);
    const warp = getWarp(container);

    expect(glass).toHaveStyle({
      borderRadius: '999px',
      boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.25)',
      padding: '24px 32px',
    });
    expect(warp.style.backdropFilter).toBe('blur(6px) saturate(140%)');
    expect(getFirstDisplacementScale(container)).toBe('-70');
  });

  it('renders a button shape using the upstream demo button parameters', async () => {
    const ui = await loadLiquidGlassModule();
    const LiquidGlassButton = ui.LiquidGlassButton as ComponentType<LiquidGlassTestProps>;
    const handleClick = vi.fn();
    const { container } = render(
      <LiquidGlassButton onClick={handleClick}>Log Out</LiquidGlassButton>,
    );
    const glass = getGlass(container);
    const warp = getWarp(container);

    fireEvent.click(container.querySelector('.cursor-pointer') as Element);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(glass).toHaveStyle({
      borderRadius: '100px',
      padding: '8px 16px',
    });
    expect(warp.style.backdropFilter).toBe('blur(7.2px) saturate(130%)');
    expect(getFirstDisplacementScale(container)).toBe('-64');
  });

  it('renders a card shape using the upstream demo card parameters', async () => {
    const ui = await loadLiquidGlassModule();
    const LiquidGlassCard = ui.LiquidGlassCard as ComponentType<LiquidGlassTestProps>;
    const { container } = render(<LiquidGlassCard>User Info</LiquidGlassCard>);
    const glass = getGlass(container);
    const warp = getWarp(container);

    expect(glass).toHaveStyle({
      borderRadius: '32px',
      padding: '24px 32px',
    });
    expect(warp.style.backdropFilter).toBe('blur(20px) saturate(140%)');
    expect(getFirstDisplacementScale(container)).toBe('-100');
  });

  it('allows menu surfaces to suppress only the upstream visual frame layers', async () => {
    const ui = await loadLiquidGlassModule();
    const LiquidGlass = ui.LiquidGlass as ComponentType<LiquidGlassTestProps>;
    const { container } = render(
      <LiquidGlass glassShadow="none" mode="prominent" renderBorder={false}>
        Menu glass
      </LiquidGlass>,
    );
    const glass = getGlass(container);
    const directBorderSpans = Array.from(container.children).filter(
      (child) => child.tagName === 'SPAN',
    );

    expect(glass).toHaveStyle({ boxShadow: 'none' });
    expect(directBorderSpans).toHaveLength(0);
    expect(getDisplacementMapHref(container)).toContain('data:image/png');
  });
});
