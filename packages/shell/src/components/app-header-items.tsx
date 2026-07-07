'use client';

import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import type { AppHeaderItem } from '@kernelon/core';
import {
  AppHeaderButton,
  AppHeaderGroup,
  AppHeaderSearchField,
  AppHeaderSegmentedControl,
  LiquidGlassSvgFilter,
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
      if (isTopLayerChrome) {
        return item.backCommandId ? (
          <TopLayerIconGlassButton
            Icon={ArrowLeft}
            key={`${section}:navigation:${index}:back`}
            label="Back"
            onClick={() =>
              onCommand({
                commandId: item.backCommandId!,
                itemId: `${section}:back`,
                type: 'navigation',
                windowId,
              })
            }
          />
        ) : null;
      }

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

      if (isTopLayerChrome) {
        return (
          <TopLayerIconGlassButton
            Icon={Icon}
            key={`${section}:button:${item.id}`}
            label={item.label}
            onClick={() =>
              onCommand({
                commandId: item.commandId,
                itemId: item.id,
                type: 'button',
                windowId,
              })
            }
          />
        );
      }

      return (
        <AppHeaderButton
          aria-label={item.label}
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
          <Icon aria-hidden="true" className="size-3.5" />
          <span className="truncate">{item.label}</span>
        </AppHeaderButton>
      );
    }

    if (item.type === 'segment') {
      if (isTopLayerChrome) {
        return (
          <TopLayerSegmentedControl
            item={item}
            key={`${section}:segment:${item.id}`}
            onCommand={onCommand}
            windowId={windowId}
          />
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
type AppHeaderSegmentItem = Extract<AppHeaderItem, { type: 'segment' }>;

function stopHeaderControlDrag(event: ReactPointerEvent<HTMLElement>) {
  event.stopPropagation();
}

function TopLayerIconGlassButton({
  Icon,
  label,
  onClick,
}: Readonly<{
  Icon: ReturnType<typeof resolveAppHeaderIcon>;
  label: string;
  onClick(): void;
}>) {
  return (
    <span
      className={topLayerIconButtonHostClassName}
      data-kernelon-app-header-liquid-button="true"
      onPointerDown={stopHeaderControlDrag}
    >
      <LiquidGlassSvgFilter
        appearanceClassName={topLayerGlassAppearanceClassName}
        blurAmount={0.5}
        className={topLayerIconGlassClassName}
        displacementScale={104}
        elasticity={0}
        padding="0px"
        saturation={140}
        style={topLayerIconGlassPlacement}
      >
        <AppHeaderButton
          aria-label={label}
          className={topLayerIconButtonClassName}
          onClick={onClick}
          type="button"
        >
          <Icon
            aria-hidden="true"
            className="relative z-10 size-[21px]"
            strokeWidth={2.25}
          />
          <span className="sr-only">{label}</span>
        </AppHeaderButton>
      </LiquidGlassSvgFilter>
    </span>
  );
}

function TopLayerSegmentedControl({
  item,
  onCommand,
  windowId,
}: Readonly<{
  item: AppHeaderSegmentItem;
  onCommand(payload: AppHeaderCommandPayload): void;
  windowId: string;
}>) {
  const segmentWidth =
    item.options.length * TOP_LAYER_SEGMENT_BUTTON_WIDTH + TOP_LAYER_SEGMENT_GROUP_PADDING * 2;
  const segmentHostStyle = {
    width: segmentWidth,
  } satisfies CSSProperties;
  const segmentGlassPlacement = {
    position: 'absolute',
    left: segmentWidth / 2,
    top: TOP_LAYER_CONTROL_SIZE / 2,
  } as const;
  const selectedIndex = Math.max(
    0,
    item.options.findIndex((option) => option.value === item.value),
  );
  const segmentIndicatorStyle = {
    transform: `translate3d(${selectedIndex * TOP_LAYER_SEGMENT_BUTTON_WIDTH}px, 0, 0)`,
    width: TOP_LAYER_SEGMENT_BUTTON_WIDTH,
  } satisfies CSSProperties;

  return (
    <div
      className={topLayerSegmentHostClassName}
      data-kernelon-app-header-liquid-segment="true"
      onPointerDown={stopHeaderControlDrag}
      style={segmentHostStyle}
    >
      <LiquidGlassSvgFilter
        appearanceClassName={topLayerGlassAppearanceClassName}
        blurAmount={0.5}
        className={topLayerSegmentGlassClassName}
        displacementScale={104}
        elasticity={0}
        padding="0px"
        saturation={140}
        style={segmentGlassPlacement}
      >
        <div
          className={topLayerSegmentGroupClassName}
          data-kernelon-app-header-segment-group="true"
          role="group"
          style={segmentHostStyle}
        >
          <span
            aria-hidden="true"
            className={topLayerSegmentActiveIndicatorClassName}
            data-kernelon-app-header-segment-active-indicator="true"
            style={segmentIndicatorStyle}
          />
          {item.options.map((option) => {
            const selected = option.value === item.value;

            return (
              <button
                aria-current={selected ? 'page' : undefined}
                aria-pressed={selected}
                className={cn(
                  topLayerSegmentButtonClassName,
                  selected ? topLayerSegmentButtonActiveClassName : '',
                )}
                data-kernelon-app-header-segment-button="true"
                key={option.value}
                onClick={() => {
                  onCommand({
                    commandId: item.commandId ?? `${item.id}.change`,
                    itemId: item.id,
                    type: 'segment',
                    value: option.value,
                    windowId,
                  });
                }}
                type="button"
              >
                <span className="relative z-20">{option.label}</span>
              </button>
            );
          })}
        </div>
      </LiquidGlassSvgFilter>
    </div>
  );
}

const TOP_LAYER_CONTROL_SIZE = 42;
const TOP_LAYER_SEGMENT_BUTTON_WIDTH = 96;
const TOP_LAYER_SEGMENT_GROUP_PADDING = 4;

const topLayerIconGlassPlacement = {
  position: 'absolute',
  left: TOP_LAYER_CONTROL_SIZE / 2,
  top: TOP_LAYER_CONTROL_SIZE / 2,
} as const;

const topLayerIconButtonHostClassName =
  'relative h-[42px] w-[42px] shrink-0 overflow-visible';

const topLayerIconGlassClassName = 'z-10 text-white';

const topLayerGlassAppearanceClassName =
  '[--ko-liquid-glass-border-strong:rgba(255,255,255,0.24)] [--ko-liquid-glass-border-soft:rgba(255,255,255,0.09)]';

const topLayerIconButtonClassName =
  'relative h-[42px] w-[42px] min-w-[42px] gap-0 overflow-hidden rounded-full border-0 bg-transparent px-0 text-white/90 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-white/70';

const topLayerSegmentHostClassName =
  'relative h-[42px] shrink-0 overflow-visible';

const topLayerSegmentGlassClassName = 'z-10 text-white';

const topLayerSegmentGroupClassName =
  'relative inline-flex h-[42px] shrink-0 items-center gap-0 overflow-hidden rounded-full border-0 bg-transparent p-1 shadow-none';

const topLayerSegmentActiveIndicatorClassName =
  'pointer-events-none absolute left-1 top-1 h-[34px] rounded-full bg-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.34),inset_0_-10px_22px_rgba(255,255,255,0.07),inset_0_0_0_1px_rgba(255,255,255,0.13)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';

const topLayerSegmentButtonClassName =
  'relative z-10 inline-flex h-[34px] min-w-[96px] items-center justify-center rounded-full border-0 bg-transparent px-5 text-[14px] font-bold text-white/72 shadow-none outline-none transition-[color,text-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] after:pointer-events-none after:absolute after:right-0 after:top-2 after:h-5 after:w-px after:bg-white/[0.14] after:opacity-60 last:after:hidden hover:text-white/90 focus-visible:ring-2 focus-visible:ring-white/[0.65]';

const topLayerSegmentButtonActiveClassName =
  'text-white [text-shadow:0_1px_14px_rgba(255,255,255,0.34)]';
