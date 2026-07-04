import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { KernelAppManifest } from '@kernelon/core';

import {
  DesktopDock,
  resolveDockItemMagnification,
} from '../src/components/desktop-dock';

const dockApps: KernelAppManifest[] = [
  {
    id: 'onboarding',
    name: '新员工运作',
    description: '入职信息、阶段流程、状态跟踪、名册总览',
    priority: 'P0',
    category: 'operations',
    icon: 'UserRoundCheck',
    runtime: {
      window: {
        loaderKey: 'app:onboarding-window',
      },
    },
    defaultWindow: {
      title: '新员工运作',
      bounds: { height: 640, width: 960, x: 96, y: 72 },
    },
  },
  {
    id: 'mentor',
    name: '导师管理',
    description: '导师库、师徒匹配、带教任务与反馈',
    priority: 'P0',
    category: 'operations',
    icon: 'Handshake',
    runtime: {
      window: {
        loaderKey: 'app:mentor-window',
      },
    },
    defaultWindow: {
      title: '导师管理',
      bounds: { height: 620, width: 900, x: 144, y: 92 },
    },
  },
];

describe('DesktopDock', () => {
  it('magnifies the hovered dock item and softly lifts neighboring items', () => {
    const iconSize = 64;
    const focusedScale = resolveDockItemMagnification({ distance: 0, iconSize });
    const neighborScale = resolveDockItemMagnification({
      distance: iconSize * 1.2,
      iconSize,
    });
    const secondNeighborScale = resolveDockItemMagnification({
      distance: iconSize * 2.6,
      iconSize,
    });
    const outerNeighborScale = resolveDockItemMagnification({
      distance: iconSize * 4.8,
      iconSize,
    });
    const distantScale = resolveDockItemMagnification({
      distance: iconSize * 6.2,
      iconSize,
    });

    expect(focusedScale).toBeGreaterThan(1.6);
    expect(focusedScale).toBeLessThan(1.7);
    expect(neighborScale).toBeGreaterThan(1.5);
    expect(neighborScale).toBeLessThan(focusedScale);
    expect(secondNeighborScale).toBeGreaterThan(1.32);
    expect(secondNeighborScale).toBeLessThan(neighborScale);
    expect(outerNeighborScale).toBeGreaterThan(1.04);
    expect(outerNeighborScale).toBeLessThan(secondNeighborScale);
    expect(distantScale).toBe(1);
    expect(
      resolveDockItemMagnification({ distance: 0, iconSize, reducedMotion: true }),
    ).toBe(1);
  });

  it('keeps the rail height fixed while dock items grow the layout width upward', () => {
    render(
      <DesktopDock
        apps={dockApps}
        dockAppIds={['onboarding', 'mentor']}
        onOpenApp={vi.fn()}
        onToggleLauncher={vi.fn()}
        onToggleSpotlight={vi.fn()}
      />,
    );

    const dock = screen.getByTestId('kernelon-dock');

    expect(dock).toHaveClass('overflow-visible');
    expect(dock).toHaveAttribute('data-kernelon-dock-interacting', 'false');
    expect(dock.style.height).toBe('var(--dock-rail-height)');
    expect(dock).toHaveStyle('--dock-hover-progress: 0');
    expect(dock.style.getPropertyValue('--dock-hover-pad-y-add')).toBe('');

    const onboardingButton = screen.getByRole('button', { name: '新员工运作' });

    expect(onboardingButton).toHaveAttribute('data-kernelon-dock-motion', 'layout-width');
    expect(onboardingButton.style.width).toBe(
      'calc(var(--dock-icon-size) * var(--dock-item-scale))',
    );
    expect(onboardingButton.style.height).toBe(
      'calc(var(--dock-icon-size) * var(--dock-item-scale))',
    );

    fireEvent.pointerEnter(dock, { clientX: 320, pointerType: 'mouse' });
    fireEvent.pointerMove(dock, { clientX: 360, pointerType: 'mouse' });

    expect(dock).toHaveAttribute('data-kernelon-dock-interacting', 'true');
    expect(dock).toHaveStyle('--dock-hover-progress: 1');
    expect(dock.style.height).toBe('var(--dock-rail-height)');
    expect(dock.style.getPropertyValue('--dock-hover-pad-y-add')).toBe('');

    fireEvent.pointerLeave(dock);

    expect(dock).toHaveAttribute('data-kernelon-dock-interacting', 'false');
    expect(dock).toHaveStyle('--dock-hover-progress: 0');
  });
});
