'use client';

import {
  Bell,
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
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  UserRoundPlus,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Suspense,
  useCallback,
  createContext,
  createElement,
  lazy,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type LazyExoticComponent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type ReactNode,
  type SVGProps,
} from 'react';
import { useStore } from 'zustand';

import type { DesktopItem, KernelAppManifest, WidgetManifest } from '@kernelon/core';
import { LiquidGlassSvgFilter } from '@kernelon/ui';

import type { AppWindowSurfaceProps, ShellRuntimeRegistry, WidgetSurfaceProps } from './runtime';
import {
  createShellStore,
  type ShellInitialState,
  type ShellState,
  type ShellStore,
} from './shell-store';
import {
  kernelOnBrandLogo,
  kernelOnDesktopWallpaper,
  kernelOnStatusAvatar,
  resolveDockIconAsset,
  resolveDockIconAssetScale,
} from './visual-assets';

export interface KernelOnShellProps {
  initialState: ShellInitialState;
  runtime: ShellRuntimeRegistry;
}

const ShellStoreContext = createContext<ShellStore | null>(null);

function ShellStoreProvider({
  children,
  initialState,
}: Readonly<{ children: ReactNode; initialState: ShellInitialState }>) {
  const [store] = useState(() => createShellStore(initialState));

  return <ShellStoreContext.Provider value={store}>{children}</ShellStoreContext.Provider>;
}

function useShellSelector<T>(selector: (state: ShellState) => T): T {
  const store = useContext(ShellStoreContext);

  if (!store) {
    throw new Error('useShellSelector must be used inside KernelOnShell.');
  }

  return useStore(store, selector);
}

export function KernelOnShell({ initialState, runtime }: KernelOnShellProps) {
  return (
    <ShellStoreProvider initialState={initialState}>
      <KernelOnShellView runtime={runtime} />
    </ShellStoreProvider>
  );
}

function KernelOnShellView({ runtime }: Readonly<{ runtime: ShellRuntimeRegistry }>) {
  const liquidGlassContextContainerRef = useRef<HTMLElement>(null);
  const apps = useShellSelector((state) => state.apps);
  const widgets = useShellSelector((state) => state.widgets);
  const currentScreenId = useShellSelector((state) => state.currentScreenId);
  const screens = useShellSelector((state) => state.screens);
  const windows = useShellSelector((state) => state.windows);
  const dockAppIds = useShellSelector((state) => state.dockAppIds);
  const launcherOpen = useShellSelector((state) => state.launcherOpen);
  const spotlightOpen = useShellSelector((state) => state.spotlightOpen);
  const openApp = useShellSelector((state) => state.openApp);
  const toggleLauncher = useShellSelector((state) => state.toggleLauncher);
  const toggleSpotlight = useShellSelector((state) => state.toggleSpotlight);
  const currentScreen = screens.find((screen) => screen.id === currentScreenId) ?? screens[0];
  const desktopItems = currentScreen?.items ?? [];
  const [desktopContextMenu, setDesktopContextMenu] =
    useState<DesktopContextMenuPosition | null>(null);
  const closeDesktopContextMenu = useCallback(() => {
    setDesktopContextMenu(null);
  }, []);
  const handleDesktopContextMenu = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    setDesktopContextMenu(resolveDesktopContextMenuPosition(event.clientX, event.clientY));
  }, []);
  return (
    <main
      ref={liquidGlassContextContainerRef}
      aria-label="KernelOn shell"
      className="relative min-h-screen overflow-hidden bg-[var(--ko-bg)] text-[var(--ko-ink)]"
      data-testid="kernelon-shell"
    >
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        data-testid="kernelon-desktop-wallpaper"
        draggable={false}
        src={kernelOnDesktopWallpaper}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(255,255,255,0.20),transparent_34%),linear-gradient(180deg,rgba(4,19,12,0.02),rgba(4,19,12,0.08))]"
      />
      <KernelOnStatusBar
        launcherOpen={launcherOpen}
        onToggleLauncher={toggleLauncher}
        onToggleSpotlight={toggleSpotlight}
        spotlightOpen={spotlightOpen}
      />
      <section
        aria-label="KernelOn desktop"
        className="relative min-h-screen"
        data-testid="kernelon-desktop-surface"
        onContextMenu={handleDesktopContextMenu}
      >
        {desktopItems.map((item) => (
          <DesktopItemMount item={item} key={item.id} runtime={runtime} widgets={widgets} />
        ))}
        {windows.map((window) => {
          const app = apps.find((item) => item.id === window.appId);

          return app ? (
            <AppWindowMount app={app} key={window.id} runtime={runtime} window={window} />
          ) : null;
        })}
      </section>
      <AnimatePresence>
        {desktopContextMenu ? (
          <KernelOnDesktopContextMenu
            key={`${desktopContextMenu.x}-${desktopContextMenu.y}`}
            mouseContainer={liquidGlassContextContainerRef}
            onClose={closeDesktopContextMenu}
            onOpenSpotlight={toggleSpotlight}
            position={desktopContextMenu}
          />
        ) : null}
      </AnimatePresence>
      <DesktopDock
        apps={apps}
        dockAppIds={dockAppIds}
        onOpenApp={openApp}
        onToggleLauncher={toggleLauncher}
        onToggleSpotlight={toggleSpotlight}
      />
    </main>
  );
}

