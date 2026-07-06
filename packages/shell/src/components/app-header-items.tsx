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
            className={isTopLayerChrome ? 'size-[21px]' : 'size-3.5'}
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
  'h-[42px] w-[42px] min-w-[42px] gap-0 rounded-full border-white/15 bg-[rgba(25,27,30,0.50)] px-0 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_30px_rgba(0,0,0,0.22)] backdrop-blur-[22px] hover:border-white/20 hover:bg-[rgba(35,37,40,0.58)] hover:text-white focus-visible:ring-white/70';

const topLayerSegmentGroupClassName =
  'h-[42px] gap-0 rounded-full border-white/15 bg-[rgba(38,41,43,0.50)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_rgba(0,0,0,0.18)] backdrop-blur-[24px]';

const topLayerSegmentButtonClassName =
  'h-[34px] min-w-[94px] rounded-full border-0 bg-transparent px-5 text-[14px] font-bold text-white/75 shadow-none hover:bg-transparent hover:text-white';

const topLayerSegmentButtonActiveClassName = 'bg-white/20 text-white hover:bg-white/20';
