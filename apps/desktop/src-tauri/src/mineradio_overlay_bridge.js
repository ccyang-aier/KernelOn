(() => {
  'use strict';

  const listeners = {
    lyrics: new Set(),
    wallpaper: new Set(),
  };
  const latest = Object.create(null);
  const invoke = (command, args = {}) => {
    const tauri = window.__TAURI_INTERNALS__;
    if (!tauri || typeof tauri.invoke !== 'function') {
      return Promise.reject(new Error('TAURI_INVOKE_UNAVAILABLE'));
    }
    return tauri.invoke(command, args);
  };
  const bind = (channel, callback) => {
    if (typeof callback !== 'function') return () => {};
    listeners[channel].add(callback);
    if (Object.prototype.hasOwnProperty.call(latest, channel)) {
      callback(latest[channel] || {});
    }
    return () => listeners[channel].delete(callback);
  };

  Object.defineProperty(window, '__kernelonMineradioOverlayDispatch', {
    configurable: false,
    enumerable: false,
    value(channel, payload) {
      if (!listeners[channel]) return;
      latest[channel] = payload || {};
      if (channel === 'lyrics' && window.__kernelonMineradioWindowOpacitySupported) {
        const requestedOpacity = Number(latest[channel].opacity);
        const opacity = Number.isFinite(requestedOpacity)
          ? Math.max(0.28, Math.min(1, requestedOpacity))
          : 0.92;
        document.documentElement.style.opacity = String(opacity);
      }
      listeners[channel].forEach((callback) => callback(latest[channel]));
    },
    writable: false,
  });

  Object.defineProperty(window, 'desktopOverlay', {
    configurable: false,
    enumerable: true,
    value: Object.freeze({
      onLyricsState: (callback) => bind('lyrics', callback),
      onWallpaperState: (callback) => bind('wallpaper', callback),
      setLyricsDrag: (dragging) =>
        invoke('mineradio_overlay_set_lyrics_dragging', { dragging: !!dragging }),
      setLyricsPointerCapture: (active) =>
        invoke('mineradio_overlay_set_lyrics_pointer_capture', { active: !!active }),
      setLyricsHotBounds: (bounds) =>
        invoke('mineradio_overlay_set_lyrics_hot_bounds', { bounds: bounds || {} }),
      setLyricsLockState: (locked) =>
        invoke('mineradio_overlay_set_lyrics_lock_state', { locked: !!locked }),
      moveLyricsBy: (dx, dy) =>
        invoke('mineradio_overlay_move_lyrics_by', {
          dx: Number(dx) || 0,
          dy: Number(dy) || 0,
        }),
      closeLyrics: () =>
        invoke('mineradio_set_desktop_lyrics_enabled', { enabled: false, payload: {} }),
    }),
    writable: false,
  });
})();
