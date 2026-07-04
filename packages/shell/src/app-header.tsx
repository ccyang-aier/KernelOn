'use client';

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';

import type { AppHeaderDescriptor } from '@kernelon/core';

export interface AppHeaderCommandPayload {
  commandId: string;
  itemId: string;
  type: 'button' | 'navigation' | 'search' | 'segment';
  value?: string;
  windowId: string;
}

export type AppHeaderCommandHandler = (payload: AppHeaderCommandPayload) => void;

export interface AppHeaderController {
  windowId: string;
  clearHeader(): void;
  clearSlot(slotId: string): void;
  registerCommand(commandId: string, handler: AppHeaderCommandHandler): () => void;
  setHeader(header: AppHeaderDescriptor | undefined): void;
  setSlot(slotId: string, children: ReactNode): void;
}

export const AppHeaderContext = createContext<AppHeaderController | null>(null);

export function useAppHeader(): AppHeaderController {
  const controller = useContext(AppHeaderContext);

  if (!controller) {
    throw new Error('useAppHeader must be used inside an app window container');
  }

  return controller;
}

export function AppHeaderSlot({
  children,
  id,
}: Readonly<{
  children: ReactNode;
  id: string;
}>) {
  const header = useAppHeader();

  useEffect(() => {
    header.setSlot(id, children);

    return () => header.clearSlot(id);
  }, [children, header, id]);

  return null;
}
