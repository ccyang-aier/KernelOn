'use client';

import { createContext, useContext, type PointerEvent as ReactPointerEvent } from 'react';

import type { AppHeaderCommandPayload } from '../app-header';

export interface AppFrameWindowContextValue {
  getSourceElement(): HTMLElement | null;
  isFullscreen: boolean;
  onBeginMove(event: ReactPointerEvent<HTMLElement>): void;
  onClose(): void;
  onHeaderCommand(payload: AppHeaderCommandPayload): void;
  onMinimize(sourceElement: HTMLElement | null): void;
  onToggleFullscreen(): void;
  topLayer: boolean;
  windowId: string;
  windowTitle: string;
}

export const AppFrameWindowContext = createContext<AppFrameWindowContextValue | null>(null);

export function useAppWindowHost(): AppFrameWindowContextValue {
  const context = useContext(AppFrameWindowContext);

  if (!context) {
    throw new Error('useAppWindowHost must be used inside an AppWindowContainer');
  }

  return context;
}