interface DesktopContextMenuPosition {
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

function resolveDesktopContextMenuPosition(x: number, y: number): DesktopContextMenuPosition {
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
      desktopContextMenuSubmenuMetrics.width / 2 +
        desktopContextMenuSubmenuMetrics.viewportGutter,
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

function KernelOnDesktopContextMenu({
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

const dockGlassSurfaceStyle = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(238,246,231,0.14) 42%, rgba(104,147,118,0.16) 100%), radial-gradient(120% 150% at 18% -18%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 66%), radial-gradient(95% 120% at 82% 118%, rgba(58,111,91,0.16) 0%, rgba(58,111,91,0) 60%)',
  backgroundClip: 'padding-box',
  backdropFilter: 'blur(14px) saturate(174%) contrast(106%)',
  WebkitBackdropFilter: 'blur(14px) saturate(174%) contrast(106%)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -1px 0 rgba(255,255,255,0.34), inset 0 14px 24px rgba(255,255,255,0.08), inset 0 -18px 26px rgba(36,73,48,0.10), 0 15px 36px rgba(5,24,9,0.22), 0 2px 8px rgba(255,255,255,0.16)',
} as CSSProperties;

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

interface KernelOnStatusBarProps {
  launcherOpen: boolean;
  spotlightOpen: boolean;
  onToggleLauncher(): void;
  onToggleSpotlight(): void;
}

function KernelOnStatusBar({
  launcherOpen,
  spotlightOpen,
  onToggleLauncher,
  onToggleSpotlight,
}: KernelOnStatusBarProps) {
  return (
    <header
      aria-label="KernelOn status bar"
      className="pointer-events-none fixed inset-x-0 top-[2px] z-30 w-full"
      data-testid="kernelon-status-bar"
      style={statusBarShellStyle}
    >
      <div
        className="pointer-events-auto flex h-[38px] w-full items-center justify-between pl-[14px]"
      >
        <div
          aria-label="KernelOn product identity"
          className="flex h-full min-w-0 items-center gap-[8px]"
          data-testid="kernelon-status-brand"
        >
          <img
            alt=""
            className="h-[20px] w-[30px] shrink-0 object-contain"
            data-testid="kernelon-status-brand-logo"
            draggable={false}
            src={kernelOnBrandLogo}
            style={statusBrandLogoStyle}
          />
          <span
            className="truncate text-[14px] font-semibold leading-none text-white/96"
            style={statusBrandTextStyle}
          >
            KernelOn
          </span>
        </div>
        <div
          className="flex h-[38px] w-[320px] shrink-0 items-center justify-end gap-[18px] pr-[10px]"
          data-testid="kernelon-status-controls"
        >
          <StatusBarIconButton
            Icon={LayoutGrid}
            iconClassName="h-[21px] w-[21px]"
            label="Launchpad"
            onClick={onToggleLauncher}
            pressed={launcherOpen}
          />
          <StatusBarIconButton
            Icon={StatusSyncIcon}
            iconClassName="h-[24px] w-[25px]"
            iconVariant="material-symbols-light:cloud-done-outline-rounded"
            label="Sync status"
          />
          <StatusBarIconButton
            Icon={Search}
            iconClassName="h-[24px] w-[24px]"
            label="AI Spotlight"
            onClick={onToggleSpotlight}
            pressed={spotlightOpen}
          />
          <StatusBarIconButton
            Icon={Bell}
            badge={
              <span
                className="absolute top-[2px] right-[-2px] size-[7px] rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.96),0_1px_2px_rgba(64,112,131,0.22)]"
                data-testid="kernelon-notification-dot"
              />
            }
            iconClassName="h-[23px] w-[23px]"
            label="Notifications"
          />
          <StatusBarIconButton
            Icon={SlidersHorizontal}
            iconClassName="h-[24px] w-[24px]"
            label="Control Center"
          />
          <StatusBarProfileButton />
        </div>
      </div>
    </header>
  );
}

type StatusIconProps = SVGProps<SVGSVGElement>;
type StatusBarIconComponent = ComponentType<StatusIconProps>;

interface StatusBarIconButtonProps {
  Icon: StatusBarIconComponent;
  label: string;
  iconClassName?: string;
  iconVariant?: string;
  badge?: ReactNode;
  pressed?: boolean;
  onClick?: () => void;
}

function StatusBarIconButton({
  Icon,
  label,
  iconClassName = 'h-[23px] w-[23px]',
  iconVariant,
  badge,
  pressed,
  onClick,
}: StatusBarIconButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={typeof pressed === 'boolean' ? pressed : undefined}
      className="relative flex h-[30px] w-[27px] shrink-0 items-center justify-center rounded-full text-white/95 outline-none transition duration-150 ease-out hover:scale-[1.025] focus-visible:ring-2 focus-visible:ring-white/80"
      data-icon-variant={iconVariant}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={iconClassName}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.38}
        style={statusGlyphStyle}
      />
      {badge}
    </button>
  );
}

