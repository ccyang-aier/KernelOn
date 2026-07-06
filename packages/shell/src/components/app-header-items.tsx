'use client';

import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import type { AppHeaderItem } from '@kernelon/core';
import {
  AppHeaderButton,
  AppHeaderGroup,
  AppHeaderSearchField,
  AppHeaderSegmentedControl,
  cn,
} from '@kernelon/ui';

import type { AppHeaderCommandPayload } from '../app-header';
import { resolveAppHeaderIcon } from './app-header-icons';

export function AppHeaderItems({
  chromeVariant = 'standard',
  items,
  onCommand,
  section,
  slots,
  windowId,
}: Readonly<{
  chromeVariant?: AppHeaderChromeVariant;
  items: AppHeaderItem[];
  onCommand(payload: AppHeaderCommandPayload): void;
  section: string;
  slots: Readonly<Record<string, ReactNode>>;
  windowId: string;
}>) {
  const isTopLayerChrome = chromeVariant === 'top-layer';

  return items.map((item, index) => {
    if (item.type === 'navigation') {
      return (
        <AppHeaderGroup
          key={`${section}:navigation:${index}`}
          onPointerDown={stopHeaderControlDrag}
        >
          <AppHeaderButton
            aria-label="Back"
            className="h-7 w-7 px-0"
            disabled={!item.backCommandId}
            onClick={() => {
              if (item.backCommandId) {
                onCommand({
                  commandId: item.backCommandId,
                  itemId: `${section}:back`,
                  type: 'navigation',
                  windowId,
                });
              }
            }}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </AppHeaderButton>
          <AppHeaderButton
            aria-label="Forward"
            className="h-7 w-7 px-0"
            disabled={!item.forwardCommandId}
            onClick={() => {
              if (item.forwardCommandId) {
                onCommand({
                  commandId: item.forwardCommandId,
                  itemId: `${section}:forward`,
                  type: 'navigation',
                  windowId,
                });
              }
            }}
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </AppHeaderButton>
        </AppHeaderGroup>
      );
    }

    if (item.type === 'button') {
      const Icon = resolveAppHeaderIcon(item.icon);

      return (
        <AppHeaderButton
          aria-label={item.label}
          className={isTopLayerChrome ? topLayerIconButtonClassName : undefined}
          key={`${section}:button:${item.id}`}
          onClick={() =>
            onCommand({
              commandId: item.commandId,
              itemId: item.id,
              type: 'button',
              windowId,
            })
          }
          onPointerDown={stopHeaderControlDrag}
        >
          <Icon
            aria-hidden="true"
            className={isTopLayerChrome ? 'relative z-10 size-[21px]' : 'size-3.5'}
            strokeWidth={isTopLayerChrome ? 2.25 : undefined}
          />
          <span className={cn('truncate', isTopLayerChrome ? 'hidden' : '')}>{item.label}</span>
        </AppHeaderButton>
      );
    }

    if (item.type === 'segment') {
      if (isTopLayerChrome) {
        return (
          <AppHeaderGroup
            className={topLayerSegmentGroupClassName}
            key={`${section}:segment:${item.id}`}
            onPointerDown={stopHeaderControlDrag}
            role="group"
          >
            {item.options.map((option) => {
              const selected = option.value === item.value;

              return (
                <AppHeaderButton
                  aria-pressed={selected}
                  className={cn(
                    topLayerSegmentButtonClassName,
                    selected ? topLayerSegmentButtonActiveClassName : '',
                  )}
                  key={option.value}
                  onClick={() =>
                    onCommand({
                      commandId: item.commandId ?? `${item.id}.change`,
                      itemId: item.id,
                      type: 'segment',
                      value: option.value,
                      windowId,
                    })
                  }
                  selected={false}
                >
                  {option.label}
                </AppHeaderButton>
              );
            })}
          </AppHeaderGroup>
        );
      }

      return (
        <AppHeaderSegmentedControl
          key={`${section}:segment:${item.id}`}
          onPointerDown={stopHeaderControlDrag}
          onValueChange={(value) =>
            onCommand({
              commandId: item.commandId ?? `${item.id}.change`,
              itemId: item.id,
              type: 'segment',
              value,
              windowId,
            })
          }
          options={item.options}
          value={item.value}
        />
      );
    }

    if (item.type === 'search') {
      return (
        <AppHeaderSearchField
          key={`${section}:search:${item.id}`}
          leadingIcon={<Search aria-hidden="true" className="size-3.5" />}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onCommand({
                commandId: item.commandId,
                itemId: item.id,
                type: 'search',
                value: event.currentTarget.value,
                windowId,
              });
            }
          }}
          onPointerDown={stopHeaderControlDrag}
          placeholder={item.placeholder}
        />
      );
    }

    return (
      <div
        className="contents"
        key={`${section}:slot:${item.id}`}
        onPointerDown={stopHeaderControlDrag}
      >
        {slots[item.id] ?? null}
      </div>
    );
  });
}

type AppHeaderChromeVariant = 'standard' | 'top-layer';

function stopHeaderControlDrag(event: ReactPointerEvent<HTMLElement>) {
  event.stopPropagation();
}

const topLayerIconButtonClassName =
  'relative h-[42px] w-[42px] min-w-[42px] gap-0 overflow-hidden rounded-full border-white/15 bg-[rgba(25,27,30,0.50)] px-0 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_30px_rgba(0,0,0,0.22)] backdrop-blur-[22px] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out before:pointer-events-none before:absolute before:inset-px before:rounded-full before:bg-[linear-gradient(135deg,rgba(255,255,255,0.30),rgba(255,255,255,0)_44%,rgba(125,211,252,0.20))] before:opacity-0 before:transition-opacity before:duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-[rgba(42,45,48,0.64)] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_38px_rgba(0,0,0,0.30),0_0_0_1px_rgba(255,255,255,0.05)] hover:before:opacity-100 active:translate-y-0 active:scale-[0.96] focus-visible:ring-white/70';

const topLayerSegmentGroupClassName =
  'relative h-[42px] gap-0 overflow-hidden rounded-full border-white/15 bg-[rgba(38,41,43,0.50)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_rgba(0,0,0,0.18)] backdrop-blur-[24px] transition-[border-color,box-shadow,background-color] duration-200 ease-out before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-[linear-gradient(120deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_38%,rgba(125,211,252,0.10))] before:opacity-0 before:transition-opacity before:duration-200 hover:border-white/[0.24] hover:bg-[rgba(46,49,52,0.56)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_18px_38px_rgba(0,0,0,0.24)] hover:before:opacity-100';

const topLayerSegmentButtonClassName =
  'relative z-10 h-[34px] min-w-[94px] rounded-full border-0 bg-transparent px-5 text-[14px] font-bold text-white/75 shadow-none transition-[transform,background-color,box-shadow,color] duration-200 ease-out hover:bg-white/[0.10] hover:text-white active:scale-[0.98] focus-visible:ring-white/[0.65]';

const topLayerSegmentButtonActiveClassName =
  'bg-white/[0.22] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_16px_rgba(0,0,0,0.16)] hover:bg-white/[0.24]';
