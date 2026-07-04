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
      distance: iconSize * 1.12,
      iconSize,
    });
    const secondNeighborScale = resolveDockItemMagnification({
      distance: iconSize * 2.05,
      iconSize,
    });
    const distantScale = resolveDockItemMagnification({
      distance: iconSize * 3.1,
      iconSize,
    });

    expect(focusedScale).toBeCloseTo(1.36);
    expect(neighborScale).toBeGreaterThan(1.18);
    expect(neighborScale).toBeLessThan(focusedScale);
    expect(secondNeighborScale).toBeGreaterThan(1.06);
    expect(secondNeighborScale).toBeLessThan(neighborScale);
    expect(distantScale).toBe(1);
  });

  it('enters an elastic hover state without changing the dock action surface', () => {
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

    expect(dock).toHaveAttribute('data-kernelon-dock-interacting', 'false');
    expect(dock).toHaveStyle('--dock-hover-progress: 0');

    fireEvent.pointerEnter(dock, { clientX: 320, pointerType: 'mouse' });
    fireEvent.pointerMove(dock, { clientX: 360, pointerType: 'mouse' });

    expect(dock).toHaveAttribute('data-kernelon-dock-interacting', 'true');
    expect(dock).toHaveStyle('--dock-hover-progress: 1');
    expect(screen.getByRole('button', { name: '新员工运作' })).toHaveAttribute(
      'data-kernelon-dock-motion',
      'distance-field',
    );

    fireEvent.pointerLeave(dock);

    expect(dock).toHaveAttribute('data-kernelon-dock-interacting', 'false');
    expect(dock).toHaveStyle('--dock-hover-progress: 0');
  });
});
