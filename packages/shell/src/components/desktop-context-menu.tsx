'use client';

import {
  Blocks,
  ChevronRight,
  CirclePlus,
  FileText,
  GraduationCap,
  Handshake,
  Image,
  LayoutGrid,
  ListTodo,
  Palette,
  PanelBottom,
  ShoppingBag,
  Sparkles,
  UserRoundPlus,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState, type CSSProperties, type RefObject } from 'react';

import { LiquidGlassSvgFilter } from '@kernelon/ui';

export interface DesktopContextMenuPosition {
  x: number;
  y: number;
}

type KernelOnDesktopSubmenu = 'new' | 'personalization' | null;

type DesktopContextMenuItemState = 'idle' | 'hovered' | 'pressed';

const desktopContextMenuCardMetrics = {
  width: 278,
  height: 204,
  viewportGutter: 10,
};

const desktopContextMenuSubmenuMetrics = {
  width: 236,
  height: 156,
  gap: 8,
  viewportGutter: 10,
};

const desktopContextMenuItems = [
  { Icon: CirclePlus, itemKey: 'new', label: '新建', submenu: 'new' },
  { Icon: ListTodo, itemKey: 'notifications', label: '通知与待办' },
  { Icon: Palette, itemKey: 'personalization', label: '个性化', submenu: 'personalization' },
  { Icon: ShoppingBag, itemKey: 'app-store', label: 'APP Store' },
  { Icon: Sparkles, itemKey: 'spotlight', label: 'AI Spotlight' },
] satisfies Array<{
  Icon: LucideIcon;
  itemKey: string;
  label: string;
  submenu?: Exclude<KernelOnDesktopSubmenu, null>;
}>;

const desktopContextSubmenus = {
  new: {
    label: '新建',
    topOffset: 10,
    items: [
      { Icon: UserRoundPlus, key: 'new-employee-profile', label: '新人档案' },
      { Icon: Handshake, key: 'new-mentor-match', label: '导师匹配' },
      { Icon: GraduationCap, key: 'new-training-task', label: '培训任务' },
      { Icon: FileText, key: 'new-resource-doc', label: '资源文档' },
    ],
  },
  personalization: {
    label: '个性化',
    topOffset: 90,
    items: [
      { Icon: Image, key: 'wallpaper', label: '壁纸' },
      { Icon: Blocks, key: 'widgets', label: '小组件' },
      { Icon: PanelBottom, key: 'dock-menu-bar', label: 'Dock 与菜单栏' },
      { Icon: LayoutGrid, key: 'desktop-arrangement', label: '桌面排列' },
    ],
  },
} satisfies Record<
  Exclude<KernelOnDesktopSubmenu, null>,
  {
    label: string;
    topOffset: number;
    items: Array<{ Icon: LucideIcon; key: string; label: string }>;
  }
>;

export function resolveDesktopContextMenuPosition(
  x: number,
  y: number,
): DesktopContextMenuPosition {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  return {
    x: clampToViewport(
      x,
      desktopContextMenuCardMetrics.width / 2 + desktopContextMenuCardMetrics.viewportGutter,
      window.innerWidth -
        desktopContextMenuCardMetrics.width / 2 -
        desktopContextMenuCardMetrics.viewportGutter,
    ),
    y: clampToViewport(
      y,
      desktopContextMenuCardMetrics.height / 2 + desktopContextMenuCardMetrics.viewportGutter,
      window.innerHeight -
        desktopContextMenuCardMetrics.height / 2 -
        desktopContextMenuCardMetrics.viewportGutter,
    ),
  };
}

