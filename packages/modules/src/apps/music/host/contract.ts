export interface MineradioDesktopWindowState {
  hasDisplayOnLeft?: boolean;
  isFocused: boolean;
  isFullScreen: boolean;
  isHtmlFullScreen: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  isNativeFullScreen: boolean;
  isPrimaryDisplay?: boolean;
  isVisible: boolean;
  isWindowFullScreen: boolean;
}

export interface MineradioOperationResult {
  ok: boolean;
  canceled?: boolean;
  error?: string;
}

export interface MineradioLoginResult extends MineradioOperationResult {
  cookie?: string;
  message?: string;
  partial?: boolean;
  reused?: boolean;
}

export interface MineradioJsonExportRequest {
  data?: Readonly<Record<string, unknown>>;
  defaultName?: string;
  text?: string;
}

export interface MineradioJsonFileResult extends MineradioOperationResult {
  filePath?: string;
  text?: string;
}

export interface MineradioGlobalHotkeyBinding {
  accelerator: string;
  action: string;
}

export interface MineradioGlobalHotkeyResult extends MineradioGlobalHotkeyBinding {
  error?: string;
  ok: boolean;
}

export interface MineradioGlobalHotkeyConfiguration {
  results: MineradioGlobalHotkeyResult[];
}

export interface MineradioAccountCapabilities {
  clearNeteaseLogin(): Promise<MineradioOperationResult>;
  clearQQLogin(): Promise<MineradioOperationResult>;
  openNeteaseLogin(): Promise<MineradioLoginResult>;
  openQQLogin(): Promise<MineradioLoginResult>;
}

export interface MineradioFileCapabilities {
  exportJsonFile(payload: MineradioJsonExportRequest): Promise<MineradioJsonFileResult>;
  importJsonFile(): Promise<MineradioJsonFileResult>;
}

export interface MineradioGlobalShortcutCapabilities {
  configure(bindings: MineradioGlobalHotkeyBinding[]): Promise<MineradioGlobalHotkeyConfiguration>;
  subscribe(callback: (payload: Readonly<{ action: string }>) => void): () => void;
}

export interface MineradioDesktopLyricsCapabilities {
  setEnabled(
    enabled: boolean,
    payload: Readonly<Record<string, unknown>>,
  ): Promise<MineradioOperationResult>;
  subscribeEnabledState(callback: (state: Readonly<Record<string, unknown>>) => void): () => void;
  subscribeLockState(callback: (state: Readonly<Record<string, unknown>>) => void): () => void;
  update(payload: Readonly<Record<string, unknown>>): Promise<MineradioOperationResult>;
}

export interface MineradioWallpaperCapabilities {
  setEnabled(
    enabled: boolean,
    payload: Readonly<Record<string, unknown>>,
  ): Promise<MineradioOperationResult>;
  update(payload: Readonly<Record<string, unknown>>): Promise<MineradioOperationResult>;
}

export interface MineradioUpdaterCapabilities {
  openInstaller(filePath: string): Promise<MineradioOperationResult>;
  restart(): Promise<MineradioOperationResult>;
}

/**
 * Platform capabilities are injected by the Web or Tauri composition root.
 * Missing capability groups are intentional host limitations, not optional
 * half-implementations. The compatibility facade below exposes only the
 * methods that the original Mineradio runtime is allowed to discover.
 */
export interface MineradioPlatformAdapter {
  readonly accounts?: MineradioAccountCapabilities;
  readonly desktopLyrics?: MineradioDesktopLyricsCapabilities;
  readonly files: MineradioFileCapabilities;
  readonly globalShortcuts?: MineradioGlobalShortcutCapabilities;
  readonly kind: 'tauri' | 'web';
  readonly updater?: MineradioUpdaterCapabilities;
  readonly wallpaper?: MineradioWallpaperCapabilities;
}

export interface MineradioDesktopWindowFacade {
  readonly isDesktop: boolean;
  clearNeteaseMusicLogin?(): Promise<MineradioOperationResult>;
  clearQQMusicLogin?(): Promise<MineradioOperationResult>;
  close(): Promise<void>;
  configureGlobalHotkeys?(
    bindings: MineradioGlobalHotkeyBinding[],
  ): Promise<MineradioGlobalHotkeyConfiguration>;
  exitFullscreenWindowed(): Promise<void>;
  exportJsonFile?(payload: MineradioJsonExportRequest): Promise<MineradioJsonFileResult>;
  getState(): Promise<MineradioDesktopWindowState>;
  importJsonFile?(): Promise<MineradioJsonFileResult>;
  minimize(): Promise<void>;
  onDesktopLyricsEnabledState?(
    callback: (state: Readonly<Record<string, unknown>>) => void,
  ): () => void;
  onDesktopLyricsLockState?(
    callback: (state: Readonly<Record<string, unknown>>) => void,
  ): () => void;
  onGlobalHotkey?(callback: (payload: Readonly<{ action: string }>) => void): () => void;
  onStateChange(callback: (state: MineradioDesktopWindowState) => void): () => void;
  openNeteaseMusicLogin?(): Promise<MineradioLoginResult>;
  openQQMusicLogin?(): Promise<MineradioLoginResult>;
  openUpdateInstaller?(filePath: string): Promise<MineradioOperationResult>;
  restartApp?(): Promise<MineradioOperationResult>;
  setDesktopLyricsEnabled?(
    enabled: boolean,
    payload: Readonly<Record<string, unknown>>,
  ): Promise<MineradioOperationResult>;
  setWallpaperMode?(
    enabled: boolean,
    payload: Readonly<Record<string, unknown>>,
  ): Promise<MineradioOperationResult>;
  toggleFullscreen(): Promise<void>;
  toggleMaximize(): Promise<void>;
  updateDesktopLyrics?(
    payload: Readonly<Record<string, unknown>>,
  ): Promise<MineradioOperationResult>;
  updateWallpaperMode?(
    payload: Readonly<Record<string, unknown>>,
  ): Promise<MineradioOperationResult>;
}

export interface MineradioHost {
  /** Acquire native capability ownership for one mounted runtime generation. */
  acquireAppCapabilities(): () => void;
  bindWindowChrome(root: HTMLElement): () => void;
  readonly desktopWindow: MineradioDesktopWindowFacade;
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  readonly indexedDB?: IDBFactory;
  readonly localStorage: Storage;
}
