'use client';

import { createContext, type PointerEvent as ReactPointerEvent } from 'react';

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