function clampToViewport(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function resolveDesktopContextSubmenuPosition(
  position: DesktopContextMenuPosition,
  topOffset: number,
): DesktopContextMenuPosition {
  const mainLeft = position.x - desktopContextMenuCardMetrics.width / 2;
  const mainRight = position.x + desktopContextMenuCardMetrics.width / 2;
  const rightX =
    mainRight +
    desktopContextMenuSubmenuMetrics.gap +
    desktopContextMenuSubmenuMetrics.width / 2;
  const leftX =
    mainLeft -
    desktopContextMenuSubmenuMetrics.gap -
    desktopContextMenuSubmenuMetrics.width / 2;
  const mainTop = position.y - desktopContextMenuCardMetrics.height / 2;
  const rawY = mainTop + topOffset + desktopContextMenuSubmenuMetrics.height / 2;

  if (typeof window === 'undefined') {
    return { x: rightX, y: rawY };
  }

  const opensRight =
    rightX + desktopContextMenuSubmenuMetrics.width / 2 <=
    window.innerWidth - desktopContextMenuSubmenuMetrics.viewportGutter;
  const rawX = opensRight ? rightX : leftX;

  return {
    x: clampToViewport(
      rawX,
      desktopContextMenuSubmenuMetrics.width / 2 + desktopContextMenuSubmenuMetrics.viewportGutter,
      window.innerWidth -
        desktopContextMenuSubmenuMetrics.width / 2 -
        desktopContextMenuSubmenuMetrics.viewportGutter,
    ),
    y: clampToViewport(
      rawY,
      desktopContextMenuSubmenuMetrics.height / 2 +
        desktopContextMenuSubmenuMetrics.viewportGutter,
      window.innerHeight -
        desktopContextMenuSubmenuMetrics.height / 2 -
        desktopContextMenuSubmenuMetrics.viewportGutter,
    ),
  };
}

interface KernelOnDesktopContextMenuProps {
  position: DesktopContextMenuPosition;
  mouseContainer: RefObject<HTMLElement | null>;
  onClose(): void;
  onOpenSpotlight(): void;
}

export function KernelOnDesktopContextMenu({
  position,
  mouseContainer,
  onClose,
  onOpenSpotlight,
}: KernelOnDesktopContextMenuProps) {
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  const [pressedMenuItem, setPressedMenuItem] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<KernelOnDesktopSubmenu>(null);
  const [hoveredSubmenuItem, setHoveredSubmenuItem] = useState<string | null>(null);
  const [pressedSubmenuItem, setPressedSubmenuItem] = useState<string | null>(null);
  const submenuConfig = activeSubmenu ? desktopContextSubmenus[activeSubmenu] : null;
  const submenuPosition = submenuConfig
    ? resolveDesktopContextSubmenuPosition(position, submenuConfig.topOffset)
    : null;

  function activateMenuItem(itemKey: string, submenu: KernelOnDesktopSubmenu) {
    setHoveredMenuItem(itemKey);
    setActiveSubmenu(submenu);
    setHoveredSubmenuItem(null);
    setPressedSubmenuItem(null);
  }

  function handleMenuItemClick(itemKey: string, submenu: KernelOnDesktopSubmenu) {
    if (submenu) {
      activateMenuItem(itemKey, submenu);
      return;
    }

    if (itemKey === 'spotlight') {
      onOpenSpotlight();
    }
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Element && target.closest('[data-kernelon-liquid-glass-context-menu="true"]')) {
        return;
      }

      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <>
      <LiquidGlassSvgFilter
        displacementScale={100}
        blurAmount={0.5}
        saturation={140}
        aberrationIntensity={2}
        elasticity={0}
        cornerRadius={32}
        mouseContainer={mouseContainer}
        mode="standard"
        padding="12px 14px"
        style={{ position: 'absolute', left: position.x, top: position.y }}
      >
        <div
          className="w-[250px] cursor-default select-none"
          data-kernelon-liquid-glass-context-menu="true"
          data-testid="kernelon-liquid-glass-context-card"
        >
          <div
            className="flex flex-col gap-0 text-base font-medium leading-none text-white/90"
            aria-label="KernelOn desktop context menu"
            onPointerLeave={() => {
              setHoveredMenuItem(null);
              setPressedMenuItem(null);
            }}
            role="menu"
            data-testid="kernelon-liquid-glass-context-menu-list"
          >
            {desktopContextMenuItems.map(({ Icon, itemKey, label, submenu }) => {
              const isHovered = hoveredMenuItem === itemKey;
              const interactionState =
                pressedMenuItem === itemKey ? 'pressed' : isHovered ? 'hovered' : 'idle';

              return (
                <button
                  aria-expanded={submenu ? activeSubmenu === submenu : undefined}
                  aria-haspopup={submenu ? 'menu' : undefined}
                  className="relative flex h-9 w-full appearance-none items-center gap-[9px] rounded-[11px] border-0 bg-transparent px-2.5 py-0 text-left outline-none"
                  data-interaction-state={interactionState}
                  data-kernelon-context-menu-item={itemKey}
                  key={itemKey}
                  onClick={() => handleMenuItemClick(itemKey, submenu ?? null)}
                  onFocus={() => activateMenuItem(itemKey, submenu ?? null)}
                  onPointerCancel={() => setPressedMenuItem(null)}
                  onPointerDown={() => setPressedMenuItem(itemKey)}
                  onPointerEnter={() => activateMenuItem(itemKey, submenu ?? null)}
                  onPointerUp={() => setPressedMenuItem(null)}
                  role="menuitem"
                  style={getDesktopContextMenuItemStyle(interactionState)}
                  type="button"
                >
                  {interactionState !== 'idle' ? (
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-[inherit]"
                      data-highlight-capsule="true"
                      data-testid="kernelon-liquid-glass-context-menu-highlight"
                      layoutId="kernelon-liquid-glass-context-menu-main-highlight"
                      style={getDesktopContextMenuHighlightStyle(interactionState)}
                      transition={desktopContextMenuHighlightTransition}
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="relative z-10 grid size-[18px] shrink-0 place-items-center text-white/85"
                    data-testid="kernelon-liquid-glass-context-menu-icon"
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-[15px]"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.25}
                    />
                  </span>
                  <span className="relative z-10">{label}</span>
                  {submenu ? (
                    <ChevronRight
                      aria-hidden="true"
                      className="relative z-10 ml-auto size-4 shrink-0 text-white/65"
                      data-testid="kernelon-liquid-glass-context-menu-chevron"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.25}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </LiquidGlassSvgFilter>

      {submenuConfig && submenuPosition ? (
        <LiquidGlassSvgFilter
          displacementScale={100}
          blurAmount={0.5}
          saturation={140}
          aberrationIntensity={2}
          elasticity={0}
          cornerRadius={28}
          mouseContainer={mouseContainer}
          mode="standard"
          padding="10px 11px"
          key={activeSubmenu}
          style={{ position: 'absolute', left: submenuPosition.x, top: submenuPosition.y }}
        >
          <div
            className="w-[214px] cursor-default select-none"
            data-kernelon-liquid-glass-context-menu="true"
            data-testid="kernelon-liquid-glass-context-submenu-card"
          >
            <div
              aria-label={submenuConfig.label}
              className="flex flex-col gap-0 text-[15.5px] font-medium leading-none text-white/90"
              onPointerLeave={() => {
                setHoveredSubmenuItem(null);
                setPressedSubmenuItem(null);
              }}
              role="menu"
              data-testid="kernelon-liquid-glass-context-submenu-list"
            >
              {submenuConfig.items.map(({ Icon, key, label }) => {
                const submenuItemState =
                  pressedSubmenuItem === key
                    ? 'pressed'
                    : hoveredSubmenuItem === key
                      ? 'hovered'
                      : 'idle';

                return (
                  <button
                    className="relative flex h-[34px] w-full appearance-none items-center gap-[9px] rounded-[10px] border-0 bg-transparent px-2.5 py-0 text-left outline-none"
                    data-interaction-state={submenuItemState}
                    data-kernelon-context-submenu-item={key}
                    key={key}
                    onClick={onClose}
                    onFocus={() => setHoveredSubmenuItem(key)}
                    onPointerCancel={() => setPressedSubmenuItem(null)}
                    onPointerDown={() => setPressedSubmenuItem(key)}
                    onPointerEnter={() => setHoveredSubmenuItem(key)}
                    onPointerUp={() => setPressedSubmenuItem(null)}
                    role="menuitem"
                    style={getDesktopContextMenuItemStyle(submenuItemState)}
                    type="button"
                  >
                    {submenuItemState !== 'idle' ? (
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit]"
                        data-highlight-capsule="true"
                        data-testid="kernelon-liquid-glass-context-submenu-highlight"
                        layoutId={`kernelon-liquid-glass-context-menu-${activeSubmenu}-submenu-highlight`}
                        style={getDesktopContextMenuHighlightStyle(submenuItemState)}
                        transition={desktopContextMenuHighlightTransition}
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="relative z-10 grid size-[17px] shrink-0 place-items-center text-white/85"
                      data-testid="kernelon-liquid-glass-context-submenu-icon"
                    >
                      <Icon
                        aria-hidden="true"
                        className="size-[14px]"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.25}
                      />
                    </span>
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </LiquidGlassSvgFilter>
      ) : null}
    </>
  );
}

const desktopContextMenuIdleItemStyle = {
  color: 'rgba(255,255,255,0.94)',
  textShadow: '0 1px 5px rgba(0,0,0,0.34), 0 0 7px rgba(255,255,255,0.22)',
} as CSSProperties;

const desktopContextMenuHoveredItemStyle = {
  ...desktopContextMenuIdleItemStyle,
} as CSSProperties;

const desktopContextMenuPressedItemStyle = {
  ...desktopContextMenuIdleItemStyle,
  transform: 'scale(0.992)',
} as CSSProperties;

const desktopContextMenuHighlightStyle = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(238,246,231,0.11) 44%, rgba(104,147,118,0.16) 100%)',
  backdropFilter: 'blur(14px) saturate(174%) contrast(106%)',
  WebkitBackdropFilter: 'blur(14px) saturate(174%) contrast(106%)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,0.20), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(255,255,255,0.18), 0 4px 10px rgba(5,24,9,0.08)',
  willChange: 'transform',
} as CSSProperties;

const desktopContextMenuPressedHighlightStyle = {
  ...desktopContextMenuHighlightStyle,
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(238,246,231,0.10) 44%, rgba(104,147,118,0.20) 100%)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(255,255,255,0.14), 0 2px 7px rgba(5,24,9,0.10)',
} as CSSProperties;

const desktopContextMenuHighlightTransition = {
  type: 'spring',
  stiffness: 520,
  damping: 28,
  mass: 0.72,
} as const;

function getDesktopContextMenuHighlightStyle(state: DesktopContextMenuItemState) {
  if (state === 'pressed') {
    return desktopContextMenuPressedHighlightStyle;
  }

  return desktopContextMenuHighlightStyle;
}

function getDesktopContextMenuItemStyle(state: DesktopContextMenuItemState) {
  if (state === 'pressed') {
    return desktopContextMenuPressedItemStyle;
  }

  if (state === 'hovered') {
    return desktopContextMenuHoveredItemStyle;
  }

  return desktopContextMenuIdleItemStyle;
}
