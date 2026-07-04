'use client';

import { toCanvas } from 'html-to-image';
import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';

import type { KernelAppManifest, WindowDescriptor } from '@kernelon/core';

import type { AppWindowSurfaceProps, ShellRuntimeRegistry } from '../runtime';
import { AppWindowContainer, resolveWindowDisplayBounds } from './app-window-container';
import { flattenGenieSnapshotCanvas } from './genie-snapshot-compositor';

export interface GenieSnapshotStageProps {
  appIds: string[];
  apps: KernelAppManifest[];
  onSnapshotReady(appId: string, snapshot: HTMLCanvasElement): void;
  runtime: ShellRuntimeRegistry;
}

export function GenieSnapshotStage({
  appIds,
  apps,
  onSnapshotReady,
  runtime,
}: GenieSnapshotStageProps) {
  const [isMounted, setIsMounted] = useState(false);
  const snapshotApps = appIds
    .map((appId) => apps.find((app) => app.id === appId))
    .filter((app): app is KernelAppManifest => Boolean(app));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!isMounted || shouldSkipSnapshotStage()) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="kernelon-genie-snapshot-stage"
      style={{
        left: -10000,
        pointerEvents: 'none',
        position: 'fixed',
        top: 0,
      }}
    >
      {snapshotApps.map((app) => (
        <GenieSnapshotItem
          app={app}
          key={app.id}
          onSnapshotReady={onSnapshotReady}
          runtime={runtime}
        />
      ))}
    </div>
  );
}

function GenieSnapshotItem({
  app,
  onSnapshotReady,
  runtime,
}: Readonly<{
  app: KernelAppManifest;
  onSnapshotReady(appId: string, snapshot: HTMLCanvasElement): void;
  runtime: ShellRuntimeRegistry;
}>) {
  const captureRootRef = useRef<HTMLDivElement | null>(null);
  const [AppWindowComponent, setAppWindowComponent] =
    useState<ComponentType<AppWindowSurfaceProps> | null>(null);
  const displayBounds = useMemo(
    () => resolveWindowDisplayBounds(app.defaultWindow.bounds),
    [app.defaultWindow.bounds],
  );
  const snapshotWindow = useMemo<WindowDescriptor>(
    () => ({
      appId: app.id,
      bounds: {
        ...displayBounds,
        x: 0,
        y: 0,
      },
      createdAt: 0,
      id: `genie-snapshot:${app.id}`,
      status: 'active',
      title: app.defaultWindow.title ?? app.name,
      zIndex: 1,
    }),
    [app, displayBounds],
  );

  useEffect(() => {
    let cancelled = false;

    void runtime.loadAppWindow(app.runtime.window.loaderKey).then((module) => {
      if (!cancelled) {
        setAppWindowComponent(() => module.default);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [app.runtime.window.loaderKey, runtime]);

  useEffect(() => {
    if (!AppWindowComponent) {
      return undefined;
    }

    let cancelled = false;
    let timeoutHandle = 0;
    let idleHandle: number | null = null;

    const capture = async () => {
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)));

      if (cancelled) {
        return;
      }

      const sourceElement = captureRootRef.current?.querySelector<HTMLElement>(
        '[data-genie-effect-source]',
      );

      if (!sourceElement) {
        return;
      }

      const sourceRect = sourceElement.getBoundingClientRect();
      const sourceWidth = Math.max(1, Math.round(sourceRect.width));
      const sourceHeight = Math.max(1, Math.round(sourceRect.height));

      try {
        const snapshot = await toCanvas(sourceElement, {
          cacheBust: false,
          height: sourceHeight,
          pixelRatio: 1,
          style: {
            opacity: '1',
            transform: 'none',
          },
          width: sourceWidth,
        });

        if (!cancelled) {
          onSnapshotReady(app.id, flattenGenieSnapshotCanvas(snapshot));
        }
      } catch (error) {
        console.error('KernelOn genie snapshot failed:', error);
      }
    };

    const requestIdleCallback = window.requestIdleCallback;

    if (typeof requestIdleCallback === 'function') {
      idleHandle = requestIdleCallback(() => {
        void capture();
      });
    } else {
      timeoutHandle = window.setTimeout(() => {
        void capture();
      }, 50);
    }

    return () => {
      cancelled = true;

      if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }

      window.clearTimeout(timeoutHandle);
    };
  }, [AppWindowComponent, app.id, onSnapshotReady, snapshotWindow.bounds.height, snapshotWindow.bounds.width]);

  return (
    <div
      ref={captureRootRef}
      style={{
        height: snapshotWindow.bounds.height,
        marginBottom: 24,
        position: 'relative',
        width: snapshotWindow.bounds.width,
      }}
    >
      {AppWindowComponent ? (
        <AppWindowContainer
          app={app}
          onClose={noop}
          onFocus={noop}
          onMinimize={noopMinimize}
          onResize={noopResize}
          onToggleFullscreen={noopResize}
          window={snapshotWindow}
        >
          {createElement(AppWindowComponent, {
            app,
            window: snapshotWindow,
          })}
        </AppWindowContainer>
      ) : null}
    </div>
  );
}

function noop() {}

function noopMinimize() {}

function noopResize() {}

function shouldSkipSnapshotStage(): boolean {
  return navigator.userAgent.includes('jsdom');
}
