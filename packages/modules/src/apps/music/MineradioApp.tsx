'use client';

import { useLayoutEffect, useRef } from 'react';

import type { WindowDescriptor } from '@kernelon/core';

import { useMineradioHost } from './host/use-mineradio-host';
import { mountPortedMineradioRuntime } from './mineradio/generated/runtime';
import { mineradioStyles } from './mineradio/generated/styles';
import { mineradioTemplate } from './mineradio/generated/template';
import type { MineradioRuntimeInstance } from './mineradio/runtime/environment';
import { createScopedMineradioEnvironment } from './mineradio/runtime/scoped-browser-environment';

export interface MineradioAppProps {
  window: WindowDescriptor;
}

export function MineradioApp({ window: descriptor }: MineradioAppProps) {
  const host = useMineradioHost(descriptor);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<MineradioRuntimeInstance | null>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return undefined;

    const shadowRoot = surface.shadowRoot ?? surface.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const root = document.createElement('div');

    style.dataset.mineradioStyle = 'ported';
    style.textContent = mineradioStyles;
    root.className = 'mineradio-root';
    try {
      root.classList.add(
        host.localStorage.getItem('mineradio-diy-player-mode-v1') === '1'
          ? 'diy-mode-preload'
          : 'simple-mode-preload',
      );
    } catch {
      root.classList.add('simple-mode-preload');
    }
    root.innerHTML = mineradioTemplate;
    root.querySelectorAll('.desktop-window-btn').forEach((button) => button.remove());
    shadowRoot.replaceChildren(style, root);
    const unbindWindowChrome = host.bindWindowChrome(root);
    const releaseAppCapabilities = host.acquireAppCapabilities();

    const environment = createScopedMineradioEnvironment({ host, root, shadowRoot });
    let runtime: MineradioRuntimeInstance;
    try {
      runtime = mountPortedMineradioRuntime(environment);
    } catch (error) {
      try {
        unbindWindowChrome();
      } finally {
        try {
          environment.abort();
        } finally {
          releaseAppCapabilities();
          shadowRoot.replaceChildren();
        }
      }
      throw error;
    }
    runtimeRef.current = runtime;

    return () => {
      try {
        unbindWindowChrome();
      } finally {
        try {
          runtime.destroy();
        } finally {
          releaseAppCapabilities();
          runtimeRef.current = null;
          shadowRoot.replaceChildren();
        }
      }
    };
  }, [host]);

  useLayoutEffect(() => {
    runtimeRef.current?.setVisibility(descriptor.status !== 'minimized');
  }, [descriptor.status]);

  return (
    <div
      className="h-full min-h-0 w-full min-w-0 overflow-hidden bg-black"
      data-mineradio-app-surface="true"
      ref={surfaceRef}
    />
  );
}