function StatusSyncIcon({ className, style }: StatusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      style={style}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.344 14.875L8.56 13.091q-.147-.147-.345-.156t-.363.155q-.165.166-.165.357q0 .192.165.357l1.933 1.938q.242.243.565.243t.566-.243l4.032-4.032q.146-.146.156-.35t-.156-.37t-.36-.165t-.36.166zM6.5 19q-1.871 0-3.185-1.306Q2 16.39 2 14.517q0-1.719 1.175-3.051t2.921-1.431q.337-2.185 2.01-3.61T12 5q2.502 0 4.251 1.749T18 11v1h.616q1.436.046 2.41 1.055T22 15.5q0 1.471-1.014 2.486Q19.97 19 18.5 19zm0-1h12q1.05 0 1.775-.725T21 15.5t-.725-1.775T18.5 13H17v-2q0-2.075-1.463-3.538T12 6T8.463 7.463T7 11h-.5q-1.45 0-2.475 1.025T3 14.5t1.025 2.475T6.5 18m5.5-6" />
    </svg>
  );
}

function StatusBarProfileButton() {
  return (
    <button
      aria-label="KernelOn profile"
      className="relative flex size-[32px] shrink-0 items-center justify-center rounded-full outline-none transition duration-150 ease-out hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/80"
      title="KernelOn profile"
      type="button"
    >
      <span className="absolute inset-0 rounded-full bg-white/82 shadow-[0_0_5px_rgba(255,255,255,0.88),0_1px_3px_rgba(39,84,103,0.24)]" />
      <span className="relative block size-[28px] overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.74)]">
        <img
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          src={kernelOnStatusAvatar}
        />
      </span>
    </button>
  );
}

const statusBarShellStyle = {
  height: '38px',
} as CSSProperties;

const statusBrandLogoStyle = {
  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.68)) drop-shadow(0 2px 3px rgba(45,92,111,0.24))',
} as CSSProperties;

const statusBrandTextStyle = {
  letterSpacing: 0,
  textShadow: '0 0 5px rgba(255,255,255,0.52), 0 1px 3px rgba(45,92,111,0.26)',
} as CSSProperties;

const statusGlyphStyle = {
  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.74)) drop-shadow(0 2px 2px rgba(45,92,111,0.24))',
} as CSSProperties;

interface DesktopDockProps {
  apps: KernelAppManifest[];
  dockAppIds: string[];
  onOpenApp(appId: string): void;
  onToggleLauncher(): void;
  onToggleSpotlight(): void;
}

