import { describe, expect, it } from 'vitest';

import { createAppRegistry, type KernelAppManifest } from '../src';

const onboardingApp: KernelAppManifest = {
  id: 'onboarding',
  name: '新员工运作',
  description: '入职信息、阶段流程、状态跟踪、名册总览',
  priority: 'P0',
  category: 'operations',
  icon: 'UserRoundCheck',
  dockedByDefault: true,
  runtime: {
    window: {
      loaderKey: 'app:onboarding-window',
    },
  },
  defaultWindow: {
    bounds: { x: 96, y: 72, width: 960, height: 640 },
  },
};

describe('createAppRegistry', () => {
  it('indexes app manifests by id', () => {
    const registry = createAppRegistry([onboardingApp]);

    expect(registry.all()).toHaveLength(1);
    expect(registry.get('onboarding')?.name).toBe('新员工运作');
    expect(registry.require('onboarding')).toEqual(onboardingApp);
  });

  it('rejects duplicate app ids', () => {
    expect(() => createAppRegistry([onboardingApp, onboardingApp])).toThrow(
      'Duplicate KernelOn app id: onboarding',
    );
  });
});
