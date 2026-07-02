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
  const handleContextMenuSpotlight = useCallback(() => {
    toggleSpotlight();
    closeDesktopContextMenu();
  }, [closeDesktopContextMenu, toggleSpotlight]);

  return (
    <main
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
        className="relative z-10 min-h-screen"
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
            onClose={closeDesktopContextMenu}
            onOpenSpotlight={handleContextMenuSpotlight}
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

const desktopContextMenuMetrics = {
  mainWidth: 274,
  mainHeight: 200,
  submenuWidth: 236,
  submenuHeight: 156,
  submenuGap: 8,
  submenuTopOffset: 90,
  viewportGutter: 10,
};

function resolveDesktopContextMenuPosition(x: number, y: number): DesktopContextMenuPosition {
  if (typeof window === 'undefined') {
    return { x, y };
  }

  const totalWidth =
    desktopContextMenuMetrics.mainWidth +
    desktopContextMenuMetrics.submenuGap +
    desktopContextMenuMetrics.submenuWidth;
  const totalHeight = Math.max(
    desktopContextMenuMetrics.mainHeight,
    desktopContextMenuMetrics.submenuTopOffset + desktopContextMenuMetrics.submenuHeight,
  );

  return {
    x: clampToViewport(x, desktopContextMenuMetrics.viewportGutter, window.innerWidth - totalWidth),
    y: clampToViewport(
      y,
      desktopContextMenuMetrics.viewportGutter,
      window.innerHeight - totalHeight,
    ),
  };
}

function clampToViewport(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

interface KernelOnDesktopContextMenuProps {
  position: DesktopContextMenuPosition;
  onClose(): void;
  onOpenSpotlight(): void;
}

type KernelOnDesktopSubmenu = 'new' | 'personalization' | null;

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

function KernelOnDesktopContextMenu({
  position,
  onClose,
  onOpenSpotlight,
}: KernelOnDesktopContextMenuProps) {
  const contextMenuRootRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] =
    useState<KernelOnDesktopSubmenu>('personalization');
  const [hoveredItem, setHoveredItem] = useState('personalization');
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const submenuConfig = activeSubmenu ? desktopContextSubmenus[activeSubmenu] : null;
  const submenuPosition = {
    x:
      position.x +
      desktopContextMenuMetrics.mainWidth +
      desktopContextMenuMetrics.submenuGap,
    y: position.y + (submenuConfig?.topOffset ?? desktopContextMenuMetrics.submenuTopOffset),
  };

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Element && target.closest('[data-kernelon-context-menu-root="true"]')) {
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
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('pointerup', handlePointerRelease);
    window.addEventListener('pointercancel', handlePointerRelease);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('pointerup', handlePointerRelease);
      window.removeEventListener('pointercancel', handlePointerRelease);
    };

    function handlePointerRelease() {
      setPressedItem(null);
    }
  }, [onClose]);

  function getItemState(itemKey: string, expanded?: boolean) {
    if (pressedItem === itemKey) {
      return 'pressed';
    }

    if (hoveredItem === itemKey || expanded) {
      return 'hovered';
    }

    return 'idle';
  }

  function activateItem(itemKey: string, submenu: KernelOnDesktopSubmenu) {
    setHoveredItem(itemKey);
    setActiveSubmenu(submenu);
  }

  return (
    <div
      ref={contextMenuRootRef}
      className="fixed inset-0 z-40 pointer-events-none"
      data-kernelon-context-menu-root="true"
    >
      <DesktopContextMenuGlassSurface
        aria-label="KernelOn desktop context menu"
        cornerRadius={22}
        height={desktopContextMenuMetrics.mainHeight}
        layer="main"
        mouseContainer={contextMenuRootRef}
        position={position}
        width={desktopContextMenuMetrics.mainWidth}
      >
        <div className="relative z-10 flex h-full flex-col px-[12px] py-[10px]">
          <KernelOnDesktopMenuItem
            Icon={CirclePlus}
            expanded={activeSubmenu === 'new'}
            hasSubmenu
            highlightGroup="main"
            itemKey="new"
            label="新建"
            onFocus={() => activateItem('new', 'new')}
            onPointerDown={() => setPressedItem('new')}
            onPointerEnter={() => activateItem('new', 'new')}
            state={getItemState('new', activeSubmenu === 'new')}
          />
          <KernelOnDesktopMenuItem
            Icon={ListTodo}
            highlightGroup="main"
            itemKey="notifications"
            label="通知与待办"
            onFocus={() => activateItem('notifications', null)}
            onPointerDown={() => setPressedItem('notifications')}
            onPointerEnter={() => activateItem('notifications', null)}
            state={getItemState('notifications')}
          />
          <KernelOnDesktopMenuItem
            Icon={Palette}
            expanded={activeSubmenu === 'personalization'}
            hasSubmenu
            highlightGroup="main"
            itemKey="personalization"
            label="个性化"
            onFocus={() => activateItem('personalization', 'personalization')}
            onPointerDown={() => setPressedItem('personalization')}
            onPointerEnter={() => activateItem('personalization', 'personalization')}
            state={getItemState('personalization', activeSubmenu === 'personalization')}
          />
          <KernelOnDesktopMenuItem
            Icon={ShoppingBag}
            highlightGroup="main"
            itemKey="app-store"
            label="APP Store"
            onFocus={() => activateItem('app-store', null)}
            onPointerDown={() => setPressedItem('app-store')}
            onPointerEnter={() => activateItem('app-store', null)}
            state={getItemState('app-store')}
          />
          <KernelOnDesktopMenuItem
            Icon={Sparkles}
            highlightGroup="main"
            itemKey="spotlight"
            label="AI Spotlight"
            onClick={onOpenSpotlight}
            onFocus={() => activateItem('spotlight', null)}
            onPointerDown={() => setPressedItem('spotlight')}
            onPointerEnter={() => activateItem('spotlight', null)}
            state={getItemState('spotlight')}
          />
        </div>
      </DesktopContextMenuGlassSurface>

      <AnimatePresence>
        {submenuConfig ? (
          <DesktopContextMenuGlassSurface
            aria-label={submenuConfig.label}
            cornerRadius={20}
            height={desktopContextMenuMetrics.submenuHeight}
            key={activeSubmenu}
            layer="submenu"
            mouseContainer={contextMenuRootRef}
            position={submenuPosition}
            width={desktopContextMenuMetrics.submenuWidth}
          >
            <div className="relative z-10 flex h-full flex-col px-[11px] py-[10px]">
              {submenuConfig.items.map((item) => (
                <KernelOnDesktopMenuItem
                  Icon={item.Icon}
                  compact
                  highlightGroup={`submenu-${activeSubmenu}`}
                  itemKey={item.key}
                  key={item.key}
                  label={item.label}
                  onClick={onClose}
                  onFocus={() => setHoveredItem(item.key)}
                  onPointerDown={() => setPressedItem(item.key)}
                  onPointerEnter={() => setHoveredItem(item.key)}
                  state={getItemState(item.key)}
                />
              ))}
            </div>
          </DesktopContextMenuGlassSurface>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface DesktopContextMenuGlassSurfaceProps {
  'aria-label': string;
  children: ReactNode;
  cornerRadius: number;
  height: number;
  layer: 'main' | 'submenu';
  mouseContainer: RefObject<HTMLDivElement | null>;
  position: DesktopContextMenuPosition;
  width: number;
}

function DesktopContextMenuGlassSurface({
  'aria-label': ariaLabel,
  children,
  cornerRadius,
  height,
  layer,
  mouseContainer,
  position,
  width,
}: DesktopContextMenuGlassSurfaceProps) {
  return (
    <LiquidGlassSvgFilter
      aberrationIntensity={4}
      blurAmount={0.0625}
      className="pointer-events-auto text-white outline-none"
      cornerRadius={cornerRadius}
      displacementScale={180}
      elasticity={0}
      mode="standard"
      mouseContainer={mouseContainer}
      padding="0"
      saturation={160}
      style={{
        left: position.x + width / 2,
        position: 'fixed',
        top: position.y + height / 2,
      }}
    >
      <div
        aria-label={ariaLabel}
        className="relative z-10 text-white outline-none"
        data-kernelon-context-menu-glass={layer}
        data-menu-surface="liquid-glass-svg-filter"
        role="menu"
        style={{ height, width }}
        tabIndex={-1}
      >
        {children}
      </div>
    </LiquidGlassSvgFilter>
  );
}

interface KernelOnDesktopMenuItemProps {
  Icon: LucideIcon;
  highlightGroup: string;
  itemKey: string;
  label: string;
  compact?: boolean;
  expanded?: boolean;
  hasSubmenu?: boolean;
  state: 'idle' | 'hovered' | 'pressed';
  onClick?: () => void;
  onFocus?: () => void;
  onPointerDown?: () => void;
  onPointerEnter?: () => void;
}

function KernelOnDesktopMenuItem({
  Icon,
  highlightGroup,
  itemKey,
  label,
  compact,
  expanded,
  hasSubmenu,
  state,
  onClick,
  onFocus,
  onPointerDown,
  onPointerEnter,
}: KernelOnDesktopMenuItemProps) {
  return (
    <button
      aria-expanded={hasSubmenu ? Boolean(expanded) : undefined}
      aria-haspopup={hasSubmenu ? 'menu' : undefined}
      className={[
        'group relative flex shrink-0 items-center justify-between overflow-hidden text-left outline-none transition duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/70',
        compact ? 'h-[34px] rounded-[10px] px-[10px]' : 'h-[36px] rounded-[11px] px-[10px]',
      ]
        .filter(Boolean)
        .join(' ')}
      data-interaction-state={state}
      data-highlight-tone={state === 'idle' ? undefined : 'dock-glass'}
      data-menu-item={itemKey}
      onClick={onClick}
      onFocus={onFocus}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      role="menuitem"
      style={{
        ...getDesktopContextMenuItemStyle(state),
        fontSize: compact ? 15.5 : 16,
        fontWeight: 520,
        lineHeight: 1.1,
      }}
      type="button"
    >
      {state !== 'idle' ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          data-highlight-capsule="true"
          layoutId={`kernelon-context-menu-highlight-${highlightGroup}`}
          style={getDesktopContextMenuHighlightStyle(state)}
          transition={desktopContextMenuHighlightTransition}
        />
      ) : null}
      <span className="relative z-10 flex min-w-0 items-center gap-[9px]">
        <span
          aria-hidden="true"
          className={compact ? 'grid size-[17px] shrink-0 place-items-center' : 'grid size-[18px] shrink-0 place-items-center'}
          data-menu-item-icon="true"
          data-testid="context-menu-item-icon"
          style={desktopContextMenuIconStyle}
        >
          <Icon
            aria-hidden="true"
            className={compact ? 'size-[14px]' : 'size-[15px]'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.25}
          />
        </span>
        <span className="truncate" style={desktopContextMenuTextStyle}>
          {label}
        </span>
      </span>
      {hasSubmenu ? (
        <ChevronRight
          aria-hidden="true"
          className={compact ? 'relative z-10 h-[16px] w-[16px]' : 'relative z-10 h-[18px] w-[18px]'}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          style={desktopContextMenuChevronStyle}
        />
      ) : null}
    </button>
  );
}

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

function getDesktopContextMenuHighlightStyle(state: KernelOnDesktopMenuItemProps['state']) {
  if (state === 'pressed') {
    return desktopContextMenuPressedHighlightStyle;
  }

  return desktopContextMenuHighlightStyle;
}

function getDesktopContextMenuItemStyle(state: KernelOnDesktopMenuItemProps['state']) {
  if (state === 'pressed') {
    return desktopContextMenuPressedItemStyle;
  }

  if (state === 'hovered') {
    return desktopContextMenuHoveredItemStyle;
  }

  return desktopContextMenuIdleItemStyle;
}

const desktopContextMenuTextStyle = {
  letterSpacing: 0,
} as CSSProperties;

const desktopContextMenuIconStyle = {
  color: 'rgba(255,255,255,0.88)',
  filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.22)) drop-shadow(0 0 5px rgba(255,255,255,0.22))',
  opacity: 0.86,
} as CSSProperties;

const desktopContextMenuChevronStyle = {
  filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.30)) drop-shadow(0 0 5px rgba(255,255,255,0.28))',
} as CSSProperties;

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