function DesktopDock({
  apps,
  dockAppIds,
  onOpenApp,
  onToggleLauncher,
  onToggleSpotlight,
}: DesktopDockProps) {
  const dockApps = dockAppIds
    .map((appId) => apps.find((app) => app.id === appId))
    .filter((app): app is KernelAppManifest => Boolean(app));

  return (
    <nav
      aria-label="KernelOn Dock"
      className="fixed bottom-[clamp(12px,2.2vh,24px)] left-1/2 z-20 flex max-w-[calc(100vw-20px)] -translate-x-1/2 items-center gap-[var(--dock-gap)] overflow-x-auto rounded-[clamp(20px,2.2vw,32px)] border border-white/40 px-[var(--dock-pad-x)] py-[var(--dock-pad-y)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="kernelon-dock"
      style={dockStyle}
    >
      <DockIconButton assetKey="launchpad" label="启动台" onClick={onToggleLauncher} />
      {dockApps.map((app) => (
        <DockIconButton
          assetKey={app.id}
          key={app.id}
          label={app.name}
          onClick={() => onOpenApp(app.id)}
        />
      ))}
      <DockIconButton assetKey="ai-spotlight" label="AI Spotlight" onClick={onToggleSpotlight} />
      <div
        aria-hidden="true"
        className="mx-[1px] h-[calc(var(--dock-icon-size)*0.78)] w-px bg-white/55 shadow-[1px_0_0_rgba(18,35,18,0.20)]"
      />
      <DockIconButton assetKey="folder-stack" label="资源文件夹" />
      <DockIconButton assetKey="document" label="最近文档" />
      <DockIconButton assetKey="trash" label="废纸篓" />
    </nav>
  );
}

const dockStyle = {
  '--dock-gap': 'clamp(7px, 0.6vw, 11px)',
  '--dock-icon-size': 'clamp(32px, 3.7vw, 66px)',
  '--dock-pad-x': 'clamp(13px, 1vw, 18px)',
  '--dock-pad-y': 'clamp(7px, 0.75vw, 10px)',
  ...dockGlassSurfaceStyle,
} as CSSProperties;

interface DockIconButtonProps {
  assetKey: string;
  label: string;
  onClick?: () => void;
}

function DockIconButton({ assetKey, label, onClick }: DockIconButtonProps) {
  return (
    <button
      aria-label={label}
      className="group relative flex size-[var(--dock-icon-size)] shrink-0 items-center justify-center rounded-[clamp(12px,1.1vw,16px)] outline-none transition duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.05] focus-visible:ring-2 focus-visible:ring-white/80"
      onClick={onClick}
      style={
        {
          '--dock-icon-asset-scale': resolveDockIconAssetScale(assetKey),
        } as CSSProperties
      }
      title={label}
      type="button"
    >
      <img
        alt=""
        className="pointer-events-none h-full w-full scale-[var(--dock-icon-asset-scale)] select-none object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.24)] transition duration-200 ease-out group-hover:drop-shadow-[0_14px_16px_rgba(0,0,0,0.28)]"
        draggable={false}
        src={resolveDockIconAsset(assetKey)}
      />
    </button>
  );
}

function useAppWindowComponent(
  runtime: ShellRuntimeRegistry,
  loaderKey: string,
): LazyExoticComponent<ComponentType<AppWindowSurfaceProps>> {
  return useMemo(() => lazy(() => runtime.loadAppWindow(loaderKey)), [loaderKey, runtime]);
}

function useWidgetComponent(
  runtime: ShellRuntimeRegistry,
  loaderKey: string,
): LazyExoticComponent<ComponentType<WidgetSurfaceProps>> {
  return useMemo(() => lazy(() => runtime.loadWidget(loaderKey)), [loaderKey, runtime]);
}

interface DesktopItemMountProps {
  item: DesktopItem;
  runtime: ShellRuntimeRegistry;
  widgets: WidgetManifest[];
}

function DesktopItemMount({ item, runtime, widgets }: DesktopItemMountProps) {
  if (item.kind === 'widget') {
    const widget = widgets.find((candidate) => candidate.id === item.targetId);

    return widget ? <WidgetMount item={item} runtime={runtime} widget={widget} /> : null;
  }

  return null;
}

function WidgetMount({
  item,
  runtime,
  widget,
}: Readonly<{
  item: DesktopItem;
  runtime: ShellRuntimeRegistry;
  widget: WidgetManifest;
}>) {
  const WidgetComponent = useWidgetComponent(runtime, widget.runtime.widget.loaderKey);

  return <Suspense fallback={null}>{createElement(WidgetComponent, { item, widget })}</Suspense>;
}

function AppWindowMount({
  app,
  runtime,
  window,
}: Readonly<{
  app: KernelAppManifest;
  runtime: ShellRuntimeRegistry;
  window: AppWindowSurfaceProps['window'];
}>) {
  const AppWindowComponent = useAppWindowComponent(runtime, app.runtime.window.loaderKey);

  return <Suspense fallback={null}>{createElement(AppWindowComponent, { app, window })}</Suspense>;
}
